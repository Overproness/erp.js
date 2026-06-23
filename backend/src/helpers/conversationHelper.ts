// @ts-nocheck

import AiConversation from '../models/appModels/AiConversation';
class ConversationHelper {
  async createConversation(assistantId, userId, context = {}) {
    try {
      const conversation = new AiConversation({
        aiAssistant: assistantId,
        user: userId,
        owner: userId,
        context,
        messages: [],
        status: 'active',
      });

      await conversation.save();
      return conversation;
    } catch (error) {
      console.error('Create conversation error:', error);
      throw error;
    }
  }

  async addMessage(conversationId, role, content, metadata = {}) {
    try {
      const conversation = await AiConversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const message = {
        role,
        content,
        timestamp: new Date(),
        metadata,
      };

      conversation.messages.push(message);
      conversation.updated = new Date();

      if (metadata.tokens) {
        conversation.totalTokens += metadata.tokens;
      }

      if (metadata.cost) {
        conversation.totalCost += metadata.cost;
      }

      await conversation.save();
      return conversation;
    } catch (error) {
      console.error('Add message error:', error);
      throw error;
    }
  }

  async getConversationHistory(conversationId, limit = 50) {
    try {
      const conversation = await AiConversation.findById(conversationId).populate(
        'aiAssistant',
        'name type'
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messages = conversation.messages.slice(-limit).map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      }));

      return {
        conversation: {
          id: conversation._id,
          title: conversation.title,
          assistant: conversation.aiAssistant,
          user: conversation.user,
          context: conversation.context,
          status: conversation.status,
          created: conversation.created,
          updated: conversation.updated,
        },
        messages,
        totalMessages: conversation.messages.length,
        totalTokens: conversation.totalTokens,
        totalCost: conversation.totalCost,
      };
    } catch (error) {
      console.error('Get conversation history error:', error);
      throw error;
    }
  }

  async searchConversations(userId, query, filters = {}) {
    try {
      const searchFilter = {
        owner: userId,
        removed: false,
      };

      if (filters.assistantId) {
        searchFilter.aiAssistant = filters.assistantId;
      }

      if (filters.status) {
        searchFilter.status = filters.status;
      }

      if (filters.module) {
        searchFilter['context.module'] = filters.module;
      }

      if (query) {
        searchFilter.$or = [
          { title: { $regex: query, $options: 'i' } },
          { 'messages.content': { $regex: query, $options: 'i' } },
        ];
      }

      const conversations = await AiConversation.find(searchFilter)
        .populate('aiAssistant', 'name type')
        .sort({ updated: -1 })
        .limit(filters.limit || 20);

      return conversations.map((conv) => ({
        id: conv._id,
        title: conv.title || this.generateConversationTitle(conv.messages[0]?.content),
        assistant: conv.aiAssistant,
        context: conv.context,
        status: conv.status,
        messageCount: conv.messages.length,
        lastMessage: conv.messages[conv.messages.length - 1],
        created: conv.created,
        updated: conv.updated,
      }));
    } catch (error) {
      console.error('Search conversations error:', error);
      throw error;
    }
  }

  async archiveConversation(conversationId, userId) {
    try {
      const conversation = await AiConversation.findOneAndUpdate(
        {
          _id: conversationId,
          owner: userId,
        },
        {
          status: 'archived',
          updated: new Date(),
        },
        { new: true }
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      return conversation;
    } catch (error) {
      console.error('Archive conversation error:', error);
      throw error;
    }
  }

  async updateConversation(conversationId, userId, updateData) {
    try {
      const conversation = await AiConversation.findOneAndUpdate(
        {
          _id: conversationId,
          owner: userId,
        },
        {
          ...updateData,
          updated: new Date(),
        },
        { new: true }
      ).populate('aiAssistant', 'name type');

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      return conversation;
    } catch (error) {
      console.error('Update conversation error:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId, userId) {
    try {
      const conversation = await AiConversation.findOneAndUpdate(
        {
          _id: conversationId,
          owner: userId,
        },
        {
          removed: true,
          updated: new Date(),
        },
        { new: true }
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      return conversation;
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  }

  generateConversationTitle(firstMessage) {
    if (!firstMessage) return 'New Conversation';

    const title = firstMessage.length > 50 ? firstMessage.substring(0, 47) + '...' : firstMessage;

    return title;
  }

  async getConversationStats(userId, dateRange = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const stats = await AiConversation.aggregate([
        {
          $match: {
            owner: userId,
            removed: false,
            created: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            totalMessages: { $sum: { $size: '$messages' } },
            totalTokens: { $sum: '$totalTokens' },
            totalCost: { $sum: '$totalCost' },
            avgMessagesPerConversation: { $avg: { $size: '$messages' } },
          },
        },
      ]);

      return (
        stats[0] || {
          totalConversations: 0,
          totalMessages: 0,
          totalTokens: 0,
          totalCost: 0,
          avgMessagesPerConversation: 0,
        }
      );
    } catch (error) {
      console.error('Get conversation stats error:', error);
      throw error;
    }
  }

  async exportConversation(conversationId, userId, format = 'json') {
    try {
      const conversationData = await this.getConversationHistory(conversationId);

      if (!conversationData) {
        throw new Error('Conversation not found');
      }

      switch (format) {
        case 'json':
          return JSON.stringify(conversationData, null, 2);

        case 'txt':
          return this.formatConversationAsText(conversationData);

        case 'markdown':
          return this.formatConversationAsMarkdown(conversationData);

        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export conversation error:', error);
      throw error;
    }
  }

  formatConversationAsText(conversationData) {
    let text = `Conversation: ${conversationData.conversation.title}\n`;
    text += `Assistant: ${conversationData.conversation.assistant.name}\n`;
    text += `Created: ${conversationData.conversation.created}\n\n`;

    conversationData.messages.forEach((msg) => {
      text += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      text += `Time: ${msg.timestamp}\n\n`;
    });

    return text;
  }

  formatConversationAsMarkdown(conversationData) {
    let md = `# ${conversationData.conversation.title}\n\n`;
    md += `**Assistant:** ${conversationData.conversation.assistant.name}\n`;
    md += `**Created:** ${conversationData.conversation.created}\n\n`;

    conversationData.messages.forEach((msg) => {
      md += `## ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n`;
      md += `${msg.content}\n\n`;
      md += `*${msg.timestamp}*\n\n`;
    });

    return md;
  }
}

export = new ConversationHelper();
