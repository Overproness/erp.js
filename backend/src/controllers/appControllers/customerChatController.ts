const chatUrlService = require('@/services/chatUrlService');

/**
 * Generate a new chat room URL for customer communication
 */
const generateChatUrl = async (req: any, res: any) => {
  try {
    const { id: customerId } = req.params;
    const employeeId = (req as any).companyOwner?._id || req.user?._id;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    const options = {
      title: req.body.title,
      description: req.body.description,
      expiresAt: req.body.expiresAt,
      allowFileSharing: req.body.allowFileSharing,
      tags: req.body.tags,
      createNew: req.body.createNew,
    };

    const result = await chatUrlService.generateCustomerChatUrl(customerId, employeeId, options);

    return res.status(200).json({
      success: true,
      result,
      message: result.isExisting
        ? 'Existing active chat room found'
        : 'Chat room created successfully',
    });
  } catch (error) {
    console.error('Error generating chat URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get chat room by token (for customer access)
 */
const getChatRoomByToken = async (req: any, res: any) => {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Access token is required',
      });
    }

    const chatRoom = await chatUrlService.getChatRoomByToken(accessToken);

    return res.status(200).json({
      success: true,
      result: chatRoom,
      message: 'Chat room retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting chat room by token:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get chat room by room ID
 */
const getChatRoomById = async (req: any, res: any) => {
  try {
    const { roomId } = req.params;

    const chatRoom = await chatUrlService.getChatRoomById(roomId);

    return res.status(200).json({
      success: true,
      result: chatRoom,
      message: 'Chat room retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting chat room:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get all chat rooms for the authenticated employee
 */
const getEmployeeChatRooms = async (req: any, res: any) => {
  try {
    const employeeId = req.admin?._id || req.user?._id;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    const filters = {
      status: req.query.status,
      customerId: req.query.customerId,
      limit: parseInt(req.query.limit as string) || 50,
    };

    const chatRooms = await chatUrlService.getEmployeeChatRooms(employeeId, filters);

    return res.status(200).json({
      success: true,
      result: chatRooms,
      message: 'Chat rooms retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting employee chat rooms:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get all chat rooms for a specific customer
 */
const getCustomerChatRooms = async (req: any, res: any) => {
  try {
    const { id: customerId } = req.params;

    const filters = {
      status: req.query.status,
      limit: parseInt(req.query.limit as string) || 50,
    };

    const chatRooms = await chatUrlService.getCustomerChatRooms(customerId, filters);

    return res.status(200).json({
      success: true,
      result: chatRooms,
      message: 'Customer chat rooms retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting customer chat rooms:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Close a chat room
 */
const closeChatRoom = async (req: any, res: any) => {
  try {
    const { roomId } = req.params;
    const employeeId = req.admin?._id || req.user?._id;
    const { reason } = req.body;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    const chatRoom = await chatUrlService.closeChatRoom(roomId, employeeId, reason);

    return res.status(200).json({
      success: true,
      result: chatRoom,
      message: 'Chat room closed successfully',
    });
  } catch (error) {
    console.error('Error closing chat room:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Archive a chat room
 */
const archiveChatRoom = async (req: any, res: any) => {
  try {
    const { roomId } = req.params;

    const chatRoom = await chatUrlService.archiveChatRoom(roomId);

    return res.status(200).json({
      success: true,
      result: chatRoom,
      message: 'Chat room archived successfully',
    });
  } catch (error) {
    console.error('Error archiving chat room:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Delete a chat room
 */
const deleteChatRoom = async (req: any, res: any) => {
  try {
    const { roomId } = req.params;

    const chatRoom = await chatUrlService.deleteChatRoom(roomId);

    return res.status(200).json({
      success: true,
      result: chatRoom,
      message: 'Chat room deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get chat statistics for the authenticated employee
 */
const getEmployeeStats = async (req: any, res: any) => {
  try {
    const employeeId = req.admin?._id || req.user?._id;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    const stats = await chatUrlService.getEmployeeStats(employeeId);

    return res.status(200).json({
      success: true,
      result: stats,
      message: 'Statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting employee stats:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

module.exports = {
  generateChatUrl,
  getChatRoomByToken,
  getChatRoomById,
  getEmployeeChatRooms,
  getCustomerChatRooms,
  closeChatRoom,
  archiveChatRoom,
  deleteChatRoom,
  getEmployeeStats,
};
