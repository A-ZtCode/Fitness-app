import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const ChatbotContext = createContext();

export const ChatbotProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('general');
  const [suggestions, setSuggestions] = useState([]);

  const CHATBOT_API = process.env.REACT_APP_CHATBOT_API || 'http://localhost:5052';

  const sendMessage = useCallback(async (message, username, contextData = {}) => {
  const userMessage = { role: 'user', content: message, timestamp: new Date() };
  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);

  try {
    const response = await axios.post(`${CHATBOT_API}/api/chat`, {
      message,
      username,
      context: {
        screen: currentScreen,
        data: contextData
      }
    });

    const assistantMessage = {
      role: 'assistant',
      content: response.data.response,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);
    
    // Update suggestions if provided
    if (response.data.suggestions) {
      setSuggestions(response.data.suggestions);
    }
  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = {
      role: 'assistant',
      content: "Sorry, I'm having trouble connecting. Please try again! 😊",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
}, [currentScreen, CHATBOT_API]);

  const getSuggestions = useCallback(async (screen, username) => {
    try {
      const response = await axios.get(`${CHATBOT_API}/api/chat/suggestions`, {
        params: { screen, username }
      });
      return response.data.suggestions || [];
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }, [CHATBOT_API]);

  const resetConversation = useCallback(async (username) => {
    try {
      await axios.post(`${CHATBOT_API}/api/chat/reset`, { username });
      setMessages([]);
    } catch (error) {
      console.error('Failed to reset conversation:', error);
    }
  }, [CHATBOT_API]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

    return (
    <ChatbotContext.Provider
        value={{
        isOpen,
        openChat,
        closeChat,
        messages,
        sendMessage,
        isLoading,
        currentScreen,
        setCurrentScreen,
        suggestions,
        setSuggestions,
        getSuggestions,
        resetConversation
        }}
    >
        {children}
    </ChatbotContext.Provider>
    );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return context;
};