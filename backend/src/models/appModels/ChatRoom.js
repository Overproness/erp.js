const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['employee', 'customer'],
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  senderId: {
    type: String, // employee ID or 'customer'
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text',
  },
  fileUrl: String,
  fileName: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

const chatRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.ObjectId,
      refPath: 'employeeModel',
      required: true,
    },
    employeeModel: {
      type: String,
      required: true,
      enum: ['User', 'CompanyOwner'],
    },
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Client',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'Customer Support Chat',
    },
    description: String,
    status: {
      type: String,
      enum: ['active', 'closed', 'archived'],
      default: 'active',
    },
    messages: [messageSchema],

    // Participant tracking
    employeeOnline: {
      type: Boolean,
      default: false,
    },
    customerOnline: {
      type: Boolean,
      default: false,
    },
    lastEmployeeActivity: Date,
    lastCustomerActivity: Date,

    // Metadata
    createdBy: {
      type: mongoose.Schema.ObjectId,
      refPath: 'employeeModel',
      required: true,
    },
    accessUrl: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
      unique: true,
    },

    // Analytics
    totalMessages: {
      type: Number,
      default: 0,
    },
    employeeMessageCount: {
      type: Number,
      default: 0,
    },
    customerMessageCount: {
      type: Number,
      default: 0,
    },
    averageResponseTime: Number, // in seconds

    // Settings
    expiresAt: Date,
    allowFileSharing: {
      type: Boolean,
      default: true,
    },
    tags: [String],

    // Close/Archive info
    closedAt: Date,
    closedBy: {
      type: mongoose.Schema.ObjectId,
      refPath: 'employeeModel',
    },
    closeReason: String,

    enabled: {
      type: Boolean,
      default: true,
    },
    removed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
chatRoomSchema.index({ employee: 1, status: 1 });
chatRoomSchema.index({ customer: 1, status: 1 });
chatRoomSchema.index({ accessToken: 1 });
chatRoomSchema.index({ createdAt: -1 });

// Virtual for unread count
chatRoomSchema.virtual('unreadMessagesForEmployee').get(function () {
  return this.messages.filter((m) => m.sender === 'customer' && !m.read).length;
});

chatRoomSchema.virtual('unreadMessagesForCustomer').get(function () {
  return this.messages.filter((m) => m.sender === 'employee' && !m.read).length;
});

// Static methods
chatRoomSchema.statics.generateRoomId = function () {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

chatRoomSchema.statics.generateAccessToken = function () {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

chatRoomSchema.statics.getActiveRoomsForEmployee = async function (employeeId) {
  return this.find({
    employee: employeeId,
    status: 'active',
    enabled: true,
    removed: false,
  })
    .populate('customer', 'name email phone company')
    .sort({ updatedAt: -1 });
};

chatRoomSchema.statics.getRoomByToken = async function (accessToken) {
  return this.findOne({
    accessToken,
    enabled: true,
    removed: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .populate('employee', 'name email')
    .populate('customer', 'name email phone company');
};

// Instance methods
chatRoomSchema.methods.addMessage = async function (messageData) {
  const message = {
    sender: messageData.sender,
    senderName: messageData.senderName,
    senderId: messageData.senderId,
    content: messageData.content,
    type: messageData.type || 'text',
    fileUrl: messageData.fileUrl,
    fileName: messageData.fileName,
    timestamp: new Date(),
    read: false,
  };

  this.messages.push(message);
  this.totalMessages += 1;

  if (messageData.sender === 'employee') {
    this.employeeMessageCount += 1;
    this.lastEmployeeActivity = new Date();
  } else {
    this.customerMessageCount += 1;
    this.lastCustomerActivity = new Date();
  }

  await this.save();
  return message;
};

chatRoomSchema.methods.markMessagesAsRead = async function (participant) {
  const otherParticipant = participant === 'employee' ? 'customer' : 'employee';

  let hasUpdates = false;
  this.messages.forEach((msg) => {
    if (msg.sender === otherParticipant && !msg.read) {
      msg.read = true;
      hasUpdates = true;
    }
  });

  if (hasUpdates) {
    await this.save();
  }

  return hasUpdates;
};

chatRoomSchema.methods.setOnlineStatus = async function (participant, isOnline) {
  if (participant === 'employee') {
    this.employeeOnline = isOnline;
    if (isOnline) this.lastEmployeeActivity = new Date();
  } else {
    this.customerOnline = isOnline;
    if (isOnline) this.lastCustomerActivity = new Date();
  }
  await this.save();
};

chatRoomSchema.methods.closeRoom = async function (closedBy, reason) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = closedBy;
  this.closeReason = reason;
  await this.save();
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
