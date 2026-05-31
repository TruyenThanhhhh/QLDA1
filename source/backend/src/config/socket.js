let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');

    io = new Server(httpServer, {
      cors: {
        origin: '*', // Trong môi trường prod nên cấu hình lại origin cụ thể
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    // Middleware xác thực Token (Session) cho các kênh kết nối thời gian thực
    io.use(async (socket, next) => {
      try {
        let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
        if (token && token.startsWith('Bearer ')) {
          token = token.split(' ')[1];
        }
        
        if (!token) {
          return next();
        }

        token = token.replace(/^"(.*)"$/, '$1');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          socket.user = user;
        }
        next();
      } catch (err) {
        next(); // Vẫn cho phép kết nối ẩn danh nếu có lỗi token
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id, socket.user ? `${socket.user.username} (${socket.user.role})` : 'Anonymous');

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      return {
        emit: (event, data) => {
          console.warn(`Socket.io not initialized. Event '${event}' not broadcast.`);
        }
      };
    }
    return io;
  },
};
