import { useState, useEffect } from 'react';
import client from '../api/client';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'reset'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'user',
    isActive: true
  });
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await client.get('/users', {
        params: {
          page,
          limit,
          role: roleFilter || undefined,
          search: search || undefined
        }
      });
      setUsers(res.data.items || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openCreateModal = () => {
    setForm({
      username: '',
      password: '',
      fullName: '',
      role: 'user',
      isActive: true
    });
    setFormError('');
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setForm({
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    });
    setFormError('');
    setModalMode('edit');
    setShowModal(true);
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setResetPasswordVal('');
    setFormError('');
    setModalMode('reset');
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (modalMode === 'create') {
        await client.post('/users', form);
      } else if (modalMode === 'edit') {
        await client.patch(`/users/${selectedUser.id}`, {
          fullName: form.fullName,
          role: form.role,
          isActive: form.isActive
        });
      } else if (modalMode === 'reset') {
        if (!resetPasswordVal.trim()) {
          setFormError('Vui lòng nhập mật khẩu mới');
          setSubmitting(false);
          return;
        }
        await client.patch(`/users/${selectedUser.id}`, {
          password: resetPasswordVal
        });
      }

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserActive = async (user) => {
    try {
      await client.patch(`/users/${user.id}`, {
        isActive: !user.isActive
      });
      fetchUsers();
    } catch (err) {
      alert('Thay đổi trạng thái thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá tài khoản "${user.username}"?`)) return;
    try {
      await client.delete(`/users/${user.id}`);
      fetchUsers();
    } catch (err) {
      alert('Xoá tài khoản thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-surface-950">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý tài khoản</h1>
            <p className="text-surface-400 text-sm mt-1">Danh sách tài khoản cán bộ kỹ thuật và người dân trong hệ thống</p>
          </div>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <span>+</span> Tạo tài khoản mới
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-96">
            <input
              type="text"
              placeholder="Tìm theo username, tên đầy đủ..."
              className="input-field py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="px-4 bg-surface-700 hover:bg-surface-600 text-white rounded-xl text-sm transition-colors border border-surface-600/50">
              Tìm
            </button>
          </form>

          <div className="flex gap-3 w-full md:w-auto justify-end">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="select-field py-2 text-sm max-w-[180px]"
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="technician">Kỹ thuật viên</option>
              <option value="user">Người dân</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-surface-400 text-sm">Đang tải danh sách tài khoản...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-surface-500 text-sm">
              Không tìm thấy tài khoản người dùng nào khớp với bộ lọc
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-700/50 text-surface-400 text-xs font-semibold uppercase tracking-wider bg-surface-900/40">
                    <th className="p-4">Tên đăng nhập</th>
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Vai trò</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/50 text-sm text-surface-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-900/10 transition-colors">
                      <td className="p-4 font-mono font-medium text-surface-100">{user.username}</td>
                      <td className="p-4">{user.fullName}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                          user.role === 'technician' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {user.role === 'admin' ? 'Quản trị viên' :
                           user.role === 'technician' ? 'Kỹ thuật viên' :
                           'Người dân'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleUserActive(user)}
                          className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                            user.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {user.isActive ? 'Đang hoạt động' : 'Bị khóa'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openEditModal(user)} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                          Sửa
                        </button>
                        <button onClick={() => openResetModal(user)} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                          Reset Pass
                        </button>
                        <button onClick={() => handleDeleteUser(user)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="p-4 border-t border-surface-700/50 flex justify-between items-center text-xs text-surface-400 bg-surface-900/20">
              <p>Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trên {total} tài khoản</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-surface-700/50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-surface-700/50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className="relative z-10 w-full max-w-md bg-surface-900 border border-surface-700/50 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-surface-700/50 flex justify-between items-center bg-surface-950/40">
              <h3 className="text-lg font-bold text-white">
                {modalMode === 'create' ? 'Tạo tài khoản mới' :
                 modalMode === 'edit' ? `Cập nhật: ${selectedUser?.username}` :
                 `Đặt lại mật khẩu cho: ${selectedUser?.username}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {formError}
                </div>
              )}

              {modalMode === 'create' && (
                <>
                  <div>
                    <label className="label-text">Tên đăng nhập *</label>
                    <input
                      name="username"
                      type="text"
                      className="input-field"
                      required
                      value={form.username}
                      onChange={handleFormChange}
                      placeholder="Tên đăng nhập viết liền"
                    />
                  </div>
                  <div>
                    <label className="label-text">Mật khẩu *</label>
                    <input
                      name="password"
                      type="password"
                      className="input-field"
                      required
                      value={form.password}
                      onChange={handleFormChange}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>
                </>
              )}

              {modalMode !== 'reset' && (
                <>
                  <div>
                    <label className="label-text">Họ và tên *</label>
                    <input
                      name="fullName"
                      type="text"
                      className="input-field"
                      required
                      value={form.fullName}
                      onChange={handleFormChange}
                      placeholder="Nhập tên đầy đủ"
                    />
                  </div>
                  <div>
                    <label className="label-text">Vai trò hệ thống</label>
                    <select
                      name="role"
                      className="select-field"
                      value={form.role}
                      onChange={handleFormChange}
                    >
                      <option value="admin">Quản trị viên (admin)</option>
                      <option value="technician">Kỹ thuật viên (technician)</option>
                      <option value="user">Người dân (user)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      className="w-4 h-4 accent-primary-500 bg-surface-950 border-surface-700 rounded focus:ring-primary-500"
                      checked={form.isActive}
                      onChange={handleFormChange}
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-surface-300 cursor-pointer">
                      Cho phép hoạt động đăng nhập
                    </label>
                  </div>
                </>
              )}

              {modalMode === 'reset' && (
                <div>
                  <label className="label-text">Mật khẩu mới *</label>
                  <input
                    type="password"
                    className="input-field"
                    required
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="Mật khẩu mới thay thế"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-surface-700/50">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 text-sm">
                  {submitting ? 'Đang lưu...' : 'Lưu dữ liệu'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary py-2 text-sm">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
