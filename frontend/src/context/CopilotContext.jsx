import { notification } from 'antd';
import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { request } from '../request';

const CopilotContext = createContext();

/**
 * Copilot Context Provider
 * Manages AI chatbot state and functionality across modules
 */
export const CopilotProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [currentModule, setCurrentModule] = useState('general');
  const [moduleContext, setModuleContext] = useState({});
  const [conversationId, setConversationId] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o'); // Default model

  // Ref to track the current conversation
  const conversationRef = useRef({ module: 'general', entityId: null });

  /**
   * Reset conversation when module changes
   */
  useEffect(() => {
    const prevModule = conversationRef.current.module;
    const prevEntityId = conversationRef.current.entityId;
    const currentEntityId = moduleContext.entityId;

    if (prevModule !== currentModule || prevEntityId !== currentEntityId) {
      // Module or entity changed, reset conversation
      setMessages([]);
      setConversationId(null);
      conversationRef.current = {
        module: currentModule,
        entityId: currentEntityId,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule, moduleContext.entityId]);

  /**
   * Send message to copilot
   */
  const sendMessage = useCallback(
    async (message, customContext = {}) => {
      if (!message || message.trim().length === 0) {
        return;
      }

      try {
        setIsLoading(true);
        setIsTyping(true);

        // Add user message to UI immediately
        const userMessage = {
          id: Date.now(),
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Build context
        const context = {
          module: currentModule,
          model: selectedModel,
          ...moduleContext,
          ...customContext,
        };

        // Send to API
        const response = await request.post({
          entity: 'copilot',
          subEntity: 'chat',
          jsonData: {
            message,
            context,
          },
        });

        setIsTyping(false);

        if (response.success) {
          // Add AI response to messages
          const aiMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: response.result.message,
            timestamp: new Date().toISOString(),
            usage: response.result.usage,
            cost: response.result.cost,
          };
          setMessages((prev) => [...prev, aiMessage]);

          // Update conversation ID
          if (response.result.conversationId) {
            setConversationId(response.result.conversationId);
          }

          // Update suggestions if provided
          if (response.result.suggestions && response.result.suggestions.length > 0) {
            setSuggestions(response.result.suggestions);
          }
        } else {
          throw new Error(response.message || 'Failed to send message');
        }
      } catch (error) {
        console.error('Send message error:', error);
        setIsTyping(false);

        notification.error({
          message: 'Copilot Error',
          description: error.message || 'Failed to send message. Please try again.',
          duration: 4,
        });

        // Add error message to chat
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentModule, moduleContext, selectedModel]
  );

  /**
   * Load module-specific suggestions
   */
  const loadSuggestions = useCallback(
    async (module, context = {}) => {
      try {
        const response = await request.post({
          entity: 'copilot',
          subEntity: 'suggestions',
          jsonData: {
            module: module || currentModule,
            context,
          },
        });

        if (response.success && response.result.suggestions) {
          setSuggestions(response.result.suggestions);
        }
      } catch (error) {
        console.error('Load suggestions error:', error);
      }
    },
    [currentModule]
  );

  /**
   * Set the current module context
   */
  const updateModuleContext = useCallback((module, context = {}) => {
    setCurrentModule(module);
    setModuleContext(context);

    // Don't auto-load suggestions - they'll be loaded when chat opens
    // This prevents excessive API calls on page load
  }, []);

  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setSuggestions([]);
  }, []);

  /**
   * Toggle copilot open/close
   */
  const toggleCopilot = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  /**
   * Open copilot
   */
  const openCopilot = useCallback(() => {
    setIsOpen(true);
    // Load suggestions when opening if we don't have any
    if (suggestions.length === 0) {
      loadSuggestions(currentModule, moduleContext);
    }
  }, [suggestions.length, currentModule, moduleContext, loadSuggestions]);

  /**
   * Close copilot
   */
  const closeCopilot = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = useCallback(
    async (suggestion) => {
      if (suggestion.type === 'question' && suggestion.question) {
        // Send the suggested question
        await sendMessage(suggestion.question);
      } else if (suggestion.type === 'action' && suggestion.action) {
        // Handle action-type suggestions
        // You can emit events or call callbacks here
        console.log('Action suggestion clicked:', suggestion.action);
      }
    },
    [sendMessage]
  );

  const value = {
    // State
    isOpen,
    messages,
    isLoading,
    isTyping,
    suggestions,
    currentModule,
    moduleContext,
    conversationId,
    selectedModel,

    // Methods
    sendMessage,
    setModuleContext: updateModuleContext,
    setSelectedModel,
    clearConversation,
    toggleCopilot,
    openCopilot,
    closeCopilot,
    loadSuggestions,
    handleSuggestionClick,
  };

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
};

export default CopilotContext;
