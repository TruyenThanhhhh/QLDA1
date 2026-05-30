import React, { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  leader: 'Lãnh đạo',
  technician: 'Kỹ thuật viên',
  user: 'Công dân'
};

const ROLE_COLORS = {
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  leader: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  technician: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  user: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', fullName: '', role: 'user', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: '', type: 'success' }), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/users', { params: { search, page, limit: 10 } });
      
      // ĐÃ SỬA LỖI MAPPING: Bám sát cấu trúc của file response.js bạn gửi
      // paginated trả về: { items, pagination: { total, page, limit } }
      setUsers(res.data?.items || []);
      setTotal(res.data?.pagination?.total || 0);
      
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
      // Hiển thị rõ mã lỗi từ Server (ví dụ: Lỗi 404)
      showToast(`Không thể tải danh sách tài khoản (Lỗi ${err.response?.status || 'mạng'})`, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (userToEdit = null) => {
    setError('');
    if (userToEdit) {
      setEditingUser(userToEdit);
      setForm({
        username: userToEdit.username,
        fullName: userToEdit.fullName,
        role: userToEdit.role,
        password: '' 
      });
    } else {
      setEditingUser(null);
      setForm({ username: '', fullName: '', role: 'user', password: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!editingUser && !form.password) {
      setError('Vui lòng nhập mật khẩu cho tài khoản mới');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username: form.username,
        fullName: form.fullName,
        role: form.role,
        ...(form.password ? { password: form.password } : {})
      };

      if (editingUser) {
        const targetId = editingUser.id || editingUser._id;
        await client.patch(`/users/${targetId}`, payload);
        showToast('Cập nhật tài khoản thành công');
      } else {
        await client.post('/users', payload);
        showToast('Tạo tài khoản mới thành công');
      }
      
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) return;
    try {
      await client.delete(`/users/${userId}`); 
      showToast(currentStatus ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      fetchUsers();
    } catch (err) {
      showToast('Không thể thay đổi trạng thái', 'error');
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-surface-950 font-sans relative">
      {/* Toast */}
      {toast.isVisible && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border animate-[slideIn_0.3s_ease-out] ${
          toast.type === 'error' ? 'bg-red-600/90 border-red-500/50 text-white' : 'bg-emerald-600/90 border-emerald-500/50 text-white'
        }`}>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-5 border-b border-surface-800 bg-surface-900/50 flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">🛡️</span> Quản trị Hệ thống
          </h1>
          <p className="text-surface-400 text-sm mt-1">Quản lý tài khoản, phân quyền và bảo mật.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Tạo tài khoản
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Thanh tìm kiếm */}
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên đăng nhập, họ tên..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="flex-1 bg-surface-900 border border-surface-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button onClick={fetchUsers} className="bg-surface-800 hover:bg-surface-700 text-white px-4 py-2 rounded-lg transition-colors border border-surface-700">
              Tìm kiếm
            </button>
          </div>

          {/* Bảng dữ liệu */}
          <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-950/50 text-surface-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium min-w-[150px]">Tài khoản</th>
                  <th className="p-4 font-medium min-w-[200px]">Họ và tên</th>
                  <th className="p-4 font-medium min-w-[150px]">Vai trò</th>
                  <th className="p-4 font-medium min-w-[120px]">Trạng thái</th>
                  <th className="p-4 font-medium text-right min-w-[150px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-surface-400">
                      <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-surface-400">Không tìm thấy tài khoản nào.</td>
                  </tr>
                ) : (
                  users.map(u => {
                    const uId = u._id || u.id;
                    return (
                      <tr key={uId} className="hover:bg-surface-800/30 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-surface-200">{u.username}</span>
                        </td>
                        <td className="p-4 text-surface-100 font-medium">
                          {u.fullName}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 text-[11px] font-bold border rounded-md whitespace-nowrap ${ROLE_COLORS[u.role] || 'bg-surface-800 text-surface-300'}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${u.isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenModal(u)}
                              className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-md transition-colors text-xs font-medium border border-surface-700"
                            >
                              Sửa / Đổi Pass
                            </button>
                            {/* Không cho tự khóa chính mình */}
                            {user.username !== u.username && (
                              <button 
                                onClick={() => handleToggleStatus(uId, u.isActive)}
                                className={`px-3 py-1.5 rounded-md transition-colors text-xs font-medium border ${u.isActive ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
                              >
                                {u.isActive ? 'Khóa' : 'Mở khóa'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-[slideUp_0.3s_ease-out]">
            
            <div className="px-6 py-4 border-b border-surface-800 flex justify-between items-center bg-surface-800/50">
              <h2 className="text-xl font-bold text-white">{editingUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}</h2>
              <button onClick={() => setShowModal(false)} className="text-surface-500 hover:text-white bg-surface-800 hover:bg-surface-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>

            <div className="p-6">
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
              
              <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">Tên đăng nhập <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value.toLowerCase()})}
                    disabled={!!editingUser}
                    placeholder="Ví dụ: nva_canbo"
                    className="w-full bg-surface-950 border border-surface-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 disabled:opacity-50 transition-colors font-mono"
                    required
                  />
                  {editingUser && <p className="text-[10px] text-surface-500 mt-1">Không thể thay đổi tên đăng nhập.</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">Họ và tên <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={form.fullName}
                    onChange={e => setForm({...form, fullName: e.target.value})}
                    className="w-full bg-surface-950 border border-surface-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">Vai trò hệ thống <span className="text-red-400">*</span></label>
                  <select 
                    value={form.role}
                    onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full bg-surface-950 border border-surface-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="user">Công dân (Chỉ báo cáo)</option>
                    <option value="technician">Kỹ thuật viên (Thi công/Sửa chữa)</option>
                    <option value="leader">Lãnh đạo (Phê duyệt/Giao việc)</option>
                    <option value="admin">Quản trị viên (Toàn quyền)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">Mật khẩu {editingUser && <span className="text-surface-500 font-normal italic">(Bỏ trống nếu không muốn đổi)</span>}</label>
                  <input 
                    type="password" 
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder={editingUser ? 'Nhập mật khẩu mới...' : 'Nhập mật khẩu...'}
                    className="w-full bg-surface-950 border border-surface-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-surface-800 bg-surface-900 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-surface-300 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors">Hủy</button>
              <button form="user-form" type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu tài khoản'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}