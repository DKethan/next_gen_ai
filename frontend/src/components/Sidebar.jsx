import { useState, useEffect } from 'react'
import useChatStore from '../state/chatStore'
import { chatApi } from '../api/chatApi'

function Sidebar({ onSelectSession }) {
  const { currentSessionId } = useChatStore()
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      
      // Get current conversations to preserve any new ones
      const currentConversations = conversations
      
      // Try to fetch from API first
      try {
        const apiSessions = await chatApi.listSessions()
        if (apiSessions.sessions && apiSessions.sessions.length > 0) {
          // Map API response to match frontend expected format
          const mappedSessions = apiSessions.sessions.map(session => ({
            id: session.session_id || session.id,
            title: session.title || 'New Conversation',
            lastMessage: session.last_message || session.lastMessage || '',
            updatedAt: session.updated_at || session.updatedAt || new Date().toISOString(),
            messageCount: session.message_count || session.messageCount || 0
          }))
          
          // Merge with localStorage sessions to include new conversations not yet in backend
          const localSessions = getLocalSessions()
          const apiSessionIds = new Set(mappedSessions.map(s => s.id))
          
          // Add local sessions that aren't in API response (new conversations)
          // But only if they have messages (not empty)
          localSessions.forEach(localSession => {
            if (!apiSessionIds.has(localSession.id)) {
              // Only add if it has messages or content
              if (localSession.messageCount > 0 || (localSession.lastMessage && localSession.lastMessage.trim() !== '')) {
                mappedSessions.push(localSession)
              }
            }
          })
          
          // Filter out empty conversations from API results too
          const filteredSessions = mappedSessions.filter(session => {
            return session.messageCount > 0 || (session.lastMessage && session.lastMessage.trim() !== '')
          })
          
          // Sort by date
          filteredSessions.sort((a, b) => {
            const dateA = new Date(a.updatedAt)
            const dateB = new Date(b.updatedAt)
            if (isNaN(dateA.getTime())) return 1
            if (isNaN(dateB.getTime())) return -1
            return dateB - dateA
          })
          
          setConversations(filteredSessions)
          
          // Also sync to localStorage for offline access
          mappedSessions.forEach(session => {
            const sessionKey = `nextmind_session_${session.id}`
            localStorage.setItem(sessionKey, JSON.stringify({
              title: session.title,
              lastMessage: session.lastMessage,
              updatedAt: session.updatedAt,
              messageCount: session.messageCount
            }))
          })
          return
        } else {
          // API returned empty, use localStorage (empty ones already filtered)
          const localSessions = getLocalSessions()
          // Filter out empty conversations
          const filteredSessions = localSessions.filter(session => {
            return session.messageCount > 0 || (session.lastMessage && session.lastMessage.trim() !== '')
          })
          setConversations(filteredSessions)
          return
        }
      } catch (apiError) {
        console.log('API not available, using localStorage')
      }
      
      // Fallback to localStorage
      const localSessions = getLocalSessions()
      // Filter out empty conversations
      const filteredSessions = localSessions.filter(session => {
        return session.messageCount > 0 || (session.lastMessage && session.lastMessage.trim() !== '')
      })
      setConversations(filteredSessions)
    } catch (error) {
      console.error('Error loading conversations:', error)
      // Fallback to localStorage on error
      const localSessions = getLocalSessions()
      const filteredSessions = localSessions.filter(session => {
        return session.messageCount > 0 || (session.lastMessage && session.lastMessage.trim() !== '')
      })
      setConversations(filteredSessions)
    } finally {
      setIsLoading(false)
    }
  }

  const getLocalSessions = () => {
    const sessions = []
    const emptySessions = [] // Track empty sessions to remove
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('nextmind_session_')) {
        const sessionId = key.replace('nextmind_session_', '')
        const sessionData = localStorage.getItem(key)
        try {
          const data = JSON.parse(sessionData)
          // Ensure updatedAt is a valid ISO string
          let updatedAt = data.updatedAt || new Date().toISOString()
          if (updatedAt && typeof updatedAt === 'string') {
            // Validate it's a valid date string
            const date = new Date(updatedAt)
            if (isNaN(date.getTime())) {
              updatedAt = new Date().toISOString()
            }
          } else {
            updatedAt = new Date().toISOString()
          }
          
          const messageCount = data.messageCount || 0
          const lastMessage = data.lastMessage || ''
          const title = data.title || 'New Conversation'
          
          // Skip empty conversations (no messages and no content)
          if (messageCount === 0 && (!lastMessage || lastMessage.trim() === '') && title === 'New Conversation') {
            emptySessions.push(key)
            continue
          }
          
          sessions.push({
            id: sessionId,
            title: title,
            lastMessage: lastMessage,
            updatedAt: updatedAt,
            messageCount: messageCount
          })
        } catch (e) {
          // Invalid data, mark for removal
          emptySessions.push(key)
        }
      }
    }
    
    // Remove empty sessions from localStorage
    emptySessions.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Sort by date, handling invalid dates
    return sessions.sort((a, b) => {
      const dateA = new Date(a.updatedAt)
      const dateB = new Date(b.updatedAt)
      if (isNaN(dateA.getTime())) return 1
      if (isNaN(dateB.getTime())) return -1
      return dateB - dateA
    })
  }

  const handleNewConversation = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create a new conversation entry in localStorage immediately
    const sessionKey = `nextmind_session_${newSessionId}`
    const sessionData = {
      title: 'New Conversation',
      lastMessage: '',
      updatedAt: new Date().toISOString(),
      messageCount: 0
    }
    localStorage.setItem(sessionKey, JSON.stringify(sessionData))
    localStorage.setItem('nextmind_session_id', newSessionId)
    
    // Add to conversations list immediately (optimistic update)
    const newConversation = {
      id: newSessionId,
      title: 'New Conversation',
      lastMessage: '',
      updatedAt: sessionData.updatedAt,
      messageCount: 0
    }
    
    // Add to the top of the list
    setConversations(prev => {
      // Check if it already exists to prevent duplicates
      if (prev.some(c => c.id === newSessionId)) {
        return prev
      }
      return [newConversation, ...prev]
    })
    
    // Select the new session
    onSelectSession(newSessionId)
    
    // Don't reload immediately - let it stay. Only reload when user sends a message
    // The conversation will be synced to backend when first message is sent
  }

  const handleSelectSession = (sessionId) => {
    onSelectSession(sessionId)
  }

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return
    }
    
    try {
      // Try to delete from backend first
      try {
        await chatApi.deleteSession(sessionId)
      } catch (apiError) {
        console.log('Backend delete failed, removing from localStorage only:', apiError)
      }
      
      // Always remove from localStorage as well
      localStorage.removeItem(`nextmind_session_${sessionId}`)
      
      // If it's the current session, create a new one
      if (sessionId === currentSessionId) {
        handleNewConversation()
      }
      
      // Reload conversations list
      loadConversations()
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete conversation. Please try again.')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently'
    
    try {
      // Handle different date formats
      let date
      if (typeof dateString === 'string') {
        // If it's an ISO string without timezone, treat it as UTC
        if (dateString.includes('T') && !dateString.includes('Z') && !dateString.includes('+')) {
          date = new Date(dateString + 'Z')
        } else {
          date = new Date(dateString)
        }
      } else {
        date = new Date(dateString)
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString)
        return 'Recently'
      }
      
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      // Handle future dates (shouldn't happen, but just in case)
      if (diff < 0) {
        return 'Just now'
      }
      
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      if (seconds < 60) {
        return 'Just now'
      } else if (minutes < 60) {
        return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
      } else if (hours < 24) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`
      } else if (days === 1) {
        return 'Yesterday'
      } else if (days < 7) {
        return `${days} days ago`
      } else if (days < 30) {
        const weeks = Math.floor(days / 7)
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
        })
      }
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return 'Recently'
    }
  }

  const truncateText = (text, maxLength = 30) => {
    if (!text) return 'New conversation'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className={`fixed left-0 top-0 h-full bg-white dark:bg-[#171717] border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col transition-all duration-300 ${isExpanded ? 'w-64' : 'w-16'}`}>
      {/* Collapsed View */}
      {!isExpanded && (
        <div className="flex flex-col items-center py-4 h-full">
          {/* Expand Button - First */}
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-4"
            title="Expand sidebar"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* New Chat Button - Second */}
          <button
            onClick={handleNewConversation}
            className="mb-4 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title="New Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Conversation Icons */}
          <div className="flex-1 overflow-y-auto w-full px-2 space-y-2">
            {conversations.slice(0, 8).map((conversation) => (
              <button
                key={conversation.id || conversation.session_id}
                onClick={() => handleSelectSession(conversation.id || conversation.session_id)}
                className={`
                  w-full p-2 rounded-lg transition-colors relative group
                  ${currentSessionId === (conversation.id || conversation.session_id)
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                title={conversation.title}
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {currentSessionId === conversation.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  NextMind
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Proactive AI that predicts your next question
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Collapse sidebar"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conversations
              </h2>
            </div>
            <button
              onClick={handleNewConversation}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id || conversation.session_id}
                    onClick={() => handleSelectSession(conversation.id || conversation.session_id)}
                    className={`
                      relative p-3 rounded-lg mb-1 cursor-pointer group
                      ${currentSessionId === (conversation.id || conversation.session_id)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {conversation.title || 'New Conversation'}
                        </h3>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {truncateText(conversation.lastMessage)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDate(conversation.updatedAt || conversation.updated_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(conversation.id || conversation.session_id, e)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-opacity flex-shrink-0"
                        title="Delete conversation"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Sidebar
