import React, { useState, useEffect, useRef } from 'react';
import { useChatbot } from '../../contexts/chatbotContext.js';
import './ChatbotOverlay.css';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';

const ChatbotOverlay = ({ currentUser }) => {
  const {
    isOpen,
    openChat,
    closeChat,
    messages,
    sendMessage,
    isLoading,
    currentScreen,
    suggestions,
    setSuggestions,
    getSuggestions,
    resetConversation
  } = useChatbot();

  const [inputValue, setInputValue] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadSuggestions = async () => {
      const sug = await getSuggestions(currentScreen, currentUser);
      setSuggestions(sug);
    };
    if (isOpen) {
      loadSuggestions();
    }
  }, [currentScreen, isOpen, currentUser, getSuggestions]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && showWelcome) {
      setTimeout(() => {
        if (messages.length === 0) {
          sendMessage("Hi!", currentUser).then(() => setShowWelcome(false));
        }
      }, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message, currentUser);
  };

  const handleSuggestionClick = async (suggestion) => {
    setInputValue('');
    await sendMessage(suggestion, currentUser);
  };

  const handleReset = async () => {
    if (window.confirm('Reset conversation? This will clear your chat history.')) {
      await resetConversation(currentUser);
      setShowWelcome(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button className="chatbot-fab" onClick={openChat} aria-label="Open chat">
          <ChatIcon />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-modal">
          <div className="chatbot-header">
            <div className="chatbot-avatar">
              <div className="avatar-emoji">💪</div>
            </div>
            <div className="chatbot-title">
              <h3>FitCoach</h3>
              <span className="chatbot-status">Online</span>
            </div>
            <div className="chatbot-actions">
              <button
                className="icon-btn"
                onClick={handleReset}
                title="Reset conversation"
              >
                <RefreshIcon fontSize="small" />
              </button>
              <button className="icon-btn" onClick={closeChat} aria-label="Close chat">
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-timestamp">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message message-assistant">
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {/* Inline Suggestions */}
            {suggestions.length > 0 && !isLoading && (
              <div className="inline-suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-bubble"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotOverlay;