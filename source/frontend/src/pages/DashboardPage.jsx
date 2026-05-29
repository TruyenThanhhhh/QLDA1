import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_COLORS = { good: '#22c55e', fair: '#f59e0b', damaged: '#ef4444' };
const STATUS_LABELS = { good: 'Tốt', fair: 'Trung bình', damaged: 'Hư hỏng' };
const TYPE_LABELS = {
  road: 'Đường', sign: 'Biển báo',
  traffic_light: 'Đèn TH', manhole: 'Nắp cống', lamp_post: 'Cột đèn', sidewalk: 'Vỉa hè',
};
const BAR_COLORS = ['#327fff', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

const CONSTRUCTION_STATUS = {
  open: { label: 'Chờ triển khai', style: 'bg-surface-700 text-surface-300 border-surface-600' },
  in_progress: { label: 'Đang thi công', style: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  resolved: { label: 'Đã hoàn thành', style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');

  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [priority, setPriority] = useState([]);
  const [pendingAssets, setPendingAssets] = useState([]);
  const [constructions, setConstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, incRes, priRes, pendRes, constRes] = await Promise.all([
          client.get('/reports/summary'),
          client.get('/reports/incidents'),
          client.get('/reports/priority'),
          client.get('/assets', { params: { approvalStatus: 'pending', limit: 10 } }),
          client.get('/maintenance/tasks')
        ]);
        
        // ĐÃ TỐI ƯU: Đảm bảo bóc đúng lớp 'data' kể cả khi Backend gói thêm 1 class { success, data }
        const sumData = sumRes.data?.data || sumRes.data;
        const incData = incRes.data?.data || incRes.data || [];
        const priData = priRes.data?.data || priRes.data || [];
        const pendData = pendRes.data?.data?.items || pendRes.data?.items || pendRes.data?.data || pendRes.data || [];
        const constData = constRes.data?.data || constRes.data || [];

        setSummary(sumData);
        setIncidents(incData);
        setPriority(priData);
        setPendingAssets(pendData);
        setConstructions(constData);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu Dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleApproval = async (assetId, status) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ${status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'} tài sản này?`)) return;
    
    setProcessingId(assetId);
    try {
      await client.put(`/assets/${assetId}/approval`, { approvalStatus: status });
      setPendingAssets(prev => prev.filter(item => (item.id || item._id) !== assetId));
      alert(status === 'approved' ? '✅ Đã phê duyệt thành công' : '❌ Đã từ chối tài sản');
    } catch (error) {
      console.error('Lỗi phê duyệt:', error);
      alert('Đã xảy ra lỗi khi xử lý. Vui lòng thử lại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignTask = (assetId) => {
    alert(`Mở giao diện phân công kỹ thuật viên cho sự cố ID: ${assetId}`);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Đang tải dữ liệu Dashboard...</p>
        </div>
      </div>
    );
  }

  const isLeader = user?.role === 'leader' || user?.role === 'admin';

  return (
    <div className="h-full overflow-y-auto p-6 font-sans bg-surface-950">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2 border-b border-surface-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              📊 Dashboard Lãnh Đạo
            </h1>
            <p className="text-surface-400 text-sm mt-1">Giám sát hạ tầng, tiến độ thi công và phê duyệt dự án</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-surface-900 p-1 rounded-lg flex gap-1 border border-surface-700/50">
              <button 
                onClick={() => setCurrentTab('overview')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  currentTab === 'overview' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                Tổng hợp
              </button>
              <button 
                onClick={() => setCurrentTab('construction')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  currentTab === 'construction' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Thi công
              </button>
            </div>

            {isLeader && (
              <button className="bg-surface-800 hover:bg-surface-700 border border-surface-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Xuất PDF
              </button>
            )}
          </div>
        </div>

        {currentTab === 'overview' ? (
          <OverviewDashboard 
            summary={summary} 
            incidents={incidents} 
            priority={priority} 
            pendingAssets={pendingAssets} 
            isLeader={isLeader} 
            handleApproval={handleApproval} 
            processingId={processingId}
            handleAssignTask={handleAssignTask}
          />
        ) : (
          <ConstructionDashboard constructions={constructions} />
        )}

      </div>
    </div>
  );
}

function OverviewDashboard({ summary, incidents, priority, pendingAssets, isLeader, handleApproval, processingId, handleAssignTask }) {
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

  const incidentData = (incidents || []).map((inc, i) => ({
    name: inc._id,
    total: inc.count,
    open: inc.open,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng tài sản quản lý" value={summary?.totalAssets || 0} icon="🏢" color="from-primary-600/20 to-primary-500/10" borderColor="border-primary-500/20" />
        <StatCard title="Hạ tầng Tốt" value={statusData.find(s => s.name === 'Tốt')?.value || 0} icon="✅" color="from-emerald-600/20 to-emerald-500/10" borderColor="border-emerald-500/20" />
        <StatCard title="Cần bảo trì / Hư hỏng" value={statusData.find(s => s.name === 'Hư hỏng')?.value || 0} icon="🔧" color="from-red-600/20 to-red-500/10" borderColor="border-red-500/20" />
        <StatCard title="Sự cố đang xử lý" value={summary?.openIncidents || 0} icon="⚠️" color="from-amber-600/20 to-amber-500/10" borderColor="border-amber-500/20" />
      </div>

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
                    {asset.photos?.[0] ? <img src={asset.photos[0].path} alt="" className="w-full h-full object-cover" /> : (TYPE_LABELS[asset.assetType] === 'Đường' ? '🛣️' : '⚠️')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-100 font-medium truncate" title={asset.name}>{asset.name}</p>
                    <p className="text-[11px] text-surface-400 mt-0.5">Mã: {asset.assetCode} • {TYPE_LABELS[asset.assetType] || asset.assetType}</p>
                    <p className="text-[11px] text-surface-500 mt-0.5 truncate">Vị trí: {asset.managedAreaId?.name || 'Đang cập nhật'}</p>
                  </div>
                </div>
                
                {isLeader && (
                  <div className="flex gap-2 mt-1 pt-3 border-t border-surface-700/50">
                    <button 
                      onClick={() => handleApproval(asset.id || asset._id, 'approved')}
                      disabled={processingId === (asset.id || asset._id)}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold py-1.5 rounded text-xs transition flex justify-center items-center gap-1"
                    >
                      {processingId === (asset.id || asset._id) ? 'Đang xử lý...' : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Duyệt</>}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-base font-semibold text-white mb-4">Tài sản theo Tình trạng</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} strokeWidth={0}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '8px', color: '#e2e8f0' }} />
                <Legend formatter={(value) => <span className="text-surface-400 text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-surface-500 text-sm">Chưa có dữ liệu thống kê</div>
          )}
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-base font-semibold text-white mb-4">Khối lượng theo Loại Tài sản</h3>
          {typeData.length > 0 ? (
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
          ) : (
            <div className="h-[250px] flex items-center justify-center text-surface-500 text-sm">Chưa có dữ liệu thống kê</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-base font-semibold text-white mb-4">Sự cố theo Khu vực</h3>
          {incidentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incidentData} barSize={16} layout="vertical">
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{fill: '#334155', opacity: 0.4}} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#e2e8f0' }} />
                <Bar dataKey="total" name="Tổng số" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="open" name="Đang mở" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-surface-500 text-sm">Chưa có dữ liệu sự cố</div>
          )}
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg flex flex-col">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            🚨 Cần Ưu Tiên Xử Lý / Giao Việc
            <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
              {priority.length} điểm đen
            </span>
          </h3>
          {priority.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[250px]">
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
                    <button onClick={() => handleAssignTask(asset.id || asset._id)} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
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
              <span className="text-3xl mb-2">🎉</span> Không có điểm đen nguy hiểm nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConstructionDashboard({ constructions }) {
  const total = constructions.length;
  const inProgress = constructions.filter(c => c.status === 'in_progress').length;
  const resolved = constructions.filter(c => c.status === 'resolved').length;
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-900 border border-surface-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-surface-400 text-sm">Tổng dự án / công việc</p>
            <p className="text-3xl font-bold text-white mt-1">{total}</p>
          </div>
          <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-xl">📋</div>
        </div>
        <div className="bg-surface-900 border border-surface-800 p-5 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <div>
            <p className="text-surface-400 text-sm">Đang thi công</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{inProgress}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xl animate-pulse">🚧</div>
        </div>
        <div className="bg-surface-900 border border-surface-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-surface-400 text-sm">Đã hoàn thành</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">{resolved}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-xl">✅</div>
        </div>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-surface-800 flex justify-between items-center bg-surface-800/30">
          <h3 className="text-base font-semibold text-white">Danh sách Dự án / Sự cố đang triển khai</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-950/50 text-surface-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium min-w-[200px]">Tên công việc / Sự cố</th>
                <th className="p-4 font-medium min-w-[120px]">Khu vực</th>
                <th className="p-4 font-medium min-w-[150px]">Người phụ trách</th>
                <th className="p-4 font-medium min-w-[150px]">Tiến độ</th>
                <th className="p-4 font-medium text-center min-w-[120px]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {constructions.map((task) => (
                <tr key={task.id || task._id} className="hover:bg-surface-800/30 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-semibold text-surface-100 line-clamp-1" title={task.title}>{task.title}</p>
                    <p className="text-xs text-surface-400 mt-0.5 line-clamp-1">{task.assetName}</p>
                  </td>
                  <td className="p-4 text-sm text-surface-300">
                    <span className="inline-flex items-center gap-1.5 truncate"><span className="text-[10px]">📍</span>{task.area}</span>
                  </td>
                  <td className="p-4 text-sm text-surface-300 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center text-[10px] font-bold text-surface-300 flex-shrink-0">
                      {task.assignee ? task.assignee.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="truncate">{task.assignee}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-surface-400">{task.startDate}</span>
                      <span className="text-surface-200 font-medium">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-surface-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${task.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-1 text-[11px] font-medium border rounded-md whitespace-nowrap ${CONSTRUCTION_STATUS[task.status]?.style || ''}`}>
                      {CONSTRUCTION_STATUS[task.status]?.label || task.status}
                    </span>
                  </td>
                </tr>
              ))}
              {constructions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-surface-500 text-sm">
                    Hiện tại không có dự án thi công nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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