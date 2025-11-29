import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  messages: [],
  sessionId: null,
  currentSessionId: null,
  currentInput: '',
  suggestions: null,
  precomputedAnswerId: null,
  isLoading: false,
  isTyping: false,
  sidebarOpen: true,
  
  setSessionId: (sessionId) => {
    set({ sessionId, currentSessionId: sessionId })
    // Save to localStorage
    if (sessionId) {
      localStorage.setItem('mindnext_session_id', sessionId)
    }
  },
  
  addMessage: (message) => {
    const state = get()
    const newMessages = [...state.messages, message]
    set({ messages: newMessages })
    
    // Update session in localStorage
    if (state.sessionId) {
      const sessionKey = `mindnext_session_${state.sessionId}`
      const sessionData = {
        title: newMessages[0]?.content?.substring(0, 50) || 'New Conversation',
        lastMessage: message.content,
        updatedAt: new Date().toISOString(),
        messageCount: newMessages.length
      }
      localStorage.setItem(sessionKey, JSON.stringify(sessionData))
    }
  },
  
  setMessages: (messages) => {
    set({ messages })
    // Update session title from first message
    const state = get()
    if (state.sessionId && messages.length > 0) {
      const sessionKey = `mindnext_session_${state.sessionId}`
      const sessionData = {
        title: messages[0]?.content?.substring(0, 50) || 'New Conversation',
        lastMessage: messages[messages.length - 1]?.content || '',
        updatedAt: new Date().toISOString(),
        messageCount: messages.length
      }
      localStorage.setItem(sessionKey, JSON.stringify(sessionData))
    }
  },
  
  setCurrentInput: (input) => set({ currentInput: input }),
  
  setSuggestions: (suggestions) => set({ suggestions }),
  
  clearSuggestions: () => set({ suggestions: null }),
  
  setPrecomputedAnswerId: (id) => set({ precomputedAnswerId: id }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setIsTyping: (typing) => set({ isTyping: typing }),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  reset: () => set({
    messages: [],
    currentInput: '',
    suggestions: null,
    precomputedAnswerId: null,
    isLoading: false,
    isTyping: false
  })
}))

export default useChatStore

