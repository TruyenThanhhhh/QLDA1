import { useAuth } from '../../contexts/AuthContext';

const typeIcons = {
  road: '🛣️', sign: '🪧',
  traffic_light: '🚦', manhole: '🕳️', lamp_post: '💡',
  bus_station: '🚌', parking: '🅿️',
};
const typeLabels = {
  road: 'Đường', sign: 'Biển báo',
  traffic_light: 'Đèn TH', manhole: 'Nắp cống', lamp_post: 'Cột đèn',
  bus_station: 'Trạm xe buýt', parking: 'Bãi đỗ xe',
};
const statusLabels = { good: 'Tốt', fair: 'TB', damaged: 'Hỏng' };
const statusStyles = {
  good: 'bg-emerald-500/20 text-emerald-400',
  fair: 'bg-amber-500/20 text-amber-400',
  damaged: 'bg-red-500/20 text-red-400',
};

export default function AssetSidebar({ assets, loading, filters, onFilterChange, onAssetClick, onCreateNew, selectedAssetId }) {
  const { hasRole } = useAuth();

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  return (
    <div className="h-full flex flex-col bg-surface-900/95 backdrop-blur-xl border-r border-surface-700/50">
      {/* Header */}
      <div className="p-4 border-b border-surface-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Tài sản</h2>
          {hasRole('admin', 'technician', 'user') && (
            <button onClick={onCreateNew} className="btn-primary text-xs px-3 py-1.5">
              {hasRole('user') ? '📍 Báo cáo hư hỏng' : '+ Thêm mới'}
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Tìm kiếm mã hoặc tên..."
          value={filters.search}
          onChange={handleSearchChange}
          className="input-field text-sm mb-3"
        />

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filters.assetType}
            onChange={(e) => onFilterChange({ ...filters, assetType: e.target.value })}
            className="select-field text-xs flex-1"
          >
            <option value="">Tất cả loại</option>
            <option value="road">🛣️ Đường</option>
            <option value="sign">🪧 Biển báo</option>
            <option value="traffic_light">🚦 Đèn TH</option>
            <option value="manhole">🕳️ Nắp cống</option>
            <option value="lamp_post">💡 Cột đèn</option>
            <option value="bus_station">🚌 Trạm xe buýt</option>
            <option value="parking">🅿️ Bãi đỗ xe</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="select-field text-xs flex-1"
          >
            <option value="">Tất cả TT</option>
            <option value="good">🟢 Tốt</option>
            <option value="fair">🟡 Trung bình</option>
            <option value="damaged">🔴 Hư hỏng</option>
          </select>
        </div>
      </div>

      {/* Asset count */}
      <div className="px-4 py-2 border-b border-surface-700/30 flex-shrink-0">
        <p className="text-xs text-surface-500">{assets.length} tài sản</p>
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-surface-500 text-sm">
            Không tìm thấy tài sản nào
          </div>
        ) : (
          <div className="divide-y divide-surface-700/30">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => onAssetClick(asset)}
                className={`w-full text-left px-4 py-3 hover:bg-surface-800/50 transition-colors duration-150 ${
                  selectedAssetId === asset.id ? 'bg-primary-600/10 border-l-2 border-primary-500' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5 flex-shrink-0">{typeIcons[asset.assetType]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-surface-200 truncate">{asset.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-surface-500 font-mono">{asset.assetCode}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${statusStyles[asset.status]}`}>
                        {statusLabels[asset.status]}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
