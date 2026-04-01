import express from 'express';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mongoose Models
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, minlength: 2, maxlength: 100 },
  employeeId: { type: String, required: true, unique: true, minlength: 1, maxlength: 50 },
  descriptor: { type: [Number], required: true, validate: { validator: (v: any) => v.length === 128 } },
  registeredAt: { type: Date, default: Date.now, index: true },
  isActive: { type: Boolean, default: true }
});

const logSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Add indexes for better query performance
logSchema.index({ userId: 1 });
logSchema.index({ employeeId: 1 });

const User = mongoose.model('User', userSchema);
const AttendanceLog = mongoose.model('AttendanceLog', logSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI;
  let dbConnected = false;

  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB');
      dbConnected = true;
    } catch (err) {
      console.error('❌ MongoDB connection error:', err);
    }
  } else {
    console.warn('⚠️ MONGODB_URI not found in environment variables. Using in-memory fallback for development.');
  }

  // In-memory fallback if no DB
  let memoryUsers: any[] = [];
  let memoryLogs: any[] = [];

  // API Routes
  app.get('/api/users', async (req, res) => {
    try {
      if (dbConnected) {
        try {
          const users = await User.find().lean();
          console.log('📤 GET /api/users - Returning', users.length, 'users from DB');
          res.json(users);
          return;
        } catch (mongoErr: any) {
          console.error('⚠️ MongoDB error fetching users, using memory:', mongoErr.message);
          dbConnected = false;
        }
      }
      console.log('📤 GET /api/users - Returning', memoryUsers.length, 'users from memory');
      res.json(memoryUsers);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      if (dbConnected) {
        try {
          const newUser = new User(req.body);
          await newUser.save();
          console.log('💾 POST /api/users - Saved user to DB:', newUser.name);
          res.json(newUser);
          return;
        } catch (mongoErr: any) {
          console.error('⚠️ MongoDB error, falling back to memory:', mongoErr.message);
          dbConnected = false; // Mark as disconnected
          // Fall through to memory save
        }
      }
      
      // Fallback to memory
      const newUser = { ...req.body, registeredAt: new Date().toISOString() };
      memoryUsers.push(newUser);
      console.log('💾 POST /api/users - Saved to memory (DB offline):', newUser.name);
      res.json(newUser);
    } catch (err) {
      console.error('❌ Error saving user:', err);
      res.status(500).json({ error: 'Failed to save user' });
    }
  });

  app.get('/api/logs', async (req, res) => {
    try {
      if (dbConnected) {
        try {
          const logs = await AttendanceLog.find().sort({ timestamp: -1 }).lean();
          console.log('📤 GET /api/logs - Returning', logs.length, 'logs from DB');
          res.json(logs);
          return;
        } catch (mongoErr: any) {
          console.error('⚠️ MongoDB error fetching logs, using memory:', mongoErr.message);
          dbConnected = false;
        }
      }
      console.log('📤 GET /api/logs - Returning', memoryLogs.length, 'logs from memory');
      res.json(memoryLogs);
    } catch (err) {
      console.error('❌ Error fetching logs:', err);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.post('/api/logs', async (req, res) => {
    try {
      if (dbConnected) {
        try {
          const newLog = new AttendanceLog(req.body);
          await newLog.save();
          console.log('💾 POST /api/logs - Saved log to DB');
          res.json(newLog);
          return;
        } catch (mongoErr: any) {
          console.error('⚠️ MongoDB error, falling back to memory:', mongoErr.message);
          dbConnected = false;
        }
      }
      
      const newLog = { ...req.body, timestamp: new Date().toISOString() };
      memoryLogs.unshift(newLog);
      console.log('💾 POST /api/logs - Saved log to memory (DB offline)');
      res.json(newLog);
    } catch (err) {
      console.error('❌ Error saving log:', err);
      res.status(500).json({ error: 'Failed to save log' });
    }
  });

  // DELETE employee
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Invalid employee ID' });
      }

      if (dbConnected) {
        try {
          const result = await User.deleteOne({ id });
          if (result.deletedCount > 0) {
            console.log('🗑️ DELETE /api/users - Deleted user:', id);
            res.json({ success: true });
            return;
          }
        } catch (mongoErr: any) {
          console.error('⚠️ MongoDB error, falling back to memory:', mongoErr.message);
          dbConnected = false;
        }
      }

      // Fallback to memory
      const index = memoryUsers.findIndex(u => u.id === id);
      if (index !== -1) {
        memoryUsers.splice(index, 1);
        console.log('🗑️ DELETE /api/users - Deleted user from memory:', id);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (err) {
      console.error('❌ Error deleting user:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // GET logs with date range filter
  app.get('/api/logs/range', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
      }

      if (dbConnected) {
        try {
          const logs = await AttendanceLog.find({
            timestamp: {
              $gte: new Date(startDate as string),
              $lte: new Date(endDate as string)
            }
          }).sort({ timestamp: -1 }).lean();
          console.log('📤 GET /api/logs/range - Returning', logs.length, 'logs');
          res.json(logs);
          return;
        } catch (mongoErr: any) {
          console.error('⚠️ MongoDB error, using memory:', mongoErr.message);
          dbConnected = false;
        }
      }

      res.json(memoryLogs);
    } catch (err) {
      console.error('❌ Error fetching logs by range:', err);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
