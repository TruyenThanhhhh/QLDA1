import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const STATUS_COLORS = { good: '#22c55e', fair: '#f59e0b', damaged: '#ef4444' };
const STATUS_LABELS = { good: 'Tốt', fair: 'Trung bình', damaged: 'Hư hỏng' };
const TYPE_LABELS = {
  road: 'Đường', sign: 'Biển báo',
  traffic_light: 'Đèn TH', manhole: 'Nắp cống', lamp_post: 'Cột đèn', sidewalk: 'Vỉa hè',
};
const BAR_COLORS = ['#327fff', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [priority, setPriority] = useState([]);
  const [pendingAssets, setPendingAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State xử lý loading cho các nút hành động (Phê duyệt/Từ chối)
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Tạm mock dữ liệu nếu chạy trên Canvas. Khi dùng API thật, sẽ bắt vào logic catch/mock dưới đây.
        const [sumRes, incRes, priRes, pendRes] = await Promise.all([
          client.get('/reports/summary').catch(() => ({ data: getMockSummary() })),
          client.get('/reports/incidents').catch(() => ({ data: getMockIncidents() })),
          client.get('/reports/priority').catch(() => ({ data: getMockPriority() })),
          client.get('/assets', { params: { approvalStatus: 'pending', limit: 10 } }).catch(() => ({ data: { items: getMockPending() } })),
        ]);
        setSummary(sumRes.data);
        setIncidents(incRes.data);
        setPriority(priRes.data);
        setPendingAssets(pendRes.data.items || pendRes.data || []);
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // --- HÀM XỬ LÝ DÀNH CHO ROLE LÃNH ĐẠO ---

  // 1. Hàm Xử lý Phê Duyệt / Từ chối (Nối với approval.controller.js)
  const handleApproval = async (assetId, status) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ${status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'} tài sản này?`)) return;
    
    setProcessingId(assetId);
    try {
      // Gọi API approval (Giả định route backend là /api/assets/:id/approval)
      await client.put(`/assets/${assetId}/approval`, { approvalStatus: status });
      
      // Xóa tài sản đã xử lý khỏi danh sách chờ duyệt trên UI
      setPendingAssets(prev => prev.filter(item => (item.id || item._id) !== assetId));
      
      // Hiển thị thông báo (Có thể thay bằng thư viện toast)
      alert(status === 'approved' ? '✅ Đã phê duyệt thành công' : '❌ Đã từ chối tài sản');
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Đã xảy ra lỗi khi xử lý. Vui lòng thử lại.');
      // Fallback cho môi trường Canvas khi không có API thật
      setPendingAssets(prev => prev.filter(item => (item.id || item._id) !== assetId));
    } finally {
      setProcessingId(null);
    }
  };

  // 2. Hàm Xử lý Giao việc
  const handleAssignTask = (assetId) => {
    // Logic mở Modal giao việc chọn Kỹ thuật viên (Sẽ phát triển thêm Component Modal)
    alert(`Mở giao diện phân công kỹ thuật viên cho sự cố ID: ${assetId}`);
  };


  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Đang tải dữ liệu Dashboard Lãnh đạo...</p>
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

  const isLeader = user?.role === 'leader' || user?.role === 'admin';

  return (
    <div className="h-full overflow-y-auto p-6 font-sans bg-surface-950">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Dashboard & Export Button */}
        <div className="flex justify-between items-end mb-2 border-b border-surface-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              📊 Dashboard Lãnh Đạo
            </h1>
            <p className="text-surface-400 text-sm mt-1">Tổng quan tình hình hạ tầng & Quy trình phê duyệt</p>
          </div>
          {isLeader && (
            <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-primary-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Xuất Báo Cáo PDF
            </button>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tổng tài sản quản lý"
            value={summary?.totalAssets || 0}
            icon="🏢"
            color="from-primary-600/20 to-primary-500/10"
            borderColor="border-primary-500/20"
          />
          <StatCard
            title="Hạ tầng Tốt"
            value={statusData.find(s => s.name === 'Tốt')?.value || 0}
            icon="✅"
            color="from-emerald-600/20 to-emerald-500/10"
            borderColor="border-emerald-500/20"
          />
          <StatCard
            title="Cần bảo trì / Hư hỏng"
            value={statusData.find(s => s.name === 'Hư hỏng')?.value || 0}
            icon="🔧"
            color="from-red-600/20 to-red-500/10"
            borderColor="border-red-500/20"
          />
          <StatCard
            title="Sự cố đang xử lý"
            value={summary?.openIncidents || 0}
            icon="⚠️"
            color="from-amber-600/20 to-amber-500/10"
            borderColor="border-amber-500/20"
          />
        </div>

        {/* Pending Approvals (Chức năng cốt lõi của Lãnh đạo) */}
        {pendingAssets.length > 0 && (
          <div className="bg-surface-900 border border-amber-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2 relative z-10">
              <span className="text-amber-400">⚡</span> Chờ Phê Duyệt Mới
              <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-bold">
                {pendingAssets.length} yêu cầu
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {pendingAssets.map((asset) => (
                <div key={asset.id || asset._id} className="flex flex-col gap-3 p-4 bg-surface-800/50 hover:bg-surface-800 transition-colors rounded-lg border border-surface-700">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-surface-700 flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
                      {asset.photos?.[0] ? (
                        <img src={asset.photos[0].path} alt="" className="w-full h-full object-cover" />
                      ) : (
                        TYPE_LABELS[asset.assetType] === 'Đường' ? '🛣️' : '⚠️'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-surface-100 font-medium truncate" title={asset.name}>{asset.name}</p>
                      <p className="text-[11px] text-surface-400 mt-0.5">Mã: {asset.assetCode} • {TYPE_LABELS[asset.assetType] || asset.assetType}</p>
                      <p className="text-[11px] text-surface-500 mt-0.5 truncate">Vị trí: {asset.managedAreaId?.name || 'Đang cập nhật'}</p>
                    </div>
                  </div>
                  
                  {/* LUỒNG PHÊ DUYỆT CỦA LÃNH ĐẠO */}
                  {isLeader && (
                    <div className="flex gap-2 mt-1 pt-3 border-t border-surface-700/50">
                      <button 
                        onClick={() => handleApproval(asset.id || asset._id, 'approved')}
                        disabled={processingId === (asset.id || asset._id)}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold py-1.5 rounded text-xs transition flex justify-center items-center gap-1"
                      >
                        {processingId === (asset.id || asset._id) ? 'Đang xử lý...' : (
                          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Duyệt</>
                        )}
                      </button>
                      <button 
                        onClick={() => handleApproval(asset.id || asset._id, 'rejected')}
                        disabled={processingId === (asset.id || asset._id)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold py-1.5 rounded text-xs transition flex justify-center items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-base font-semibold text-white mb-4">Tài sản theo Tình trạng</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} strokeWidth={0}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '8px', color: '#e2e8f0' }} />
                <Legend formatter={(value) => <span className="text-surface-400 text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-base font-semibold text-white mb-4">Khối lượng theo Loại Tài sản</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#334155', opacity: 0.4}} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#e2e8f0' }} />
                <Bar dataKey="value" name="Số lượng" radius={[6, 6, 0, 0]}>
                  {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents and priority */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-base font-semibold text-white mb-4">Sự cố theo Khu vực</h3>
            {incidentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={incidentData} barSize={16} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip cursor={{fill: '#334155', opacity: 0.4}} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Bar dataKey="total" name="Tổng số" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="open" name="Đang mở" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-surface-500 text-sm">Chưa có dữ liệu sự cố</div>
            )}
          </div>

          {/* Priority list - GIAO VIỆC DÀNH CHO LÃNH ĐẠO */}
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg flex flex-col">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              🚨 Cần Ưu Tiên Xử Lý / Giao Việc
              <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                {priority.length} điểm đen
              </span>
            </h3>
            {priority.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {priority.map((asset) => (
                  <div key={asset.id || asset._id} className="flex items-center gap-3 p-3 bg-surface-800/40 hover:bg-surface-800 rounded-lg border border-surface-700/50 transition-colors">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-surface-100 font-medium truncate">{asset.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-surface-400 font-mono bg-surface-950 px-1.5 py-0.5 rounded">{asset.assetCode}</span>
                        <span className="text-[11px] text-surface-500 truncate">{asset.managedAreaId?.name || 'Khu vực chưa rõ'}</span>
                      </div>
                    </div>
                    {isLeader ? (
                      <button 
                        onClick={() => handleAssignTask(asset.id || asset._id)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Giao việc
                      </button>
                    ) : (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-bold">NGHIÊM TRỌNG</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-surface-500 text-sm py-12">
                <span className="text-3xl mb-2">🎉</span>
                Tuyệt vời! Không có điểm đen nguy hiểm nào.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, borderColor }) {
  return (
    <div className={`bg-gradient-to-br ${color} border ${borderColor} rounded-xl p-5 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
      <div className="absolute -right-4 -bottom-4 text-6xl opacity-[0.07] group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-surface-300 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1.5 drop-shadow-sm">{value}</p>
        </div>
        <span className="text-3xl drop-shadow-md">{icon}</span>
      </div>
    </div>
  );
}