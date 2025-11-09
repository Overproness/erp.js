const AiKnowledgeBase = require('../models/appModels/AiKnowledgeBase');

class KnowledgeBaseHelper {
  async createKnowledgeBase(data, userId) {
    try {
      const knowledgeBase = new AiKnowledgeBase({
        ...data,
        owner: userId,
        createdBy: userId,
      });

      await knowledgeBase.save();
      return knowledgeBase;
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      throw error;
    }
  }

  async addEntry(knowledgeBaseId, entryData) {
    try {
      const knowledgeBase = await AiKnowledgeBase.findById(knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('Knowledge base not found');
      }

      const entry = {
        ...entryData,
        created: new Date(),
        usageCount: 0,
      };

      knowledgeBase.entries.push(entry);
      await knowledgeBase.save();

      return entry;
    } catch (error) {
      console.error('Error adding knowledge entry:', error);
      throw error;
    }
  }

  async updateEntry(knowledgeBaseId, entryId, updates) {
    try {
      const knowledgeBase = await AiKnowledgeBase.findById(knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('Knowledge base not found');
      }

      const entry = knowledgeBase.entries.id(entryId);
      if (!entry) {
        throw new Error('Knowledge entry not found');
      }

      Object.assign(entry, updates, { updated: new Date() });
      await knowledgeBase.save();

      return entry;
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      throw error;
    }
  }

  async deleteEntry(knowledgeBaseId, entryId) {
    try {
      const knowledgeBase = await AiKnowledgeBase.findById(knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('Knowledge base not found');
      }

      knowledgeBase.entries.id(entryId).remove();
      await knowledgeBase.save();

      return true;
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
      throw error;
    }
  }

  async searchEntries(knowledgeBaseId, query, options = {}) {
    try {
      const knowledgeBase = await AiKnowledgeBase.findById(knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('Knowledge base not found');
      }

      let entries = knowledgeBase.entries;

      // Text search
      if (query) {
        const searchRegex = new RegExp(query, 'i');
        entries = entries.filter(entry =>
          searchRegex.test(entry.title) ||
          searchRegex.test(entry.content) ||
          entry.tags.some(tag => searchRegex.test(tag))
        );
      }

      // Category filter
      if (options.category) {
        entries = entries.filter(entry => entry.category === options.category);
      }

      // Priority filter
      if (options.minPriority) {
        entries = entries.filter(entry => entry.priority >= options.minPriority);
      }

      // Sort by relevance (usage count, priority, confidence)
      entries.sort((a, b) => {
        if (options.sortBy === 'usage') {
          return b.usageCount - a.usageCount;
        } else if (options.sortBy === 'priority') {
          return b.priority - a.priority;
        } else if (options.sortBy === 'confidence') {
          return b.confidence - a.confidence;
        } else {
          // Default: relevance score
          return this.calculateRelevanceScore(b) - this.calculateRelevanceScore(a);
        }
      });

      // Limit results
      if (options.limit) {
        entries = entries.slice(0, options.limit);
      }

      return entries;
    } catch (error) {
      console.error('Error searching knowledge entries:', error);
      throw error;
    }
  }

  async getRelevantEntries(knowledgeBaseId, context, limit = 5) {
    try {
      const searchTerms = this.extractSearchTerms(context);
      const entries = await this.searchEntries(knowledgeBaseId, searchTerms.join(' '), {
        limit: limit * 2 // Get more than needed for better filtering
      });

      // Score entries based on context relevance
      const scoredEntries = entries.map(entry => ({
        ...entry.toObject(),
        relevanceScore: this.calculateContextRelevance(entry, context)
      }));

      // Sort by relevance and return top entries
      return scoredEntries
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting relevant entries:', error);
      throw error;
    }
  }

  async recordUsage(knowledgeBaseId, entryId) {
    try {
      const knowledgeBase = await AiKnowledgeBase.findById(knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('Knowledge base not found');
      }

      const entry = knowledgeBase.entries.id(entryId);
      if (!entry) {
        throw new Error('Knowledge entry not found');
      }

      entry.usageCount += 1;
      entry.lastUsed = new Date();

      await knowledgeBase.save();
      return entry;
    } catch (error) {
      console.error('Error recording knowledge usage:', error);
      throw error;
    }
  }

  async getPopularEntries(knowledgeBaseId, limit = 10) {
    try {
      const knowledgeBase = await AiKnowledgeBase.findById(knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('Knowledge base not found');
      }

      return knowledgeBase.entries
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting popular entries:', error);
      throw error;
    }
  }

  async getEntryStats(knowledgeBaseId) {
    try {
      const knowledgeBase = await AiKnowledgeBase.findById(knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('Knowledge base not found');
      }

      const entries = knowledgeBase.entries;
      const categories = [...new Set(entries.map(e => e.category))];
      
      const stats = {
        totalEntries: entries.length,
        categoriesCount: categories.length,
        averageConfidence: entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length,
        totalUsage: entries.reduce((sum, e) => sum + e.usageCount, 0),
        lastUpdated: knowledgeBase.updated,
        categories: categories.map(category => ({
          name: category,
          count: entries.filter(e => e.category === category).length
        }))
      };

      return stats;
    } catch (error) {
      console.error('Error getting entry stats:', error);
      throw error;
    }
  }

  extractSearchTerms(context) {
    const terms = [];
    
    if (context.module) {
      terms.push(context.module);
    }
    
    if (context.action) {
      terms.push(context.action);
    }
    
    if (context.entityType) {
      terms.push(context.entityType);
    }
    
    if (context.keywords) {
      terms.push(...context.keywords);
    }

    return terms;
  }

  calculateRelevanceScore(entry) {
    let score = 0;
    
    // Usage weight
    score += entry.usageCount * 0.3;
    
    // Priority weight
    score += entry.priority * 0.4;
    
    // Confidence weight
    score += entry.confidence * 0.3;
    
    // Recent usage bonus
    if (entry.lastUsed) {
      const daysSinceUsed = (Date.now() - entry.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUsed < 7) {
        score += 0.2;
      }
    }

    return score;
  }

  calculateContextRelevance(entry, context) {
    let relevance = 0;
    
    // Module relevance
    if (context.module && entry.tags.includes(context.module)) {
      relevance += 0.4;
    }
    
    // Category relevance
    if (context.category && entry.category === context.category) {
      relevance += 0.3;
    }
    
    // Keyword matching
    if (context.keywords) {
      const matchingKeywords = context.keywords.filter(keyword =>
        entry.title.toLowerCase().includes(keyword.toLowerCase()) ||
        entry.content.toLowerCase().includes(keyword.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
      );
      relevance += (matchingKeywords.length / context.keywords.length) * 0.3;
    }

    return relevance;
  }

  async importEntries(knowledgeBaseId, entries) {
    try {
      const knowledgeBase = await AiKnowledgeBase.findById(knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('Knowledge base not found');
      }

      const processedEntries = entries.map(entry => ({
        ...entry,
        created: new Date(),
        usageCount: 0,
        confidence: entry.confidence || 0.8,
        priority: entry.priority || 5
      }));

      knowledgeBase.entries.push(...processedEntries);
      await knowledgeBase.save();

      return processedEntries;
    } catch (error) {
      console.error('Error importing entries:', error);
      throw error;
    }
  }

  async exportEntries(knowledgeBaseId, format = 'json') {
    try {
      const knowledgeBase = await AiKnowledgeBase.findById(knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('Knowledge base not found');
      }

      const exportData = {
        knowledgeBase: {
          name: knowledgeBase.name,
          description: knowledgeBase.description,
          domain: knowledgeBase.domain,
        },
        entries: knowledgeBase.entries.map(entry => ({
          title: entry.title,
          content: entry.content,
          category: entry.category,
          tags: entry.tags,
          priority: entry.priority,
          confidence: entry.confidence,
        })),
        exportedAt: new Date(),
      };

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else if (format === 'csv') {
        return this.formatAsCSV(exportData.entries);
      }

      return exportData;
    } catch (error) {
      console.error('Error exporting entries:', error);
      throw error;
    }
  }

  formatAsCSV(entries) {
    const headers = ['title', 'content', 'category', 'tags', 'priority', 'confidence'];
    const csvRows = [headers.join(',')];
    
    entries.forEach(entry => {
      const row = headers.map(header => {
        const value = entry[header];
        if (Array.isArray(value)) {
          return `"${value.join(';')}"`;
        }
        return `"${value || ''}"`;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}

module.exports = new KnowledgeBaseHelper();
