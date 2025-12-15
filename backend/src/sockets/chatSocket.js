/**
 * Socket.io handlers for real-time chat communication
 */

const jwt = require('jsonwebtoken');
const ChatRoom = require('../models/appModels/ChatRoom');

// Store active chat connections
const activeChatConnections = new Map(); // roomId -> Map of userId -> socketId

/**
 * Authenticate socket connection using JWT or access token
 */
const authenticateChatSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    const accessToken = socket.handshake.query.accessToken;

    if (accessToken) {
      // Customer joining via access URL
      socket.accessToken = accessToken;
      socket.userType = 'customer';
      next();
    } else if (token) {
      // Employee joining with JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded._id || decoded.userId;
      socket.userEmail = decoded.email;
      socket.userType = 'employee';
      next();
    } else {
      return next(new Error('Authentication required'));
    }
  } catch (error) {
    console.error('Chat socket authentication error:', error.message);
    next(new Error('Invalid authentication'));
  }
};

/**
 * Initialize chat socket handlers
 */
module.exports = (io) => {
  const chatNamespace = io.of('/chat');

  chatNamespace.use(authenticateChatSocket);

  chatNamespace.on('connection', async (socket) => {
    console.log(`💬 Chat connection: ${socket.id} (${socket.userType})`);

    let currentRoom = null;
    let currentRoomId = null;
    let participant = socket.userType; // 'employee' or 'customer'

    /**
     * Join a chat room
     */
    socket.on('chat:join', async (data) => {
      try {
        const { roomId, accessToken } = data;
        let chatRoom;

        // Verify access
        if (socket.userType === 'employee') {
          chatRoom = await ChatRoom.findOne({
            roomId,
            employee: socket.userId,
            enabled: true,
            removed: false,
          })
            .populate('customer', 'name email phone company')
            .populate('employee', 'name email');
        } else {
          // Customer access via token
          chatRoom = await ChatRoom.getRoomByToken(accessToken || socket.accessToken);

          if (!chatRoom || chatRoom.roomId !== roomId) {
            throw new Error('Invalid access token for this room');
          }
        }

        if (!chatRoom) {
          socket.emit('chat:error', {
            message: 'Chat room not found or access denied',
          });
          return;
        }

        // Leave current room if any
        if (currentRoomId) {
          socket.leave(currentRoomId);
        }

        // Join the room
        socket.join(roomId);
        currentRoom = chatRoom;
        currentRoomId = roomId;

        // Track connection
        if (!activeChatConnections.has(roomId)) {
          activeChatConnections.set(roomId, new Map());
        }
        const roomConnections = activeChatConnections.get(roomId);
        roomConnections.set(socket.id, {
          userType: participant,
          userId: socket.userId || 'customer',
          socketId: socket.id,
        });

        // Update online status
        await chatRoom.setOnlineStatus(participant, true);

        // Mark messages as read
        await chatRoom.markMessagesAsRead(participant);

        // Send room data to joiner
        socket.emit('chat:joined', {
          room: {
            roomId: chatRoom.roomId,
            title: chatRoom.title,
            description: chatRoom.description,
            status: chatRoom.status,
            customerName: chatRoom.customerName,
            employeeName: chatRoom.employeeName,
            createdAt: chatRoom.createdAt,
            allowFileSharing: chatRoom.allowFileSharing,
          },
          messages: chatRoom.messages,
          participant,
          customer: participant === 'employee' ? chatRoom.customer : null,
          employee: participant === 'customer' ? chatRoom.employee : null,
          unreadCount:
            participant === 'employee'
              ? chatRoom.unreadMessagesForEmployee
              : chatRoom.unreadMessagesForCustomer,
        });

        // Notify other participant
        socket.to(roomId).emit('chat:participantJoined', {
          participant,
          name: participant === 'employee' ? chatRoom.employeeName : chatRoom.customerName,
          timestamp: new Date(),
        });

        console.log(`✅ ${participant} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining chat room:', error);
        socket.emit('chat:error', {
          message: error.message,
        });
      }
    });

    /**
     * Send a message
     */
    socket.on('chat:sendMessage', async (data) => {
      try {
        if (!currentRoom) {
          socket.emit('chat:error', { message: 'Not in a chat room' });
          return;
        }

        const { content, type = 'text', fileUrl, fileName } = data;

        if (!content || content.trim() === '') {
          socket.emit('chat:error', { message: 'Message content is required' });
          return;
        }

        // Refresh room data
        const chatRoom = await ChatRoom.findOne({ roomId: currentRoomId });
        if (!chatRoom) {
          socket.emit('chat:error', { message: 'Chat room not found' });
          return;
        }

        // Add message to room
        const message = await chatRoom.addMessage({
          sender: participant,
          senderName: participant === 'employee' ? chatRoom.employeeName : chatRoom.customerName,
          senderId: socket.userId || 'customer',
          content: content.trim(),
          type,
          fileUrl,
          fileName,
        });

        // Broadcast message to all participants in room
        chatNamespace.to(currentRoomId).emit('chat:newMessage', {
          message: {
            _id: message._id,
            sender: message.sender,
            senderName: message.senderName,
            content: message.content,
            type: message.type,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            timestamp: message.timestamp,
            read: message.read,
          },
          roomId: currentRoomId,
        });

        console.log(`📩 Message sent in room ${currentRoomId} by ${participant}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('chat:error', {
          message: 'Failed to send message',
        });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('chat:typing', async (data) => {
      if (!currentRoomId) return;

      socket.to(currentRoomId).emit('chat:participantTyping', {
        participant,
        isTyping: data.isTyping,
        timestamp: new Date(),
      });
    });

    /**
     * Mark messages as read
     */
    socket.on('chat:markRead', async () => {
      try {
        if (!currentRoom) return;

        const chatRoom = await ChatRoom.findOne({ roomId: currentRoomId });
        if (!chatRoom) return;

        await chatRoom.markMessagesAsRead(participant);

        // Notify other participant
        socket.to(currentRoomId).emit('chat:messagesRead', {
          participant,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    /**
     * Close/end chat
     */
    socket.on('chat:close', async (data) => {
      try {
        if (!currentRoom || participant !== 'employee') {
          socket.emit('chat:error', { message: 'Only employees can close chats' });
          return;
        }

        const chatRoom = await ChatRoom.findOne({ roomId: currentRoomId });
        if (!chatRoom) return;

        await chatRoom.closeRoom(socket.userId, data.reason || 'Closed by employee');

        // Notify all participants
        chatNamespace.to(currentRoomId).emit('chat:closed', {
          closedBy: participant,
          reason: data.reason,
          timestamp: new Date(),
        });

        console.log(`🔒 Chat room ${currentRoomId} closed`);
      } catch (error) {
        console.error('Error closing chat:', error);
        socket.emit('chat:error', {
          message: 'Failed to close chat',
        });
      }
    });

    /**
     * Disconnect handling
     */
    socket.on('disconnect', async () => {
      console.log(`👋 Chat disconnection: ${socket.id} (${socket.userType})`);

      if (currentRoomId) {
        try {
          // Remove from active connections
          const roomConnections = activeChatConnections.get(currentRoomId);
          if (roomConnections) {
            roomConnections.delete(socket.id);
            if (roomConnections.size === 0) {
              activeChatConnections.delete(currentRoomId);
            }
          }

          // Update online status
          const chatRoom = await ChatRoom.findOne({ roomId: currentRoomId });
          if (chatRoom) {
            await chatRoom.setOnlineStatus(participant, false);

            // Notify other participant
            socket.to(currentRoomId).emit('chat:participantLeft', {
              participant,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });

    /**
     * Error handling
     */
    socket.on('error', (error) => {
      console.error('Chat socket error:', error);
      socket.emit('chat:error', {
        message: 'A socket error occurred',
      });
    });
  });

  console.log('💬 Chat socket handlers initialized');
};

module.exports.getActiveChatConnections = () => activeChatConnections;
