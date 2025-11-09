const ChatMessage = require('@/models/appModels/ChatMessage');
const User = require('@/models/appModels/User');
const CompanyOwner = require('@/models/coreModels/CompanyOwner');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    
    // Get current user's companyID
    const currentUserCompanyID = req.user?.companyID || req.companyOwner?.companyID;
    const senderId = req.user?._id || req.companyOwner?._id;
    
    if (!currentUserCompanyID || !senderId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify receiver exists and is in same company
    let receiver = await User.findById(receiverId);
    if (!receiver) {
      receiver = await CompanyOwner.findById(receiverId);
    }
    
    if (!receiver || receiver.companyID !== currentUserCompanyID) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message to user outside your company'
      });
    }

    // Create and save message
    const chatMessage = new ChatMessage({
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
      companyID: currentUserCompanyID
    });

    await chatMessage.save();

    // Populate sender info for response
    await chatMessage.populate('sender', 'name email');

    res.status(201).json({
      success: true,
      result: chatMessage,
      message: 'Message sent successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get chat history between current user and another user
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const currentUserCompanyID = req.user?.companyID || req.companyOwner?.companyID;
    const currentUserId = req.user?._id || req.companyOwner?._id;
    
    if (!currentUserCompanyID || !currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify other user is in same company
    let otherUser = await User.findById(userId);
    if (!otherUser) {
      otherUser = await CompanyOwner.findById(userId);
    }
    
    if (!otherUser || otherUser.companyID !== currentUserCompanyID) {
      return res.status(403).json({
        success: false,
        message: 'Cannot access chat with user outside your company'
      });
    }

    // Get chat messages between the two users
    const messages = await ChatMessage.find({
      companyID: currentUserCompanyID,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalMessages = await ChatMessage.countDocuments({
      companyID: currentUserCompanyID,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    // Mark messages as read
    await ChatMessage.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      result: messages.reverse(), // Show oldest first
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(totalMessages / limit),
        count: totalMessages
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message
    });
  }
};

// Get all chat conversations for current user
const getChatList = async (req, res) => {
  try {
    const currentUserCompanyID = req.user?.companyID || req.companyOwner?.companyID;
    const currentUserId = req.user?._id || req.companyOwner?._id;
    
    if (!currentUserCompanyID || !currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get latest message for each conversation
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          companyID: currentUserCompanyID,
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ['$sender', currentUserId] },
              then: '$receiver',
              else: '$sender'
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$otherUser',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', currentUserId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $lookup: {
          from: 'companyowners',
          localField: '_id',
          foreignField: '_id',
          as: 'ownerInfo'
        }
      },
      {
        $addFields: {
          otherUserInfo: {
            $cond: {
              if: { $gt: [{ $size: '$userInfo' }, 0] },
              then: { $arrayElemAt: ['$userInfo', 0] },
              else: { $arrayElemAt: ['$ownerInfo', 0] }
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      result: conversations,
      message: 'Chat list retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat list',
      error: error.message
    });
  }
};

// Get all users in same company for chat
const getCompanyUsers = async (req, res) => {
  try {
    const currentUserCompanyID = req.user?.companyID || req.companyOwner?.companyID;
    const currentUserId = req.user?._id || req.companyOwner?._id;
    
    if (!currentUserCompanyID || !currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get all users in same company (excluding current user)
    const users = await User.find({
      companyID: currentUserCompanyID,
      _id: { $ne: currentUserId }
    }).select('name email role');

    const companyOwners = await CompanyOwner.find({
      companyID: currentUserCompanyID,
      _id: { $ne: currentUserId }
    }).select('name email');

    const allUsers = [
      ...users.map(user => ({ ...user.toObject(), userType: 'user' })),
      ...companyOwners.map(owner => ({ ...owner.toObject(), userType: 'companyOwner' }))
    ];

    res.json({
      success: true,
      result: allUsers,
      message: 'Company users retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching company users',
      error: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  getChatList,
  getCompanyUsers
};
