import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Map from '../components/map/Map';
import AssetSidebar from '../components/assets/AssetSidebar';
import AssetDetail from '../components/assets/AssetDetail';
import DamagePointForm from '../components/assets/DamagePointForm';

export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [filters, setFilters] = useState({ assetType: '', status: '', search: '' });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [presetLocation, setPresetLocation] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  
  // AI Routing state
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Citizen Routing state
  const [routingMode, setRoutingMode] = useState(null);
  const [routeStart, setRouteStart] = useState(null);
  const [routeEnd, setRouteEnd] = useState(null);
  const [customRouteData, setCustomRouteData] = useState(null);
  const [loadingCustomRoute, setLoadingCustomRoute] = useState(false);

  const fileInputRef = useRef(null);

  const handleImportGeoJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const geojson = JSON.parse(evt.target.result);
        if (!geojson.features || !Array.isArray(geojson.features)) {
          alert('Tệp không đúng định dạng GeoJSON (thiếu mảng features)');
          return;
        }

        const confirmImport = window.confirm(`Bạn có chắc muốn nhập ${geojson.features.length} đối tượng từ tệp GeoJSON này?`);
        if (!confirmImport) return;

        setLoading(true);
        const res = await client.post('/import/geojson', {
          features: geojson.features,
          source: 'manual'
        });

        alert(`Nhập thành công ${res.data.imported} đối tượng! Có ${res.data.errors?.length || 0} lỗi.`);
        fetchAssets();
      } catch (err) {
        console.error('Import GeoJSON failed:', err);
        alert('Lỗi nhập GeoJSON: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 200 };
      if (filters.assetType) params.assetType = filters.assetType;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await client.get('/assets', { params });
      setAssets(res.data.items);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchAreas = useCallback(async () => {
    try {
      const res = await client.get('/areas');
      setAreas(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch areas:', err);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchAreas();
  }, [fetchAssets, fetchAreas]);

  useEffect(() => {
    const assetId = searchParams.get('assetId') || selectedAsset?.id;
    if (assetId && assets.length > 0) {
      const found = assets.find(a => a.id === assetId);
      if (found && JSON.stringify(found) !== JSON.stringify(selectedAsset)) {
        setSelectedAsset(found);
      }
    }
  }, [assets, searchParams, selectedAsset?.id]);

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    setShowForm(false);
    setEditingAsset(null);
    setIsPickingLocation(false);
  };

  const handleCreateNew = () => {
    setEditingAsset(null);
    setShowForm(true);
    setSelectedAsset(null);
    setPresetLocation(null);
    setIsPickingLocation(true);
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setShowForm(true);
    setSelectedAsset(null);
    setIsPickingLocation(false);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAsset(null);
    setIsPickingLocation(false);
    setPresetLocation(null);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingAsset(null);
    setIsPickingLocation(false);
    setPresetLocation(null);
    fetchAssets();
    setToastMessage('Thao tác thành công !');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDetailClose = () => {
    setSelectedAsset(null);
  };

  const startRouting = () => {
    setRoutingMode('start');
    setRouteStart(null);
    setRouteEnd(null);
    setCustomRouteData(null);
    setToastMessage('Chọn điểm xuất phát trên bản đồ');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const cancelRouting = () => {
    setRoutingMode(null);
    setRouteStart(null);
    setRouteEnd(null);
    setCustomRouteData(null);
  };

  const fetchCustomRoute = async (startPt, endPt) => {
    try {
      setLoadingCustomRoute(true);
      const startStr = `${startPt[1]},${startPt[0]}`;
      const endStr = `${endPt[1]},${endPt[0]}`;
      const res = await client.get(`/reports/routing/custom`, {
        params: { start: startStr, end: endStr }
      });
      setCustomRouteData(res.data);
      setRoutingMode('active');
      if (res.data.warnings?.length > 0) {
        setToastMessage(`⚠️ Cảnh báo: Có ${res.data.warnings.length} điểm ngập lụt/thi công dọc tuyến!`);
      } else {
        setToastMessage('Lộ trình an toàn, không có điểm ngập lụt!');
      }
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Custom route failed:', err);
      alert('Lỗi tính toán lộ trình: ' + (err.response?.data?.message || err.message));
      cancelRouting();
    } finally {
      setLoadingCustomRoute(false);
    }
  };

  const handleLocationPicked = (latLng) => {
    if (routingMode === 'start') {
      setRouteStart(latLng);
      setRoutingMode('end');
      setToastMessage('Chọn điểm đến trên bản đồ');
      setTimeout(() => setToastMessage(''), 3000);
    } else if (routingMode === 'end') {
      setRouteEnd(latLng);
      fetchCustomRoute(routeStart, latLng);
    } else {
      setPresetLocation(latLng);
      setIsPickingLocation(false);
    }
  };

  const handleStartPickingLocation = () => {
    setIsPickingLocation(true);
  };

  const generateOptimalRoute = async () => {
    try {
      setLoadingRoute(true);
      const res = await client.get('/reports/routing');
      setRouteData(res.data);
      if (res.data.route && res.data.route.length > 0) {
        setToastMessage(`Đã tạo lộ trình qua ${res.data.route.length} điểm sự cố!`);
        setTimeout(() => setToastMessage(''), 3000);
      } else {
        alert('Không có sự cố nào đang mở để tạo lộ trình.');
      }
    } catch (err) {
      console.error('Failed to generate route:', err);
      alert('Lỗi tạo lộ trình: ' + err.message);
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="h-full flex relative min-w-0 min-h-0">
      {/* Sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-3 left-3 z-[1000] p-2 bg-surface-800/90 backdrop-blur-xl border border-surface-700/50 rounded-lg text-surface-300 hover:text-white hover:bg-surface-700/90 transition-all duration-200 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          )}
        </svg>
      </button>

      {/* Left sidebar */}
      <div className={`transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
        <AssetSidebar
          assets={assets}
          loading={loading}
          filters={filters}
          onFilterChange={setFilters}
          onAssetClick={handleAssetClick}
          onCreateNew={handleCreateNew}
          selectedAssetId={selectedAsset?.id}
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative min-w-0 min-h-0">
        <Map
          assets={assets}
          areas={areas}
          onAssetClick={handleAssetClick}
          selectedAssetId={selectedAsset?.id}
          focusAsset={selectedAsset}
          isPickingLocation={isPickingLocation || routingMode === 'start' || routingMode === 'end'}
          onLocationPicked={handleLocationPicked}
          pickerPosition={presetLocation}
          showAreaLayer={false}
          routePolyline={routeData?.polyline || customRouteData?.polyline}
        />

        {(user?.role === 'admin' || user?.role === 'technician') && (
          <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {user?.role === 'admin' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.geojson"
                    onChange={handleImportGeoJSON}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-surface-800/90 hover:bg-surface-700/90 text-white rounded-lg shadow-lg border border-surface-700/50 flex items-center gap-2 font-medium transition-all duration-200"
                  >
                    🗺️ Nhập GeoJSON
                  </button>
                </>
              )}
              <button
                onClick={routeData ? () => setRouteData(null) : generateOptimalRoute}
                disabled={loadingRoute}
                className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-medium transition-all duration-200 ${
                  routeData 
                    ? 'bg-red-500/90 hover:bg-red-500 text-white border border-red-400/50'
                    : 'bg-primary-600/90 hover:bg-primary-500 text-white border border-primary-500/50'
                }`}
              >
                {loadingRoute ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : routeData ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Xoá lộ trình
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    AI Lộ trình ưu tiên
                  </>
                )}
              </button>
            </div>
            
            {routeData && (
              <div className="p-3 bg-surface-900/95 backdrop-blur-xl border border-surface-700/50 rounded-lg shadow-xl text-sm w-full">
                <p className="text-surface-300 font-medium mb-1">Thông tin lộ trình:</p>
                <p className="text-surface-400">• Tổng điểm: <span className="text-primary-400 font-bold">{routeData.route?.length}</span></p>
                <p className="text-surface-400">• Khoảng cách: <span className="text-primary-400 font-bold">{(routeData.distance / 1000).toFixed(1)} km</span></p>
                <p className="text-surface-400">• Thời gian: <span className="text-primary-400 font-bold">{Math.round(routeData.duration / 60)} phút</span></p>
              </div>
            )}
          </div>
        )}

        {user?.role === 'user' && (
          <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
            <button
              onClick={routingMode ? cancelRouting : startRouting}
              disabled={loadingCustomRoute}
              className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-medium transition-all duration-200 ${
                routingMode 
                  ? 'bg-red-500/90 hover:bg-red-500 text-white border border-red-400/50'
                  : 'bg-primary-600/90 hover:bg-primary-500 text-white border border-primary-500/50'
              }`}
            >
              {loadingCustomRoute ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : routingMode ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hủy chỉ đường
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Chỉ đường tránh ngập lụt
                </>
              )}
            </button>

            {customRouteData && (
              <div className="p-4 bg-surface-900/95 backdrop-blur-xl border border-surface-700/50 rounded-2xl shadow-2xl text-sm w-80 space-y-3">
                <div>
                  <h4 className="font-semibold text-white">Thông tin lộ trình:</h4>
                  <p className="text-xs text-surface-400 mt-0.5">Lộ trình ngắn nhất từ OSRM</p>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-surface-800/30 p-2.5 rounded-xl border border-surface-700/30 text-xs">
                  <div>
                    <span className="text-surface-500">Khoảng cách</span>
                    <p className="font-bold text-primary-400 mt-0.5">{(customRouteData.distance / 1000).toFixed(1)} km</p>
                  </div>
                  <div>
                    <span className="text-surface-500">Thời gian</span>
                    <p className="font-bold text-primary-400 mt-0.5">{Math.round(customRouteData.duration / 60)} phút</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-surface-300">Cảnh báo dọc đường:</span>
                  {(!customRouteData.warnings || customRouteData.warnings.length === 0) ? (
                    <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                      ✅ Tuyến đường an toàn, không có điểm ngập lụt hay hư hỏng.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {customRouteData.warnings.map((warn, i) => (
                        <div key={i} className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs flex gap-2">
                          <span className="text-sm mt-0.5">⚠️</span>
                          <div>
                            <p className="font-medium text-red-400 leading-tight">{warn.name}</p>
                            <p className="text-[10px] text-surface-500 mt-0.5">Cách lộ trình khoảng {warn.distanceApproxMeters}m</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {(isPickingLocation || routingMode === 'start' || routingMode === 'end') && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-blue-600/90 backdrop-blur-sm rounded-full text-white text-sm font-medium shadow-lg animate-bounce">
            {routingMode === 'start' ? 'Click để chọn điểm Xuất phát (A)' : 
             routingMode === 'end' ? 'Click để chọn điểm Kết thúc (B)' : 
             'Click vào bản đồ để đánh dấu điểm hư hỏng'}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-[2000] animate-fade-in">
          <div className="bg-emerald-500/90 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-lg border border-emerald-400/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Right panel - Asset detail or form */}
      {(selectedAsset || showForm) && (
        <div className="w-96 min-w-0 flex-shrink-0 border-l border-surface-700/50 bg-surface-900/95 backdrop-blur-xl overflow-y-auto animate-slide-right">
          {showForm ? (
            <DamagePointForm
              asset={editingAsset}
              onClose={handleFormClose}
              onSaved={handleFormSaved}
              presetLocation={presetLocation}
              isPickingLocation={isPickingLocation}
              onStartPickingLocation={handleStartPickingLocation}
            />
          ) : (
            <AssetDetail
              asset={selectedAsset}
              onClose={handleDetailClose}
              onEdit={handleEdit}
              onRefresh={fetchAssets}
            />
          )}
        </div>
      )}
    </div>
  );
}
