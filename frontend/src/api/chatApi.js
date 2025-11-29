import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const chatApi = {
  sendMessage: async (sessionId, message, usePrecomputed = true) => {
    const response = await api.post('/chat', {
      session_id: sessionId,
      message,
      use_precomputed: usePrecomputed,
    })
    return response.data
  },
  
  getSession: async (sessionId) => {
    const response = await api.get(`/chat/session/${sessionId}`)
    return response.data
  },
  
  listSessions: async () => {
    const response = await api.get('/chat/sessions')
    return response.data
  },
  
  getUserContext: async () => {
    const response = await api.get('/chat/user-context')
    return response.data
  },
  
  predictIntent: async (sessionId, messages) => {
    const response = await api.post('/predict-intent', {
      session_id: sessionId,
      messages,
    })
    return response.data
  },
  
  getPrecomputedAnswer: async (answerId) => {
    const response = await api.get(`/precomputed-answer/${answerId}`)
    return response.data
  },
}

export default chatApi

