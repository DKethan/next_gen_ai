import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const predictionApi = {
  predictIntent: async (sessionId, messages) => {
    try {
      const response = await api.post('/predict-intent', {
        session_id: sessionId,
        messages,
      })
      return response.data
    } catch (error) {
      console.error('Prediction error:', error)
      throw error
    }
  },
  
  getPrecomputedAnswer: async (answerId) => {
    try {
      const response = await api.get(`/precomputed-answer/${answerId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching precomputed answer:', error)
      throw error
    }
  },
}

export default predictionApi



