import { useState, useEffect } from 'react';
import client from '../api/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { exportToCSV } from '../utils/export';

const STATUS_COLORS = { good: '#22c55e', fair: '#f59e0b', damaged: '#ef4444' };
const STATUS_LABELS = { good: 'Tốt', fair: 'Trung bình', damaged: 'Hư hỏng' };
const TYPE_LABELS = {
  road: 'Đường', sign: 'Biển báo',
  traffic_light: 'Đèn TH', manhole: 'Nắp cống', lamp_post: 'Cột đèn', sidewalk: 'Vỉa hè',
};
const BAR_COLORS = ['#327fff', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [priority, setPriority] = useState([]);
  const [pendingAssets, setPendingAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, incRes, priRes, pendRes] = await Promise.all([
          client.get('/reports/summary'),
          client.get('/reports/incidents'),
          client.get('/reports/priority'),
          client.get('/assets', { params: { approvalStatus: 'pending', limit: 10 } }),
        ]);
        setSummary(sumRes.data);
        setIncidents(incRes.data);
        setPriority(priRes.data);
        setPendingAssets(pendRes.data.items || []);
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleExportExcel = () => {
    if (!summary) return;
    const exportData = [];
    if (summary.byType) {
      summary.byType.forEach(t => {
        exportData.push({
          "Phân loại": "Tài sản theo loại",
          "Tên danh mục": TYPE_LABELS[t._id] || t._id,
          "Số lượng": t.count,
          "Ghi chú": ""
        });
      });
    }
    if (summary.byStatus) {
      summary.byStatus.forEach(s => {
        exportData.push({
          "Phân loại": "Tài sản theo tình trạng",
          "Tên danh mục": STATUS_LABELS[s._id] || s._id,
          "Số lượng": s.count,
          "Ghi chú": ""
        });
      });
    }
    if (incidents) {
      incidents.forEach(inc => {
        exportData.push({
          "Phân loại": "Sự cố theo khu vực",
          "Tên danh mục": inc._id || "Chưa phân khu",
          "Số lượng": inc.count,
          "Ghi chú": `Đang xử lý: ${inc.open}`
        });
      });
    }
    exportToCSV(exportData, `Bao_cao_tong_quan_ha_tang_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const statusData = (summary?.byStatus || []).map(s => ({
    name: STATUS_LABELS[s._id] || s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] || '#64748b',
  }));

  const typeData = (summary?.byType || []).map((t, i) => ({
    name: TYPE_LABELS[t._id] || t._id,
    value: t.count,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));

  const incidentData = incidents.map((inc, i) => ({
    name: inc._id,
    total: inc.count,
    open: inc.open,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 no-print">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-surface-400 text-sm mt-1">Tổng quan tình hình hạ tầng đường bộ</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-white rounded-lg border border-surface-700/50 flex items-center gap-2 font-medium transition-all duration-200 text-sm"
            >
              📊 In / Xuất PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg border border-primary-500/50 flex items-center gap-2 font-medium transition-all duration-200 text-sm"
            >
              📥 Xuất Excel
            </button>
          </div>
        </div>

        {/* Print Title (only visible when printing) */}
        <div className="hidden print:block text-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-800">BÁO CÁO TỔNG QUAN HẠ TẦNG ĐƯỜNG BỘ</h1>
          <p className="text-slate-500 text-sm mt-1">Hệ thống QLDA | Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tổng tài sản"
            value={summary?.totalAssets || 0}
            icon="📊"
            color="from-primary-600/20 to-primary-500/10"
            borderColor="border-primary-500/20"
          />
          <StatCard
            title="Tình trạng tốt"
            value={statusData.find(s => s.name === 'Tốt')?.value || 0}
            icon="✅"
            color="from-emerald-600/20 to-emerald-500/10"
            borderColor="border-emerald-500/20"
          />
          <StatCard
            title="Cần sửa chữa"
            value={statusData.find(s => s.name === 'Hư hỏng')?.value || 0}
            icon="🔧"
            color="from-red-600/20 to-red-500/10"
            borderColor="border-red-500/20"
          />
          <StatCard
            title="Sự cố đang mở"
            value={summary?.openIncidents || 0}
            icon="⚠️"
            color="from-amber-600/20 to-amber-500/10"
            borderColor="border-amber-500/20"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status pie chart */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-4">Tài sản theo tình trạng</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(71,85,105,0.5)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Type bar chart */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-4">Tài sản theo loại</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData} barSize={30}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(71,85,105,0.5)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="value" name="Số lượng" radius={[6, 6, 0, 0]}>
                  {typeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget row */}
        <div className="glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">Ngân sách Duy tu & Bảo trì</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Stat comparison details */}
            <div className="space-y-4">
              <div className="bg-surface-800/30 p-4 rounded-xl border border-surface-700/30">
                <span className="text-xs text-surface-400">Tổng chi phí dự kiến (Kế hoạch)</span>
                <p className="text-xl font-bold text-amber-400 mt-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary?.totalEstimate || 0)}</p>
              </div>
              <div className="bg-surface-800/30 p-4 rounded-xl border border-surface-700/30">
                <span className="text-xs text-surface-400">Tổng chi phí thực tế (Đã chi)</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary?.totalActual || 0)}</p>
              </div>
              <div className="bg-surface-800/30 p-4 rounded-xl border border-surface-700/30">
                <span className="text-xs text-surface-400">Chênh lệch ngân sách</span>
                <p className={`text-xl font-bold mt-1 ${
                  (summary?.totalEstimate - summary?.totalActual) >= 0 ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs((summary?.totalEstimate || 0) - (summary?.totalActual || 0)))}
                  <span className="text-xs font-normal ml-1">
                    {(summary?.totalEstimate - summary?.totalActual) >= 0 ? '(Tiết kiệm)' : '(Vượt dự chi)'}
                  </span>
                </p>
              </div>
            </div>
            
            {/* Recharts comparison bar */}
            <div className="md:col-span-2 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'So sánh chi phí', 'Dự kiến': summary?.totalEstimate || 0, 'Thực tế': summary?.totalActual || 0 }
                  ]}
                  barSize={60}
                >
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}tr`} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid rgba(71,85,105,0.5)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                  />
                  <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>} />
                  <Bar dataKey="Dự kiến" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Thực tế" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Incidents and priority */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Incidents by area */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-4">Sự cố theo khu vực</h3>
            {incidentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={incidentData} barSize={20} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid rgba(71,85,105,0.5)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="total" name="Tổng" fill="#327fff" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="open" name="Đang mở" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-surface-500 text-sm text-center py-12">Chưa có dữ liệu sự cố</p>
            )}
          </div>

          {/* Priority list */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-4">
              Tài sản cần ưu tiên xử lý
              <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-lg">
                {priority.length}
              </span>
            </h3>
            {priority.length > 0 ? (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {priority.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-3 p-2.5 bg-surface-800/40 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-surface-200 font-medium truncate">{asset.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-surface-500 font-mono">{asset.assetCode}</span>
                        <span className="text-[10px] text-surface-500">{asset.managedAreaId?.name || '—'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md">Hư hỏng</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-surface-500 text-sm text-center py-12">Không có tài sản cần ưu tiên</p>
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingAssets.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-4">
              Yêu cầu chờ duyệt mới
              <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg">
                {pendingAssets.length}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingAssets.map((asset) => (
                <div key={asset.id} className="flex items-start gap-3 p-3 bg-surface-800/30 rounded-lg border border-surface-700/30">
                  <div className="w-12 h-12 rounded-lg bg-surface-700 flex-shrink-0 overflow-hidden">
                    {asset.photos?.[0] ? (
                      <img src={asset.photos[0].path} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        {TYPE_LABELS[asset.assetType] === 'Đường' ? '🛣️' : '⚠️'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-200 font-medium truncate">{asset.name}</p>
                    <p className="text-[10px] text-surface-500 mt-0.5">Loại: {TYPE_LABELS[asset.assetType] || asset.assetType}</p>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => window.location.href = `/?assetId=${asset.id}`}
                        className="text-[10px] text-primary-400 hover:text-primary-300 font-medium"
                      >
                        Xem chi tiết →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent maintenance */}
        {summary?.recentMaintenance?.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-4">Hoạt động bảo trì gần đây</h3>
            <div className="space-y-2">
              {summary.recentMaintenance.map((record) => (
                <div key={record.id} className="flex items-start gap-3 p-3 bg-surface-800/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    record.recordType === 'incident' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-200">{record.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-surface-500">
                      <span>{record.assetId?.name || '—'}</span>
                      <span>•</span>
                      <span>{record.reportedBy?.fullName || '—'}</span>
                      <span>•</span>
                      <span>{new Date(record.recordedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                    record.recordType === 'incident' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {record.recordType === 'incident' ? 'Sự cố' : 'Bảo trì'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, borderColor }) {
  return (
    <div className={`stat-card bg-gradient-to-br ${color} border ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-surface-400 text-xs font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
    </div>
  );
}
