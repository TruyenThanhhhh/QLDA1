import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useState, useEffect } from 'react';
import ChatWidget from './ChatWidget';

const navItems = [
  {
    to: '/',
    label: 'Bản đồ',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    to: '/admin/users',
    label: 'Tài khoản',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 20 11.383 11.383 0 015 19.237v-.11c0-2.618 1.956-4.73 4.5-4.894M15 6a3 3 0 11-6 0 3 3 0 016 0zm6 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

const roleLabels = {
  admin: 'Quản trị viên',
  technician: 'Nhân viên KT',
  user: 'Công dân',
};

const roleColors = {
  admin: 'bg-purple-500/20 text-purple-400',
  technician: 'bg-blue-500/20 text-blue-400',
  user: 'bg-emerald-500/20 text-emerald-400',
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;
    
    const handleAssetEvent = (data) => {
      const msg = `Tài sản vừa được ${data.type === 'CREATE_ASSET' ? 'tạo' : 'cập nhật'}`;
      addNotification(msg);
    };

    const handleMaintenanceEvent = (data) => {
      const msg = `Sự cố/bảo trì vừa được ${data.type === 'CREATE_MAINTENANCE' ? 'báo cáo' : 'cập nhật'}`;
      addNotification(msg);
    };

    socket.on('new_asset_event', handleAssetEvent);
    socket.on('new_maintenance_event', handleMaintenanceEvent);

    return () => {
      socket.off('new_asset_event', handleAssetEvent);
      socket.off('new_maintenance_event', handleMaintenanceEvent);
    };
  }, [socket]);

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      {/* Top header bar */}
      <header className="h-14 bg-surface-900/80 backdrop-blur-xl border-b border-surface-700/50 flex items-center justify-between px-4 z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-md shadow-primary-600/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">QLDA</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 ml-4">
            {navItems.filter(item => {
              if (item.to === '/admin/users') return user?.role === 'admin';
              if (item.to === '/dashboard') return user?.role === 'admin' || user?.role === 'technician';
              return true;
            }).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-surface-200 font-medium leading-tight">{user?.fullName}</p>
            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md font-medium mt-0.5 ${roleColors[user?.role]}`}>
              {roleLabels[user?.role]}
            </span>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-surface-600 to-surface-700 rounded-lg flex items-center justify-center text-surface-300 text-sm font-semibold">
            {user?.fullName?.charAt(0)}
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            title="Đăng xuất"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
        
        <ChatWidget />
        
        {/* Toast Notifications */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="bg-primary-600/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-primary-500/50 min-w-[250px] animate-[slideIn_0.3s_ease-out]">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-sm font-medium">{n.msg}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
