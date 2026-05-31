import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('qlda_token');
    
    // Kết nối tới backend server kèm token xác thực session
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      auth: {
        token: token || ''
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]); // Tự động reconnect khi user thay đổi (login, logout, switch)

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
