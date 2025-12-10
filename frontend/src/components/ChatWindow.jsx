import { useState, useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import TypingSuggestions from './TypingSuggestions'
import Sidebar from './Sidebar'
import useChatStore from '../state/chatStore'
import { chatApi } from '../api/chatApi'
import { predictionApi } from '../api/predictionApi'
import { useWebSocket } from '../hooks/useWebSocket'

function ChatWindow({ sessionId: initialSessionId }) {
  const {
    messages,
    currentInput,
    suggestions,
    isLoading,
    addMessage,
    setCurrentInput,
    setSuggestions,
    setIsLoading,
    setMessages,
    setSessionId,
  } = useChatStore()
  
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)
  const [precomputedAnswer, setPrecomputedAnswer] = useState(null)
  const [userContext, setUserContext] = useState(null)
  
  // WebSocket for live suggestions
  const { sendMessage: sendWSMessage, lastMessage } = useWebSocket(currentSessionId)
  
  // Update session ID when it changes
  useEffect(() => {
    if (currentSessionId) {
      setSessionId(currentSessionId)
    }
  }, [currentSessionId, setSessionId])
  
  // Load user context on mount and when session changes
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const context = await chatApi.getUserContext()
        setUserContext(context)
      } catch (error) {
        console.error('Error loading user context:', error)
      }
    }
    loadUserContext()
  }, [currentSessionId]) // Reload when session changes
  
  // Load session history on mount or when session changes
  useEffect(() => {
    const loadSession = async () => {
      if (!currentSessionId) return
      try {
        const session = await chatApi.getSession(currentSessionId)
        if (session.messages && session.messages.length > 0) {
          setMessages(session.messages)
        } else {
          setMessages([])
        }
      } catch (error) {
        console.error('Error loading session:', error)
        setMessages([])
      }
    }
    loadSession()
  }, [currentSessionId, setMessages])
  
  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId)
    setSuggestions(null)
    setCurrentInput('')
  }
  
  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'suggestion') {
        setSuggestions({
          predicted_question: lastMessage.predicted_question,
          confidence: lastMessage.confidence,
          topics: lastMessage.topics,
          predictions: lastMessage.predictions || [
            { question: lastMessage.predicted_question, confidence: lastMessage.confidence }
          ],
        })
      } else if (lastMessage.type === 'precomputed_ready') {
        loadPrecomputedAnswer(lastMessage.precomputed_answer_id)
      }
    }
  }, [lastMessage, setSuggestions])
  
  // Scroll to bottom when messages change or suggestions appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, suggestions])
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [currentInput])
  
  const loadPrecomputedAnswer = async (answerId) => {
    try {
      const answer = await predictionApi.getPrecomputedAnswer(answerId)
      setPrecomputedAnswer(answer)
    } catch (error) {
      console.error('Error loading precomputed answer:', error)
    }
  }
  
  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return
    
    const userMessage = {
      role: 'user',
      content: currentInput.trim(),
      timestamp: new Date().toISOString(),
    }
    
    addMessage(userMessage)
    setIsLoading(true)
    
    // Check if we have a precomputed answer that matches
    if (precomputedAnswer && suggestions) {
      const similarity = calculateSimilarity(
        currentInput.toLowerCase(),
        suggestions.predicted_question.toLowerCase()
      )
      
      if (similarity > 0.6) {
        const assistantMessage = {
          role: 'assistant',
          content: precomputedAnswer.answer,
          timestamp: new Date().toISOString(),
        }
        addMessage(assistantMessage)
        setIsLoading(false)
        setCurrentInput('')
        setSuggestions(null)
        setPrecomputedAnswer(null)
        return
      }
    }
    
    try {
      const response = await chatApi.sendMessage(currentSessionId, currentInput.trim())
      
      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      }
      
      addMessage(assistantMessage)
      
      // Trigger prediction for next question
      if (messages.length >= 0) {
        const allMessages = [...messages, userMessage, assistantMessage]
        triggerPrediction(allMessages)
      }
      
      // Reload user context after new message
      const reloadContext = async () => {
        try {
          const context = await chatApi.getUserContext()
          setUserContext(context)
        } catch (error) {
          console.error('Error reloading context:', error)
        }
      }
      reloadContext()
      
    } catch (error) {
      console.error('Error sending message:', error)
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
      setCurrentInput('')
      setSuggestions(null)
      setPrecomputedAnswer(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }
  
  const triggerPrediction = async (messageHistory) => {
    try {
      const prediction = await predictionApi.predictIntent(currentSessionId, messageHistory)
      setSuggestions({
        predicted_question: prediction.predicted_question,
        confidence: prediction.confidence,
        topics: prediction.suggestions,
        predictions: prediction.predictions || [
          { question: prediction.predicted_question, confidence: prediction.confidence }
        ],
      })
      
      if (prediction.precomputed_answer_id) {
        loadPrecomputedAnswer(prediction.precomputed_answer_id)
      }
    } catch (error) {
      console.error('Error predicting intent:', error)
    }
  }
  
  const handleInputChange = (e) => {
    const value = e.target.value
    setCurrentInput(value)
    
    // Send to WebSocket for live suggestions
    if (value.length > 2) {
      sendWSMessage({
        messages: messages,
        current_input: value,
        timestamp: new Date().toISOString(),
      })
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const handleSuggestionClick = async (suggestion) => {
    // Prevent default behavior - we want to send, not fill input
    if (isLoading) {
      console.log('Already loading, ignoring click')
      return
    }
    
    const suggestionText = (suggestion || '').trim()
    if (!suggestionText) {
      console.log('Empty suggestion, ignoring')
      return
    }
    
    console.log('🚀 Suggestion clicked - sending immediately:', suggestionText)
    
    // Clear suggestions and input immediately
    setSuggestions(null)
    setPrecomputedAnswer(null)
    setCurrentInput('') // Make sure input is cleared
    
    // Create user message
    const userMessage = {
      role: 'user',
      content: suggestionText,
      timestamp: new Date().toISOString(),
    }
    
    // Add user message to store immediately
    addMessage(userMessage)
    setIsLoading(true)
    
    try {
      console.log('📤 Sending to API:', suggestionText)
      const response = await chatApi.sendMessage(currentSessionId, suggestionText)
      
      console.log('✅ API response received:', response)
      
      const assistantMessage = {
        role: 'assistant',
        content: response.response || response.message || 'No response received',
        timestamp: new Date().toISOString(),
      }
      
      // Add assistant message to store
      addMessage(assistantMessage)
      
      // Trigger prediction for next question
      const updatedMessages = [...messages, userMessage, assistantMessage]
      triggerPrediction(updatedMessages)
      
      // Reload user context after new message
      const reloadContext = async () => {
        try {
          const context = await chatApi.getUserContext()
          setUserContext(context)
        } catch (error) {
          console.error('Error reloading context:', error)
        }
      }
      reloadContext()
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      // Show error message to user
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }
      addMessage(errorMessage)
    } finally {
      setIsLoading(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }
  
  const calculateSimilarity = (str1, str2) => {
    const words1 = new Set(str1.split(/\s+/))
    const words2 = new Set(str2.split(/\s+/))
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    return union.size > 0 ? intersection.size / union.size : 0
  }
  
  return (
    <div className="flex h-screen bg-white dark:bg-[#171717]">
      {/* Sidebar - Always visible */}
      <Sidebar onSelectSession={handleSelectSession} />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col ml-16">
      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto ${suggestions && suggestions.predictions && suggestions.predictions.length > 0 ? 'pb-[280px]' : 'pb-32'}`}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="text-center max-w-2xl px-4">
                {userContext ? (
                  <>
                    <div className="mb-6">
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                          {userContext.activity_type}
                        </span>
                        {userContext.topics && userContext.topics.length > 0 && (
                          <>
                            <span className="text-blue-400">•</span>
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {userContext.topics[0]}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      {userContext.welcome_message || "How can I help you today?"}
                    </h2>
                    {userContext.current_focus && (
                      <p className="text-gray-600 dark:text-gray-300 text-base mb-4">
                        {userContext.current_focus}
                      </p>
                    )}
                    {userContext.suggested_questions && userContext.suggested_questions.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">You might want to ask:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {userContext.suggested_questions.slice(0, 3).map((question, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleSuggestionClick(question)
                              }}
                              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      How can I help you today?
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Start a conversation and I'll predict your next question
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {messages.map((message, index) => {
            // Check if this is the first user message
            const isFirstUserMessage = message.role === 'user' && 
              messages.slice(0, index).every(msg => msg.role !== 'user')
            
            return (
              <div key={index} className={isFirstUserMessage ? 'mt-8' : ''}>
                <MessageBubble
                  message={message}
                />
              </div>
            )
          })}
          
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="flex items-start space-x-3 max-w-[85%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Floating Input Area */}
      <div className="fixed bottom-0 left-16 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-[#171717] dark:via-[#171717] dark:to-transparent pt-8 pb-4 px-4 pointer-events-none z-10">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          {/* Suggestions */}
          {suggestions && suggestions.predictions && suggestions.predictions.length > 0 && (
            <div className="mb-4 pb-2">
              <TypingSuggestions
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
              />
            </div>
          )}
          
          <div className="relative flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={currentInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Message NextMind..."
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm leading-6 max-h-[200px] overflow-y-auto scrollbar-hide shadow-lg"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!currentInput.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
                title="Send message"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            NextMind can make mistakes. Check important info.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}

export default ChatWindow
