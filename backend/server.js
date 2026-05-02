const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
  })
);
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/admin', require('./routes/admin'));

let activeUsers = 0;

io.on('connection', (socket) => {
  activeUsers += 1;
  io.emit('activeUsers', activeUsers);

  socket.on('disconnect', () => {
    activeUsers = Math.max(0, activeUsers - 1);
    io.emit('activeUsers', activeUsers);
  });
});

app.get('/api/active-users', (req, res) => {
  res.json({ success: true, activeUsers });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const ensureDefaultAdmin = async () => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return;
  }

  const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
  if (!existingAdmin) {
    await User.create({
      name: 'System Admin',
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log('Default admin account created');
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultAdmin();

    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
