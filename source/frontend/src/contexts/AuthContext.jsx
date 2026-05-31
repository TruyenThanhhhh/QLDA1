import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('qlda_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qlda_token');
    if (token && !user) {
      client.get('/auth/me')
        .then(res => {
          const userData = res.data;
          setUser(userData);
          localStorage.setItem('qlda_user', JSON.stringify(userData));
        })
        .catch(() => {
          localStorage.removeItem('qlda_token');
          localStorage.removeItem('qlda_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Tự động đồng bộ hóa phiên đăng nhập (Session) giữa các tab trình duyệt
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'qlda_user' || e.key === 'qlda_token') {
        const savedUser = localStorage.getItem('qlda_user');
        setUser(savedUser ? JSON.parse(savedUser) : null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (username, password) => {
    const res = await client.post('/auth/login', { username, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('qlda_token', token);
    localStorage.setItem('qlda_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await client.post('/auth/register', userData);
    const { token, user: data } = res.data;
    localStorage.setItem('qlda_token', token);
    localStorage.setItem('qlda_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('qlda_token');
    localStorage.removeItem('qlda_user');
    setUser(null);
  };

  const hasRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
