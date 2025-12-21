/**
 * WebSocket Service
 * Handles real-time communication via Socket.io
 */

const { Server } = require('socket.io');
const { authenticate } = require('../middleware/authMiddleware');

// Store active connections
const activeConnections = new Map(); // userId -> Set of socketIds
const socketToUser = new Map(); // socketId -> userId
const typingUsers = new Map(); // threadId -> Set of userIds

/**
 * Initialize WebSocket server
 */
function initializeWebSocket(server) {
  // Get frontend URL from environment (Vite dev server typically runs on 5173)
  // Allow all origins in development for easier testing
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.VITE_FRONTEND_URL,
    process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5173'
  ].filter(Boolean);
  
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
    allowEIO3: true // Allow Engine.IO v3 clients
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      // Try multiple ways to get the token
      const token = socket.handshake.auth?.token || 
                   socket.handshake.query?.token ||
                   socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('[WebSocket] No token provided in handshake');
        console.log('[WebSocket] Handshake auth:', socket.handshake.auth);
        console.log('[WebSocket] Handshake query:', socket.handshake.query);
        return next(new Error('Authentication error: No token provided'));
      }

      const user = await authenticateSocket(token);
      
      if (!user) {
        console.log('[WebSocket] Invalid token');
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = user.id;
      socket.agencyId = user.agencyId;
      socket.agencyDatabase = user.agencyDatabase;
      
      console.log(`[WebSocket] ✅ Authenticated user ${user.id} for agency ${user.agencyId}`);
      next();
    } catch (error) {
      console.error('[WebSocket] Auth error:', error);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const agencyId = socket.agencyId;

    console.log(`[WebSocket] User ${userId} connected (socket: ${socket.id})`);

    // Track connection
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, new Set());
    }
    activeConnections.get(userId).add(socket.id);
    socketToUser.set(socket.id, userId);

    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Join agency room
    if (agencyId) {
      socket.join(`agency:${agencyId}`);
    }

    // Emit online status to agency
    if (agencyId) {
      socket.to(`agency:${agencyId}`).emit('user:online', { userId });
    }

    /**
     * Join channel room
     */
    socket.on('channel:join', (data) => {
      const { channelId } = data;
      if (channelId) {
        socket.join(`channel:${channelId}`);
        console.log(`[WebSocket] User ${userId} joined channel ${channelId}`);
      }
    });

    /**
     * Leave channel room
     */
    socket.on('channel:leave', (data) => {
      const { channelId } = data;
      if (channelId) {
        socket.leave(`channel:${channelId}`);
        console.log(`[WebSocket] User ${userId} left channel ${channelId}`);
      }
    });

    /**
     * Join thread room
     */
    socket.on('thread:join', (data) => {
      const { threadId } = data;
      if (threadId) {
        socket.join(`thread:${threadId}`);
        console.log(`[WebSocket] User ${userId} joined thread ${threadId}`);
      }
    });

    /**
     * Leave thread room
     */
    socket.on('thread:leave', (data) => {
      const { threadId } = data;
      if (threadId) {
        socket.leave(`thread:${threadId}`);
        console.log(`[WebSocket] User ${userId} left thread ${threadId}`);
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing:start', (data) => {
      const { threadId } = data;
      if (!threadId) return;

      if (!typingUsers.has(threadId)) {
        typingUsers.set(threadId, new Set());
      }
      typingUsers.get(threadId).add(userId);

      // Emit to other users in thread
      socket.to(`thread:${threadId}`).emit('typing:start', {
        threadId,
        userId,
        userName: data.userName || 'User'
      });

      // Clear typing after 3 seconds
      setTimeout(() => {
        if (typingUsers.has(threadId)) {
          typingUsers.get(threadId).delete(userId);
          if (typingUsers.get(threadId).size === 0) {
            typingUsers.delete(threadId);
          }
        }
        socket.to(`thread:${threadId}`).emit('typing:stop', {
          threadId,
          userId
        });
      }, 3000);
    });

    /**
     * Stop typing indicator
     */
    socket.on('typing:stop', (data) => {
      const { threadId } = data;
      if (!threadId) return;

      if (typingUsers.has(threadId)) {
        typingUsers.get(threadId).delete(userId);
      }

      socket.to(`thread:${threadId}`).emit('typing:stop', {
        threadId,
        userId
      });
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      console.log(`[WebSocket] User ${userId} disconnected (socket: ${socket.id})`);

      // Remove from active connections
      if (activeConnections.has(userId)) {
        activeConnections.get(userId).delete(socket.id);
        if (activeConnections.get(userId).size === 0) {
          activeConnections.delete(userId);
          
          // Emit offline status
          if (agencyId) {
            io.to(`agency:${agencyId}`).emit('user:offline', { userId });
          }
        }
      }
      socketToUser.delete(socket.id);

      // Clean up typing indicators
      for (const [threadId, users] of typingUsers.entries()) {
        users.delete(userId);
        if (users.size === 0) {
          typingUsers.delete(threadId);
        } else {
          io.to(`thread:${threadId}`).emit('typing:stop', { threadId, userId });
        }
      }
    });
  });

  return io;
}

/**
 * Decode token (same as authMiddleware)
 */
function decodeToken(token) {
  try {
    const json = Buffer.from(token, 'base64').toString('utf8');
    const payload = JSON.parse(json);

    if (!payload.exp || typeof payload.exp !== 'number') {
      return null;
    }

    const nowMs = Date.now();
    if (payload.exp * 1000 <= nowMs) {
      return null;
    }

    return payload;
  } catch (error) {
    console.warn('[WebSocket] Failed to decode auth token:', error.message);
    return null;
  }
}

/**
 * Authenticate socket connection
 */
async function authenticateSocket(token) {
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.userId) {
      return null;
    }

    return {
      id: payload.userId,
      email: payload.email,
      agencyId: payload.agencyId,
      agencyDatabase: payload.agencyDatabase
    };
  } catch (error) {
    console.error('[WebSocket] Authentication error:', error);
    return null;
  }
}

/**
 * Emit new message to thread participants
 */
function emitNewMessage(io, threadId, message) {
  io.to(`thread:${threadId}`).emit('message:new', message);
}

/**
 * Emit message update
 */
function emitMessageUpdate(io, threadId, message) {
  io.to(`thread:${threadId}`).emit('message:update', message);
}

/**
 * Emit message deletion
 */
function emitMessageDelete(io, threadId, messageId) {
  io.to(`thread:${threadId}`).emit('message:delete', { messageId, threadId });
}

/**
 * Emit reaction update
 */
function emitReactionUpdate(io, threadId, reaction) {
  io.to(`thread:${threadId}`).emit('reaction:update', reaction);
}

/**
 * Emit read receipt
 */
function emitReadReceipt(io, threadId, readReceipt) {
  io.to(`thread:${threadId}`).emit('read:receipt', readReceipt);
}

/**
 * Emit channel update
 */
function emitChannelUpdate(io, channelId, channel) {
  io.to(`channel:${channelId}`).emit('channel:update', channel);
}

/**
 * Emit thread update
 */
function emitThreadUpdate(io, channelId, thread) {
  io.to(`channel:${channelId}`).emit('thread:update', thread);
}

/**
 * Emit new thread
 */
function emitNewThread(io, channelId, thread) {
  io.to(`channel:${channelId}`).emit('thread:new', thread);
}

/**
 * Get online users for agency
 */
function getOnlineUsers(agencyId) {
  // This would need to track which users are in which agency
  // For now, return all online users
  return Array.from(activeConnections.keys());
}

/**
 * Check if user is online
 */
function isUserOnline(userId) {
  return activeConnections.has(userId) && activeConnections.get(userId).size > 0;
}

module.exports = {
  initializeWebSocket,
  emitNewMessage,
  emitMessageUpdate,
  emitMessageDelete,
  emitReactionUpdate,
  emitReadReceipt,
  emitChannelUpdate,
  emitThreadUpdate,
  emitNewThread,
  getOnlineUsers,
  isUserOnline,
};
