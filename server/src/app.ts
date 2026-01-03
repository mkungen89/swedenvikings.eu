// ============================================
// Express Application Setup
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import RedisStore from 'connect-redis';
import passport from 'passport';
import path from 'path';

import { redis } from './utils/redis';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import './config/passport';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import newsRoutes from './routes/news.routes';
import eventRoutes from './routes/event.routes';
import ticketRoutes from './routes/ticket.routes';
import clanRoutes from './routes/clan.routes';
import serverRoutes from './routes/server.routes';
import uploadRoutes from './routes/upload.routes';
import rulesRoutes from './routes/rules.routes';
import statsRoutes from './routes/stats.routes';
import medalsRoutes from './routes/medals.routes';
import achievementsRoutes from './routes/achievements.routes';
import gdprRoutes from './routes/gdpr.routes';
import battlelogRoutes from './routes/battlelog.routes';
import notificationsRoutes from './routes/notifications.routes';
import forumRoutes from './routes/forum.routes';
import commentsRoutes from './routes/comments.routes';
import messagesRoutes from './routes/messages.routes';
import friendsRoutes from './routes/friends.routes';
import platformRoutes from './routes/platform.routes';

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookies
app.use(cookieParser());

// Session with Redis
const redisStore = new RedisStore({
  client: redis,
  prefix: 'sv:session:',
});

app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
app.use('/api', rateLimiter);

// Static files for uploads
// Use UPLOAD_PATH from env, or resolve to server/uploads directory
const uploadsPath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/medals', medalsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/battlelog', battlelogRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/platform', platformRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');

  // Serve static files from React build
  app.use(express.static(clientDistPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

export default app;

