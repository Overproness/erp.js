import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { selectAppSettings } from '@/redux/settings/selectors';
import { notification } from 'antd';
import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import apolloClient from '@/graphql/client';
import { AI_CHAT, AI_SUGGEST } from '@/graphql/operations/ai';

const CopilotContext = createContext();

/**
 * Copilot Context Provider
 * Manages AI chatbot state and functionality across modules
 */
export const CopilotProvider = ({ children }) => {
  const appSettings = useSelector(selectAppSettings);
  const currentAdmin = useSelector(selectCurrentAdmin);
  // console.log('🚀 ~ CopilotProvider ~ appSettings:', appSettings);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [currentModule, setCurrentModule] = useState('general');
  const [moduleContext, setModuleContext] = useState({});
  const [conversationId, setConversationId] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o'); // Default model
  const [availableModels, setAvailableModels] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);

  // Ref to track the current conversation
  const conversationRef = useRef({ module: 'general', entityId: null });

  /**
   * Check if at least one AI API key is configured
   */
  const hasApiKeys = useCallback(() => {
    if (!appSettings) return false;

    const hasOpenAI = appSettings.openai_api_key && appSettings.openai_api_key.trim().length > 0;
    const hasGemini = appSettings.gemini_api_key && appSettings.gemini_api_key.trim().length > 0;
    const hasClaude = appSettings.claude_api_key && appSettings.claude_api_key.trim().length > 0;

    return hasOpenAI || hasGemini || hasClaude;
  }, [appSettings]);

  /**
   * Load available AI models from backend
   */
  const loadAvailableModels = useCallback(async () => {
    try {
      // No GraphQL operation for copilot models — keep REST
      const { request } = await import('@/request');
      const response = await request.get({
        entity: 'copilot',
        endpoint: 'models',
      });

      // console.log('Models API response:', response);

      if (response.success && response.result) {
        const models = response.result.models || [];
        const providers = response.result.availableProviders || [];

        // console.log('Available models:', models);
        // console.log('Available providers:', providers);

        setAvailableModels(models);
        setAvailableProviders(providers);

        // Set default model to first available if current is not available
        if (models.length > 0) {
          const currentModelAvailable = models.some((m) => m.value === selectedModel);
          if (!currentModelAvailable) {
            console.log('Current model not available, switching to:', models[0].value);
            setSelectedModel(models[0].value);
          }
        } else {
          console.warn('No models available from API');
        }
      } else {
        console.warn('Failed to load models:', response);
      }
    } catch (error) {
      console.error('Load models error:', error);
    }
  }, [selectedModel]);

  /**
   * Load models when settings change
   */
  useEffect(() => {
    // Only load models if user is authenticated
    if (appSettings && currentAdmin?.token) {
      // console.log('Loading available models, hasApiKeys:', hasApiKeys());
      loadAvailableModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSettings, currentAdmin?.token, loadAvailableModels]);

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

        // Send to API via GraphQL
        const { data } = await apolloClient.mutate({
          mutation: AI_CHAT,
          variables: {
            input: {
              message,
              ...context,
            },
          },
        });

        setIsTyping(false);

        if (data.aiChat?.success) {
          // Add AI response to messages
          const aiMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: data.aiChat.result.message,
            timestamp: new Date().toISOString(),
            usage: data.aiChat.result.usage,
            cost: data.aiChat.result.cost,
          };
          setMessages((prev) => [...prev, aiMessage]);

          // Update conversation ID
          if (data.aiChat.result.conversationId) {
            setConversationId(data.aiChat.result.conversationId);
          }

          // Update suggestions if provided
          if (data.aiChat.result.suggestions && data.aiChat.result.suggestions.length > 0) {
            setSuggestions(data.aiChat.result.suggestions);
          }
        } else {
          throw new Error(data.aiChat?.message || 'Failed to send message');
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
        const { data } = await apolloClient.mutate({
          mutation: AI_SUGGEST,
          variables: {
            input: {
              module: module || currentModule,
              ...context,
            },
          },
        });

        if (data.aiSuggest?.success && data.aiSuggest.result?.suggestions) {
          setSuggestions(data.aiSuggest.result.suggestions);
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
    if (!isOpen && !hasApiKeys()) {
      notification.warning({
        message: 'AI Configuration Required',
        description:
          'Please configure at least one AI API key (OpenAI, Gemini, or Claude) in Settings before using the AI Copilot.',
        duration: 6,
      });
      return;
    }
    setIsOpen((prev) => !prev);
  }, [isOpen, hasApiKeys]);

  /**
   * Open copilot
   */
  const openCopilot = useCallback(() => {
    if (!hasApiKeys()) {
      notification.warning({
        message: 'AI Configuration Required',
        description:
          'Please configure at least one AI API key (OpenAI, Gemini, or Claude) in Settings before using the AI Copilot.',
        duration: 6,
      });
      return;
    }
    setIsOpen(true);
    // Load suggestions when opening if we don't have any
    if (suggestions.length === 0) {
      loadSuggestions(currentModule, moduleContext);
    }
  }, [hasApiKeys, suggestions.length, currentModule, moduleContext, loadSuggestions]);

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
    availableModels,
    availableProviders,

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
    loadAvailableModels,
  };

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
};

export default CopilotContext;
