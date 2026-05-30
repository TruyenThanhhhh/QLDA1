let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    io = new Server(httpServer, {
      cors: {
        origin: '*', // Trong môi trường prod nên cấu hình lại origin cụ thể
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

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
