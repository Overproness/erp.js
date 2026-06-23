// @ts-nocheck

import ChatRoom from '@/models/appModels/ChatRoom';
import Client from '@/models/appModels/Client';
import User from '@/models/appModels/User';
import CompanyOwner from '@/models/coreModels/CompanyOwner';
class ChatUrlService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Generate a new chat room URL for customer communication
   * @param {string} customerId - Customer/Client ID
   * @param {string} employeeId - Employee/Admin ID who created the room
   * @param {object} options - Additional options
   * @returns {Promise<object>} Chat room data with URL
   */
  async generateCustomerChatUrl(customerId, employeeId, options = {}) {
    try {
      // Verify customer exists
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Verify employee exists (check both User and CompanyOwner)
      let employee = await User.findById(employeeId);
      if (!employee) {
        employee = await CompanyOwner.findById(employeeId);
      }
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if active room already exists
      if (!options.createNew) {
        const existingRoom = await ChatRoom.findOne({
          customer: customerId,
          employee: employeeId,
          status: 'active',
          enabled: true,
          removed: false,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        });

        if (existingRoom) {
          return {
            chatRoom: existingRoom,
            accessUrl: existingRoom.accessUrl,
            roomId: existingRoom.roomId,
            accessToken: existingRoom.accessToken,
            isExisting: true,
          };
        }
      }

      // Generate unique identifiers
      const roomId = ChatRoom.generateRoomId();
      const accessToken = ChatRoom.generateAccessToken();
      const accessUrl = `${this.baseUrl}/chat/${roomId}?token=${accessToken}`;

      // Determine employee model type
      const employeeModel = employee.constructor.modelName || 'User';

      // Create new chat room
      const chatRoom = new ChatRoom({
        roomId,
        accessToken,
        accessUrl,
        employee: employeeId,
        employeeModel,
        customer: customerId,
        employeeName: employee.name || employee.email,
        customerName: customer.name || customer.email,
        title: options.title || `Chat with ${customer.name || 'Customer'}`,
        description:
          options.description || `Direct communication channel with ${customer.name || 'customer'}`,
        createdBy: employeeId,
        expiresAt: options.expiresAt,
        allowFileSharing: options.allowFileSharing !== false,
        tags: options.tags || ['customer-support'],
        status: 'active',
        enabled: true,
      });

      await chatRoom.save();

      return {
        chatRoom,
        accessUrl,
        roomId,
        accessToken,
        isExisting: false,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
        },
      };
    } catch (error) {
      console.error('Error generating customer chat URL:', error);
      throw new Error(`Failed to generate chat URL: ${error.message}`);
    }
  }

  /**
   * Get chat room by access token
   * @param {string} accessToken - Access token for the chat room
   * @returns {Promise<object>} Chat room data
   */
  async getChatRoomByToken(accessToken) {
    try {
      const chatRoom = await ChatRoom.getRoomByToken(accessToken);

      if (!chatRoom) {
        throw new Error('Chat room not found or expired');
      }

      return chatRoom;
    } catch (error) {
      console.error('Error getting chat room by token:', error);
      throw new Error(`Failed to get chat room: ${error.message}`);
    }
  }

  /**
   * Get chat room by room ID
   * @param {string} roomId - Room ID
   * @returns {Promise<object>} Chat room data
   */
  async getChatRoomById(roomId) {
    try {
      const chatRoom = await ChatRoom.findOne({ roomId, enabled: true, removed: false })
        .populate('employee', 'name email')
        .populate('customer', 'name email phone company');

      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      return chatRoom;
    } catch (error) {
      console.error('Error getting chat room by ID:', error);
      throw new Error(`Failed to get chat room: ${error.message}`);
    }
  }

  /**
   * Get all chat rooms for an employee
   * @param {string} employeeId - Employee ID
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} List of chat rooms
   */
  async getEmployeeChatRooms(employeeId, filters = {}) {
    try {
      const query = {
        employee: employeeId,
        enabled: true,
        removed: false,
      };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.customerId) {
        query.customer = filters.customerId;
      }

      const chatRooms = await ChatRoom.find(query)
        .populate('customer', 'name email phone company')
        .sort({ updatedAt: -1 })
        .limit(filters.limit || 50);

      return chatRooms;
    } catch (error) {
      console.error('Error getting employee chat rooms:', error);
      throw new Error(`Failed to get chat rooms: ${error.message}`);
    }
  }

  /**
   * Get all chat rooms for a customer
   * @param {string} customerId - Customer ID
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} List of chat rooms
   */
  async getCustomerChatRooms(customerId, filters = {}) {
    try {
      const query = {
        customer: customerId,
        enabled: true,
        removed: false,
      };

      if (filters.status) {
        query.status = filters.status;
      }

      const chatRooms = await ChatRoom.find(query)
        .populate('employee', 'name email')
        .sort({ updatedAt: -1 })
        .limit(filters.limit || 50);

      return chatRooms;
    } catch (error) {
      console.error('Error getting customer chat rooms:', error);
      throw new Error(`Failed to get chat rooms: ${error.message}`);
    }
  }

  /**
   * Close a chat room
   * @param {string} roomId - Room ID
   * @param {string} closedBy - User ID who closed the room
   * @param {string} reason - Reason for closing
   * @returns {Promise<object>} Updated chat room
   */
  async closeChatRoom(roomId, closedBy, reason) {
    try {
      const chatRoom = await ChatRoom.findOne({ roomId });

      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      await chatRoom.closeRoom(closedBy, reason);

      return chatRoom;
    } catch (error) {
      console.error('Error closing chat room:', error);
      throw new Error(`Failed to close chat room: ${error.message}`);
    }
  }

  /**
   * Archive a chat room
   * @param {string} roomId - Room ID
   * @returns {Promise<object>} Updated chat room
   */
  async archiveChatRoom(roomId) {
    try {
      const chatRoom = await ChatRoom.findOneAndUpdate(
        { roomId },
        { status: 'archived' },
        { new: true }
      );

      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      return chatRoom;
    } catch (error) {
      console.error('Error archiving chat room:', error);
      throw new Error(`Failed to archive chat room: ${error.message}`);
    }
  }

  /**
   * Delete a chat room (soft delete)
   * @param {string} roomId - Room ID
   * @returns {Promise<object>} Updated chat room
   */
  async deleteChatRoom(roomId) {
    try {
      const chatRoom = await ChatRoom.findOneAndUpdate(
        { roomId },
        { removed: true, enabled: false },
        { new: true }
      );

      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      return chatRoom;
    } catch (error) {
      console.error('Error deleting chat room:', error);
      throw new Error(`Failed to delete chat room: ${error.message}`);
    }
  }

  /**
   * Get chat statistics for employee
   * @param {string} employeeId - Employee ID
   * @returns {Promise<object>} Statistics
   */
  async getEmployeeStats(employeeId) {
    try {
      const chatRooms = await ChatRoom.find({
        employee: employeeId,
        enabled: true,
        removed: false,
      });

      const stats = {
        totalRooms: chatRooms.length,
        activeRooms: chatRooms.filter((r) => r.status === 'active').length,
        closedRooms: chatRooms.filter((r) => r.status === 'closed').length,
        totalMessages: chatRooms.reduce((sum, r) => sum + r.totalMessages, 0),
        totalEmployeeMessages: chatRooms.reduce((sum, r) => sum + r.employeeMessageCount, 0),
        totalCustomerMessages: chatRooms.reduce((sum, r) => sum + r.customerMessageCount, 0),
        unreadMessages: chatRooms.reduce((sum, r) => sum + r.unreadMessagesForEmployee, 0),
      };

      return stats;
    } catch (error) {
      console.error('Error getting employee stats:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}

export = new ChatUrlService();
