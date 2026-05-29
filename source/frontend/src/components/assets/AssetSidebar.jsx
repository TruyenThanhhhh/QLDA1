import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // ĐÃ THÊM

const typeIcons = {
  road: '🛣️', sign: '🪧', traffic_light: '🚦', 
  manhole: '🕳️', lamp_post: '💡', osm_location: '📍'
};
const typeLabels = {
  road: 'Đường', sign: 'Biển báo', traffic_light: 'Đèn TH', 
  manhole: 'Nắp cống', lamp_post: 'Cột đèn', osm_location: 'Địa điểm'
};
const statusLabels = { good: 'Tốt', fair: 'TB', damaged: 'Hỏng', none: '' };
const statusStyles = {
  good: 'bg-emerald-500/20 text-emerald-400',
  fair: 'bg-amber-500/20 text-amber-400',
  damaged: 'bg-red-500/20 text-red-400',
  none: 'hidden'
};

export default function AssetSidebar({ 
  assets, 
  loading, 
  filters, 
  onFilterChange, 
  onAssetClick, 
  onCreateNew, 
  selectedAssetId,
  onRouteFound 
}) {
  const { hasRole, user } = useAuth(); 
  const navigate = useNavigate(); // ĐÃ THÊM Hook chuyển trang

  const [osmResults, setOsmResults] = useState([]);
  const [isSearchingOSM, setIsSearchingOSM] = useState(false);
  const [routingMode, setRoutingMode] = useState(false);
  const [startQuery, setStartQuery] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [routeSuggestions, setRouteSuggestions] = useState([]);
  const [showRouteSuggestions, setShowRouteSuggestions] = useState(false);

  useEffect(() => {
    const search = filters.search?.trim();
    if (!search || search.length < 2) {
      setOsmResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOSM(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(search)}&bbox=107.8,15.9,108.4,16.2&limit=5`);
        const data = await res.json();
        
        if (data.features) {
          const formattedOsm = data.features.map(f => {
            const { name, street, housenumber, district, city } = f.properties;
            const displayName = name || street || 'Địa điểm';
            const address = [housenumber, street, district, city].filter(Boolean).join(', ');
            
            return {
              id: `osm-${f.properties.osm_id || Math.random()}`,
              name: displayName,
              assetCode: 'Bản đồ',
              assetType: 'osm_location',
              status: 'none',
              geometry: {
                type: 'Point',
                coordinates: [f.geometry.coordinates[0], f.geometry.coordinates[1]] 
              },
              fullAddress: address
            };
          }).filter(item => item.name !== 'Địa điểm');

          const uniqueOsm = [];
          const seenNames = new Set();
          formattedOsm.forEach(item => {
            if (!seenNames.has(item.name)) {
              seenNames.add(item.name);
              uniqueOsm.push(item);
            }
          });
          
          setOsmResults(uniqueOsm);
        }
      } catch (error) {
        console.error("OSM Search Error:", error);
      } finally {
        setIsSearchingOSM(false);
      }
    }, 600); 

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    const query = startQuery?.trim();
    if (!query || query.length < 2 || query === 'Vị trí của bạn' || startCoords !== null) {
      setRouteSuggestions([]);
      setShowRouteSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&bbox=107.8,15.9,108.4,16.2&limit=5`);
        const data = await res.json();
        
        if (data.features && data.features.length > 0) {
          const formatted = data.features.map(f => {
            const { name, street, housenumber, district, city } = f.properties;
            const displayName = name || street || 'Địa điểm';
            const address = [housenumber, street, district, city].filter(Boolean).join(', ');
            return {
              name: displayName,
              address: address,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0]
            };
          }).filter(item => item.name !== 'Địa điểm');

          const unique = [];
          const seen = new Set();
          formatted.forEach(item => {
            if (!seen.has(item.name)) {
              seen.add(item.name);
              unique.push(item);
            }
          });
          
          setRouteSuggestions(unique);
          setShowRouteSuggestions(true);
        } else {
          setRouteSuggestions([]);
        }
      } catch (error) {
        console.error("Route Suggestion Error:", error);
      }
    }, 500); 

    return () => clearTimeout(timer);
  }, [startQuery, startCoords]);

  useEffect(() => {
    setRoutingMode(false);
    setStartQuery('');
    setStartCoords(null);
    setRouteError('');
    setShowRouteSuggestions(false);
    if (onRouteFound) onRouteFound(null);
    window.dispatchEvent(new CustomEvent('map:clearRoute')); 
  }, [selectedAssetId]);

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const combinedAssets = [...assets, ...osmResults];

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setStartQuery('Đang lấy vị trí...');
      setShowRouteSuggestions(false);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStartCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setStartQuery('Vị trí của bạn');
          setRouteError('');
        },
        () => setRouteError('Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập.')
      );
    } else {
      setRouteError('Trình duyệt không hỗ trợ GPS.');
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setStartQuery(suggestion.name);
    setStartCoords({ lat: suggestion.lat, lng: suggestion.lng });
    setShowRouteSuggestions(false);
    setRouteError('');
  };

  const calculateRoute = async (destinationAsset) => {
    setShowRouteSuggestions(false);
    setRouteError('');
    if (!startQuery) {
      setRouteError('Vui lòng nhập điểm đi!');
      return;
    }

    const endCoords = destinationAsset.geometry?.coordinates; 
    if (!endCoords) {
      setRouteError('Địa điểm này không có tọa độ hợp lệ.');
      return;
    }

    setIsRouting(true);
    try {
      let currentStartCoords = startCoords;
      
      if (!currentStartCoords && startQuery !== 'Vị trí của bạn') {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(startQuery)}&bbox=107.8,15.9,108.4,16.2&limit=1`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          currentStartCoords = { 
            lat: data.features[0].geometry.coordinates[1], 
            lng: data.features[0].geometry.coordinates[0] 
          };
          setStartCoords(currentStartCoords);
        } else {
          setRouteError(`Không tìm thấy địa chỉ: ${startQuery}`);
          setIsRouting(false);
          return;
        }
      }

      if (currentStartCoords) {
        const damagedPoints = assets.filter(a => a.status === 'damaged' && a.geometry?.type === 'Point');
        const nogos = damagedPoints.map(a => `${a.geometry.coordinates[0]},${a.geometry.coordinates[1]},50`).join('|');

        let brouterUrl = `https://brouter.de/brouter?lonlats=${currentStartCoords.lng},${currentStartCoords.lat}|${endCoords[0]},${endCoords[1]}&profile=car-fast&alternativeidx=0&format=geojson`;
        if (nogos) {
          brouterUrl += `&nogos=${nogos}`;
        }

        try {
          const res = await fetch(brouterUrl);
          if (res.ok) {
            const routeData = await res.json();
            if (routeData.features && routeData.features.length > 0) {
              const geometry = routeData.features[0].geometry;
              if (onRouteFound) onRouteFound(geometry);
              window.dispatchEvent(new CustomEvent('map:routeFound', { detail: geometry }));
              setIsRouting(false);
              return; 
            }
          }
        } catch (err) {
          console.warn("BRouter failed, falling back to OSRM", err);
        }

        const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${currentStartCoords.lng},${currentStartCoords.lat};${endCoords[0]},${endCoords[1]}?overview=full&geometries=geojson`);
        const routeData = await osrmRes.json();
        
        if (routeData.routes && routeData.routes[0]) {
          const geometry = routeData.routes[0].geometry;
          if (onRouteFound) onRouteFound(geometry);
          window.dispatchEvent(new CustomEvent('map:routeFound', { detail: geometry }));
        } else {
          setRouteError('Không thể tìm thấy đường đi ô tô tới đây.');
        }
      }
    } catch (error) {
      setRouteError('Lỗi kết nối khi tìm đường.');
    }
    setIsRouting(false);
  };

  return (
    <div className="h-full flex flex-col bg-surface-900/95 backdrop-blur-xl border-r border-surface-700/50 font-sans">
      {/* Header & Search */}
      <div className="p-4 border-b border-surface-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Tra cứu Bản đồ</h2>
          
          {/* ĐÃ THÊM: Nút Quản trị User dành riêng cho Admin */}
          {user?.role === 'admin' && (
            <button 
              onClick={() => navigate('/users')}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-2 py-1.5 rounded-md shadow-sm transition-colors flex items-center gap-1"
            >
              ⚙️ QUẢN TRỊ
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Nhập 1 phần tên đường, địa điểm..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          className="w-full bg-surface-800 text-surface-200 text-sm border border-surface-600 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-primary-500 transition-colors"
        />

        <div className="flex gap-2">
          <select
            value={filters.assetType || ''}
            onChange={(e) => onFilterChange({ ...filters, assetType: e.target.value })}
            className="w-full bg-surface-800 text-surface-200 text-xs border border-surface-600 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="">Tất cả loại</option>
            <option value="road">🛣️ Đường</option>
            <option value="traffic_light">🚦 Đèn TH</option>
            <option value="manhole">🕳️ Nắp cống</option>
          </select>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full bg-surface-800 text-surface-200 text-xs border border-surface-600 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="">Tất cả TT</option>
            <option value="good">🟢 Tốt</option>
            <option value="damaged">🔴 Hư hỏng</option>
          </select>
        </div>
      </div>

      {/* Asset count */}
      <div className="px-4 py-2 border-b border-surface-700/30 flex-shrink-0 flex justify-between items-center">
        <p className="text-xs text-surface-500">{combinedAssets.length} kết quả</p>
        {isSearchingOSM && <span className="text-xs text-primary-400 animate-pulse">Đang tìm thông minh...</span>}
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : combinedAssets.length === 0 ? (
          <div className="p-8 text-center text-surface-500 text-sm">
            Không tìm thấy kết quả nào phù hợp
          </div>
        ) : (
          <div className="divide-y divide-surface-700/30">
            {combinedAssets.map((asset) => (
              <div key={asset.id} className="flex flex-col">
                <button
                  onClick={() => onAssetClick(asset)}
                  className={`w-full text-left px-4 py-3 hover:bg-surface-800/50 transition-colors duration-150 ${
                    selectedAssetId === asset.id ? 'bg-primary-600/10 border-l-2 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg mt-0.5 flex-shrink-0">{typeIcons[asset.assetType] || '📍'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-surface-200 truncate">{asset.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-surface-500 font-mono">{asset.assetCode}</span>
                        {asset.status !== 'none' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${statusStyles[asset.status]}`}>
                            {statusLabels[asset.status]}
                          </span>
                        )}
                      </div>
                      {asset.fullAddress && (
                        <p className="text-[10px] text-surface-500 mt-1 truncate">{asset.fullAddress}</p>
                      )}
                    </div>
                  </div>
                </button>

                {/* KHU VỰC HIỂN THỊ KHI ĐƯỢC CHỌN */}
                {selectedAssetId === asset.id && (
                  <div className="px-4 pb-4 pt-1 bg-primary-600/5">
                    
                    {/* View Mặc định: Hiển thị nút theo Role */}
                    {!routingMode ? (
                      <div className="flex flex-row gap-2 mt-2 flex-wrap">
                        <button 
                          onClick={() => setRoutingMode(true)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-1 rounded-md transition-colors flex items-center justify-center gap-1 shadow-sm min-w-[100px]"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                          TÌM ĐƯỜNG
                        </button>
                        
                        {/* HIỂN THỊ CHỨC NĂNG RIÊNG CHO ROLE LÃNH ĐẠO / ADMIN */}
                        {user?.role === 'leader' || user?.role === 'admin' ? (
                          <>
                            <button 
                              onClick={() => alert('Chức năng GIAO VIỆC đang được phát triển')}
                              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-2 px-1 rounded-md transition-colors flex items-center justify-center gap-1 shadow-sm min-w-[100px]"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                              GIAO VIỆC
                            </button>
                            <button 
                              onClick={() => alert('Chức năng PHÊ DUYỆT đang được phát triển')}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-1 rounded-md transition-colors flex items-center justify-center gap-1 shadow-sm min-w-[100px]"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              PHÊ DUYỆT
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={onCreateNew}
                            className="flex-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold py-2 px-1 rounded-md transition-colors flex items-center justify-center gap-1 shadow-sm min-w-[100px]"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            BÁO LỖI
                          </button>
                        )}
                      </div>
                    ) : (
                      
                      /* View khi bấm Tìm đường: Hiển thị Input nhập điểm đi kèm Autocomplete */
                      <div className="mt-2 p-3 bg-surface-900 rounded-md border border-surface-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-400">Chỉ đường tới đây</span>
                          <button onClick={() => setRoutingMode(false)} className="text-surface-500 hover:text-white text-xs">✕ Hủy</button>
                        </div>
                        
                        {/* Wrapper relative cho Dropdown */}
                        <div className="relative mb-2">
                          <input 
                            type="text" 
                            placeholder="Nhập 1 phần địa chỉ đi..." 
                            value={startQuery}
                            onChange={(e) => { 
                              setStartQuery(e.target.value); 
                              setStartCoords(null); 
                              setShowRouteSuggestions(true);
                            }}
                            onFocus={() => { if (routeSuggestions.length > 0) setShowRouteSuggestions(true); }}
                            className="w-full bg-surface-800 text-surface-200 text-xs border border-surface-600 rounded flex-1 px-2 py-2 pr-8 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <button 
                            onClick={handleGetCurrentLocation}
                            title="Lấy vị trí của tôi"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 hover:text-blue-400"
                          >
                            🧭
                          </button>

                          {/* Box Dropdown Gợi ý */}
                          {showRouteSuggestions && routeSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface-800 border border-surface-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                              {routeSuggestions.map((item, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSelectSuggestion(item)}
                                  className="w-full text-left px-3 py-2 hover:bg-surface-700 transition-colors border-b border-surface-700/50 last:border-0"
                                >
                                  <p className="text-xs font-medium text-surface-200 truncate">{item.name}</p>
                                  {item.address && (
                                    <p className="text-[10px] text-surface-500 truncate mt-0.5">{item.address}</p>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {routeError && <p className="text-red-400 text-[10px] mb-2">{routeError}</p>}

                        <button 
                          onClick={() => calculateRoute(asset)}
                          disabled={isRouting}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2 rounded transition-colors"
                        >
                          {isRouting ? 'Đang vẽ đường...' : 'BẮT ĐẦU VẼ ĐƯỜNG'}
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}