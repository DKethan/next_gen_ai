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
      // Try to fetch from API first
      try {
        const apiSessions = await chatApi.listSessions()
        if (apiSessions.sessions && apiSessions.sessions.length > 0) {
          setConversations(apiSessions.sessions)
          return
        }
      } catch (apiError) {
        console.log('API not available, using localStorage')
      }
      
      // Fallback to localStorage
      const localSessions = getLocalSessions()
      setConversations(localSessions)
    } catch (error) {
      console.error('Error loading conversations:', error)
      // Fallback to localStorage on error
      setConversations(getLocalSessions())
    } finally {
      setIsLoading(false)
    }
  }

  const getLocalSessions = () => {
    const sessions = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('mindnext_session_')) {
        const sessionId = key.replace('mindnext_session_', '')
        const sessionData = localStorage.getItem(key)
        try {
          const data = JSON.parse(sessionData)
          sessions.push({
            id: sessionId,
            title: data.title || 'New Conversation',
            lastMessage: data.lastMessage || '',
            updatedAt: data.updatedAt || new Date().toISOString(),
            messageCount: data.messageCount || 0
          })
        } catch (e) {
          sessions.push({
            id: sessionId,
            title: 'New Conversation',
            lastMessage: '',
            updatedAt: new Date().toISOString(),
            messageCount: 0
          })
        }
      }
    }
    return sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }

  const handleNewConversation = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    onSelectSession(newSessionId)
  }

  const handleSelectSession = (sessionId) => {
    onSelectSession(sessionId)
  }

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation()
    e.preventDefault()
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      // Remove from localStorage
      localStorage.removeItem(`mindnext_session_${sessionId}`)
      
      // If it's the current session, create a new one
      if (sessionId === currentSessionId) {
        handleNewConversation()
      } else {
        // Reload conversations list
        loadConversations()
      }
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return 'Today'
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString()
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
                key={conversation.id}
                onClick={() => handleSelectSession(conversation.id)}
                className={`
                  w-full p-2 rounded-lg transition-colors relative group
                  ${currentSessionId === conversation.id
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
                  MindNext
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
                    key={conversation.id}
                    onClick={() => handleSelectSession(conversation.id)}
                    className={`
                      relative p-3 rounded-lg mb-1 cursor-pointer group
                      ${currentSessionId === conversation.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {conversation.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {truncateText(conversation.lastMessage)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDate(conversation.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(conversation.id, e)}
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
