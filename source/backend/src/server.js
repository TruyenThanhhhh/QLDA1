require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const socketConfig = require('./config/socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  
  const server = http.createServer(app);
  socketConfig.init(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
  });
};

start();
