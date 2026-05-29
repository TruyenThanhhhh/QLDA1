import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';

// ==========================================
// CẤU HÌNH & CONSTANTS CHUNG
// ==========================================
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

// Hình ảnh báo lỗi cục bộ (Tránh bị chặn bởi CORS web ngoài)
const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjNlbSIgZmlsbD0iIzg4OCIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';

// Hàm lấy link ảnh cực kỳ an toàn
const getValidImageUrl = (photo) => {
  if (!photo) return '';
  if (photo.url && photo.url.startsWith('http')) return photo.url; 
  if (photo.path && (photo.path.startsWith('http') || photo.path.startsWith('data:image'))) return photo.path;
  
  const baseUrl = 'http://localhost:5000'; // Đảm bảo đúng port backend của bạn
  
  // Trích xuất CHÍNH XÁC tên file, loại bỏ các thư mục tuyệt đối thừa của Windows (C:\...)
  let fileName = photo.filename;
  if (!fileName && photo.path) {
    const normalizedPath = photo.path.replace(/\\/g, '/');
    fileName = normalizedPath.split('/').pop();
  }

  return `${baseUrl}/uploads/${fileName}`;
};

// ==========================================
// THÀNH PHẦN CHÍNH: QUẢN LÝ ĐIỀU HƯỚNG
// ==========================================
export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  if (user.role === 'technician') {
    return <TechnicianDashboard user={user} />;
  }

  return <LeaderDashboard user={user} />;
}

// ==========================================
// GIAO DIỆN 1: DÀNH CHO KỸ THUẬT VIÊN
// ==========================================
function TechnicianDashboard({ user }) {
  const STATUS_CONFIG = {
    open: { title: 'MỚI NHẬN / CHỜ XỬ LÝ', color: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', icon: '📥' },
    in_progress: { title: 'ĐANG THI CÔNG', color: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: '🚧' },
    resolved: { title: 'ĐÃ HOÀN THÀNH', color: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: '✅' }
  };
  
  const PRIORITY_COLORS = {
    low: 'bg-surface-700 text-surface-300',
    medium: 'bg-amber-500/20 text-amber-400',
    high: 'bg-red-500/20 text-red-400',
    critical: 'bg-purple-500/20 text-purple-400 animate-pulse'
  };

  const [tasks, setTasks] = useState({ open: [], in_progress: [], resolved: [] });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', notes: '' });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const [currentTab, setCurrentTab] = useState('kanban'); 
  const [previewImage, setPreviewImage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: '', type: 'success' }), 3000);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await client.get('/tasks'); 
      const rawTasks = res.data?.data || res.data || [];
      const myTasks = rawTasks.filter(t => t.assignee === user.fullName);
      
      const grouped = { open: [], in_progress: [], resolved: [] };
      myTasks.forEach(task => {
        if (grouped[task.status]) grouped[task.status].push(task);
      });
      setTasks(grouped);
    } catch (error) {
      console.error('Lỗi tải công việc:', error);
      showToast('Không thể tải danh sách công việc', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setUpdateForm({ status: task.status, notes: task.notes || '' });
    setUploadedFiles([]); 
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const previewUrls = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setUploadedFiles(prev => [...prev, ...previewUrls]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const taskId = selectedTask.id || selectedTask._id;

      await client.patch(`/maintenance/${taskId}`, {
        status: updateForm.status,
        notes: updateForm.notes
      });
      
      if (uploadedFiles.length > 0) {
          const formData = new FormData();
          uploadedFiles.forEach(uf => formData.append('photos', uf.file));
          try {
             await client.post(`/maintenance/${taskId}/photos`, formData, {
                 headers: { 'Content-Type': 'multipart/form-data' }
             });
          } catch(photoErr) {
             console.error("Lỗi upload ảnh:", photoErr);
             showToast('Cập nhật trạng thái thành công, nhưng ảnh tải lên thất bại', 'error');
          }
      }

      showToast('Đã cập nhật tiến độ công việc!', 'success');
      setSelectedTask(null);
      await fetchTasks(); 
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      showToast('Có lỗi xảy ra khi cập nhật', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-surface-950">
      <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4" />
      <p className="text-surface-400 text-sm">Đang tải Trạm làm việc...</p>
    </div>
  );

  return (
    <div className="h-full overflow-hidden flex flex-col bg-surface-950 font-sans relative">
      {/* Toast Notification */}
      {toast.isVisible && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border animate-[slideIn_0.3s_ease-out] ${
          toast.type === 'error' ? 'bg-red-600/90 border-red-500/50 text-white' : 'bg-emerald-600/90 border-emerald-500/50 text-white'
        }`}>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="px-6 py-5 border-b border-surface-800 bg-surface-900/50 flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-400">👷</span> Trạm làm việc Kỹ thuật viên
          </h1>
          <p className="text-surface-400 text-sm mt-1">Xin chào, {user.fullName}. Dưới đây là các sự cố bạn được giao xử lý.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-surface-900 p-1 rounded-lg flex gap-1 border border-surface-700/50">
            <button onClick={() => setCurrentTab('kanban')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currentTab === 'kanban' ? 'bg-blue-600 text-white shadow-md' : 'text-surface-400 hover:text-surface-200'}`}>Bảng Công Việc</button>
            <button onClick={() => setCurrentTab('history')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currentTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-surface-400 hover:text-surface-200'}`}>Lịch Sử Duy Tu</button>
          </div>
          <button onClick={fetchTasks} className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-lg transition-colors" title="Làm mới">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {currentTab === 'kanban' ? (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-6 h-full min-w-[900px]">
            {['open', 'in_progress', 'resolved'].map(statusKey => (
              <div key={statusKey} className="flex-1 flex flex-col bg-surface-900/40 rounded-xl border border-surface-800 overflow-hidden">
                <div className={`p-4 border-b-2 ${STATUS_CONFIG[statusKey].color} bg-surface-800/80 flex justify-between items-center`}>
                  <h3 className={`font-bold text-sm tracking-wide ${STATUS_CONFIG[statusKey].text} flex items-center gap-2`}>
                    {STATUS_CONFIG[statusKey].icon} {STATUS_CONFIG[statusKey].title}
                  </h3>
                  <span className="bg-surface-950 text-surface-400 text-xs font-bold px-2 py-1 rounded-full">
                    {tasks[statusKey].length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {tasks[statusKey].length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-surface-500 text-sm border-2 border-dashed border-surface-800 rounded-lg">
                      Trống
                    </div>
                  ) : (
                    tasks[statusKey].map(task => (
                      <div 
                        key={task.id || task._id} 
                        onClick={() => handleOpenTask(task)}
                        className="bg-surface-800 p-4 rounded-lg border border-surface-700 hover:border-blue-500/50 hover:bg-surface-700/50 transition-all cursor-pointer shadow-sm group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                            {task.priority === 'high' || task.priority === 'critical' ? 'Ưu tiên cao' : 'Bình thường'}
                          </span>
                          <span className="text-[10px] text-surface-500 font-mono">{task.startDate}</span>
                        </div>
                        <h4 className="text-surface-100 font-medium text-sm mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {task.title}
                        </h4>
                        <p className="text-surface-400 text-xs flex items-center gap-1.5 truncate">
                          <span>📍</span> {task.assetName}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-surface-950/50 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-4">
            {tasks.resolved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-surface-500 border-2 border-dashed border-surface-800 rounded-2xl">
                <span className="text-4xl mb-3">📭</span>
                <p>Bạn chưa có lịch sử duy tu nào.</p>
              </div>
            ) : (
              tasks.resolved.map(task => (
                <div key={task.id || task._id} className="bg-surface-900 border border-surface-800 p-6 rounded-xl shadow-lg transition-transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4 border-b border-surface-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{task.title}</h3>
                      <p className="text-surface-400 text-sm flex items-center gap-1.5"><span className="text-xs">📍</span> Tài sản: {task.assetName}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-md text-xs font-bold border border-emerald-500/20 mb-1">
                        ✅ ĐÃ HOÀN THÀNH
                      </span>
                      <p className="text-xs text-surface-500">Cập nhật: {task.startDate}</p>
                    </div>
                  </div>
                  
                  <div className="mb-5">
                    <p className="text-sm font-medium text-surface-300 mb-2">Ghi chú thực hiện / Nghiệm thu:</p>
                    <div className="bg-surface-950 border border-surface-800 rounded-lg p-4 text-surface-200 text-sm whitespace-pre-wrap">
                      {task.notes ? task.notes : <span className="text-surface-500 italic">Không có ghi chú</span>}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-surface-300 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Hình ảnh hiện trường
                    </p>
                    {task.photos && task.photos.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {task.photos.map((photo, pIdx) => {
                          const imgUrl = getValidImageUrl(photo);
                          return (
                            <img 
                              key={pIdx} 
                              src={imgUrl} 
                              alt={`Hình ảnh nghiệm thu ${pIdx + 1}`} 
                              onClick={() => setPreviewImage(imgUrl)}
                              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                              className="h-28 w-32 object-cover rounded-lg border border-surface-700 cursor-pointer hover:border-blue-400 transition-colors shadow-sm" 
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-surface-500 italic bg-surface-950 p-3 rounded-lg border border-surface-800 inline-block">Chưa có hình ảnh được tải lên.</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Preview Image */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full rounded-lg object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
          <button className="absolute top-6 right-6 text-white bg-surface-800/50 hover:bg-red-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors backdrop-blur-md" onClick={() => setPreviewImage(null)}>✕</button>
        </div>
      )}

      {/* Modal Cập nhật & Nghiệm thu */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-6 py-4 border-b border-surface-800 flex justify-between items-start bg-surface-800/50">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Cập nhật tiến độ thi công</h2>
                <p className="text-surface-400 text-sm">Công việc: <span className="text-surface-200">{selectedTask.title}</span></p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-surface-500 hover:text-white bg-surface-800 hover:bg-surface-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="update-task-form" onSubmit={handleSubmitUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Trạng thái công việc <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: 'open', label: 'Chưa làm', color: 'peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:text-blue-400' },
                      { val: 'in_progress', label: 'Đang thi công', color: 'peer-checked:border-amber-500 peer-checked:bg-amber-500/10 peer-checked:text-amber-400' },
                      { val: 'resolved', label: 'Đã hoàn thành', color: 'peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-400' }
                    ].map(opt => (
                      <label key={opt.val} className="relative cursor-pointer">
                        <input type="radio" name="status" value={opt.val} checked={updateForm.status === opt.val} onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})} className="peer sr-only" />
                        <div className={`text-center px-3 py-3 border border-surface-700 rounded-lg text-sm text-surface-400 hover:bg-surface-800 transition-all ${opt.color}`}>
                          {opt.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Ghi chú kỹ thuật / Thay thế</label>
                  <textarea rows="3" value={updateForm.notes} onChange={(e) => setUpdateForm({...updateForm, notes: e.target.value})} placeholder="Đã sơn lại vạch kẻ đường, cần theo dõi thêm..." className="w-full bg-surface-950 border border-surface-700 text-surface-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Tải ảnh nghiệm thu trực tuyến
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                    {/* Hiển thị ảnh cũ đã upload */}
                    {selectedTask.photos?.map((photo, idx) => (
                      <div key={`old-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-surface-700">
                        <img src={getValidImageUrl(photo)} alt="Old file" className="w-full h-full object-cover opacity-70" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }} />
                        <span className="absolute bottom-0 left-0 w-full text-center bg-black/60 text-[10px] py-0.5 text-white">Đã lưu</span>
                      </div>
                    ))}

                    {/* Hiển thị ảnh đang chọn để upload */}
                    {uploadedFiles.map((fileObj, idx) => (
                      <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-surface-700 group">
                        <img src={fileObj.preview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveFile(idx)} className="absolute top-1 right-1 bg-black/60 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-500">✕</button>
                      </div>
                    ))}
                    
                    <label className="aspect-square rounded-lg border-2 border-dashed border-surface-600 hover:border-blue-500 hover:bg-surface-800/50 transition-colors flex flex-col items-center justify-center cursor-pointer text-surface-400 hover:text-blue-400">
                      <span className="text-2xl mb-1">+</span>
                      <span className="text-xs font-medium">Thêm ảnh</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                  <p className="text-[11px] text-surface-500 italic">Lưu ý: Tải lên ảnh trước/sau bảo trì hoặc ảnh hoàn trả mặt bằng.</p>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-surface-800 bg-surface-900 flex justify-end gap-3">
              <button type="button" onClick={() => setSelectedTask(null)} className="px-5 py-2 text-sm font-medium text-surface-300 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors">Hủy</button>
              <button form="update-task-form" type="submit" disabled={isUpdating} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                {isUpdating ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// GIAO DIỆN 2: DÀNH CHO LÃNH ĐẠO (GIỮ NGUYÊN)
// ==========================================
function LeaderDashboard({ user }) {
  const [currentTab, setCurrentTab] = useState('overview');

  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [priority, setPriority] = useState([]);
  const [pendingAssets, setPendingAssets] = useState([]);
  const [constructions, setConstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [processingId, setProcessingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, assetId: null, status: null, assetName: '' });
  
  const [assignModal, setAssignModal] = useState({ isOpen: false, assetId: null, assetName: '' });
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');

  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  const fetchDashboardData = async () => {
    try {
      const [sumRes, incRes, priRes, pendRes, constRes] = await Promise.all([
        client.get('/reports/summary'),
        client.get('/reports/incidents'),
        client.get('/reports/priority'),
        client.get('/assets', { params: { approvalStatus: 'pending', limit: 10 } }),
        client.get('/tasks')
      ]);
      
      const sumData = sumRes.data?.data || sumRes.data || null;
      const rawInc = incRes.data?.data || incRes.data;
      const incData = Array.isArray(rawInc) ? rawInc : [];
      const rawPri = priRes.data?.data || priRes.data;
      const priData = Array.isArray(rawPri) ? rawPri : [];
      const rawPend = pendRes.data?.data?.items || pendRes.data?.items || pendRes.data?.data || pendRes.data;
      const pendData = Array.isArray(rawPend) ? rawPend : [];
      const rawConst = constRes.data?.data || constRes.data;
      const constData = Array.isArray(rawConst) ? rawConst : [];

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  const handleOpenConfirm = (assetId, status, assetName) => {
    setConfirmModal({ isOpen: true, assetId, status, assetName });
  };

  const executeApproval = async () => {
    const { assetId, status } = confirmModal;
    setConfirmModal({ isOpen: false, assetId: null, status: null, assetName: '' });
    setProcessingId(assetId);

    try {
      await client.patch(`/assets/${assetId}/approval`, { approvalStatus: status });
      setPendingAssets(prev => prev.filter(item => (item.id || item._id) !== assetId));

      if (status === 'approved') {
        showToast('Đã phê duyệt thành công!', 'success');
      } else {
        showToast('Đã từ chối tài sản!', 'error');
      }

      await fetchDashboardData(); 
    } catch (error) {
      console.error('Lỗi phê duyệt:', error);
      showToast('Đã xảy ra lỗi khi xử lý.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignTask = async (assetId, assetName) => {
    setAssignModal({ isOpen: true, assetId, assetName });
    try {
      const res = await client.get('/technicians');
      setTechnicians(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách KTV', err);
      showToast('Không thể tải danh sách KTV', 'error');
    }
  };

  const executeAssign = async () => {
    if (!selectedTech) {
      showToast('Vui lòng chọn một kỹ thuật viên', 'error');
      return;
    }
    
    setProcessingId(assignModal.assetId);
    try {
      await client.patch(`/assign-by-asset/${assignModal.assetId}`, { technicianId: selectedTech });
      showToast('Đã giao việc thành công!', 'success');
      
      setAssignModal({ isOpen: false, assetId: null, assetName: '' });
      setSelectedTech('');
      
      await fetchDashboardData(); 
    } catch (error) {
      console.error('Lỗi giao việc:', error);
      showToast(error.response?.data?.message || 'Lỗi: Không có sự cố nào đang chờ xử lý.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await client.get('/tasks/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DanhSachThiCong.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Lỗi xuất PDF:', error);
      showToast('Không thể xuất file PDF lúc này.', 'error');
    }
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
    <div className="h-full overflow-y-auto p-6 font-sans bg-surface-950 relative">
      
      {/* Toast Notification */}
      {toast.isVisible && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border animate-[slideIn_0.3s_ease-out] ${
          toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-500/50 text-white' : 
          toast.type === 'error' ? 'bg-red-600/90 border-red-500/50 text-white' : 
          'bg-blue-600/90 border-blue-500/50 text-white'
        }`}>
           {toast.type === 'success' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
           {toast.type === 'error' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
           {toast.type === 'info' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
           <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Modal Giao Việc */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-surface-900 border border-surface-700 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-[slideUp_0.3s_ease-out]">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-purple-400">👷</span> Phân công Kỹ thuật viên
            </h3>
            <p className="text-sm text-surface-300 mb-4">
              Giao xử lý sự cố tại: <strong className="text-white block mt-1">"{assignModal.assetName}"</strong>
            </p>
            
            <div className="mb-6">
              <label className="block text-xs font-medium text-surface-400 mb-2 uppercase tracking-wider">Chọn người phụ trách</label>
              <select 
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full bg-surface-800 text-surface-200 text-sm border border-surface-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">-- Chọn kỹ thuật viên --</option>
                {technicians.map(t => (
                  <option key={t._id || t.id} value={t._id || t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setAssignModal({ isOpen: false, assetId: null, assetName: '' }); setSelectedTech(''); }} className="px-4 py-2 text-sm font-medium text-surface-300 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors">Hủy bỏ</button>
              <button onClick={executeAssign} disabled={!selectedTech || processingId === assignModal.assetId} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${selectedTech ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20' : 'bg-surface-700 text-surface-500 cursor-not-allowed'}`}>
                {processingId === assignModal.assetId ? 'Đang xử lý...' : 'Giao việc'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phê Duyệt */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-surface-900 border border-surface-700 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-[slideUp_0.3s_ease-out]">
            <h3 className="text-lg font-bold text-white mb-2">
              Xác nhận {confirmModal.status === 'approved' ? 'Phê duyệt' : 'Từ chối'}
            </h3>
            <p className="text-sm text-surface-300 mb-6">
              Bạn có chắc chắn muốn <strong className={confirmModal.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}>
                {confirmModal.status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'}
              </strong> tài sản/báo cáo: <br/><span className="text-white mt-1 inline-block">"{confirmModal.assetName}"</span> không?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal({ isOpen: false, assetId: null, status: null, assetName: '' })} className="px-4 py-2 text-sm font-medium text-surface-300 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors">Hủy bỏ</button>
              <button onClick={executeApproval} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmModal.status === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2 border-b border-surface-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              📊 Dashboard Lãnh Đạo
            </h1>
            <p className="text-surface-400 text-sm mt-1">Giám sát hạ tầng, tiến độ thi công và phê duyệt dự án</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-surface-900 p-1 rounded-lg flex gap-1 border border-surface-700/50">
              <button onClick={() => setCurrentTab('overview')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currentTab === 'overview' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-400 hover:text-surface-200'}`}>Tổng hợp</button>
              <button onClick={() => setCurrentTab('construction')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${currentTab === 'construction' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-400 hover:text-surface-200'}`}>
                <span className="relative flex h-2 w-2 print:hidden">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Thi công
              </button>
            </div>

            {isLeader && (
              <button onClick={handleExportPDF} className="bg-surface-800 hover:bg-surface-700 border border-surface-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 print:hidden">
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
            handleApproval={handleOpenConfirm} 
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

// Các Component con của Lãnh Đạo giữ nguyên
function OverviewDashboard({ summary, incidents = [], priority = [], pendingAssets = [], isLeader, handleApproval, processingId, handleAssignTask }) {
  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const safePriority = Array.isArray(priority) ? priority : [];
  const safePending = Array.isArray(pendingAssets) ? pendingAssets : [];

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

  const incidentData = safeIncidents.map((inc, i) => ({
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

      {safePending.length > 0 && (
        <div className="bg-surface-900 border border-amber-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2 relative z-10">
            <span className="text-amber-400">⚡</span> Chờ Phê Duyệt Mới
            <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-bold">
              {safePending.length} yêu cầu
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {safePending.map((asset) => (
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
                      onClick={() => handleApproval(asset.id || asset._id, 'approved', asset.name)}
                      disabled={processingId === (asset.id || asset._id)}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold py-1.5 rounded text-xs transition flex justify-center items-center gap-1"
                    >
                      {processingId === (asset.id || asset._id) ? 'Đang xử lý...' : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Duyệt</>}
                    </button>
                    <button 
                      onClick={() => handleApproval(asset.id || asset._id, 'rejected', asset.name)}
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
              {safePriority.length} điểm đen
            </span>
          </h3>
          {safePriority.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[250px]">
              {safePriority.map((asset) => (
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
                    asset.isAssigned ? (
                      <span className="bg-surface-800 text-surface-500 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-surface-700 cursor-not-allowed">
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Đã giao: {asset.assigneeName}
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleAssignTask(asset.id || asset._id, asset.name)} 
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Giao việc
                      </button>
                    )
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

function ConstructionDashboard({ constructions = [] }) {
  const safeConstructions = Array.isArray(constructions) ? constructions : [];
  const total = safeConstructions.length;
  const inProgress = safeConstructions.filter(c => c.status === 'in_progress').length;
  const resolved = safeConstructions.filter(c => c.status === 'resolved').length;
  
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
              {safeConstructions.map((task) => (
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
                      <div className={`h-1.5 rounded-full ${task.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${task.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-1 text-[11px] font-medium border rounded-md whitespace-nowrap ${CONSTRUCTION_STATUS[task.status]?.style || ''}`}>
                      {CONSTRUCTION_STATUS[task.status]?.label || task.status}
                    </span>
                  </td>
                </tr>
              ))}
              {safeConstructions.length === 0 && (
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