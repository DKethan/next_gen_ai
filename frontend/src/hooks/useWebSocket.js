import { useState, useEffect, useRef } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1'

export function useWebSocket(sessionId) {
  const [lastMessage, setLastMessage] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  
  useEffect(() => {
    if (!sessionId) return
    
    const connect = () => {
      try {
        const wsUrl = `${WS_URL}/suggestions/live/${sessionId}`
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
        }
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            setLastMessage(data)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
        
        ws.onclose = () => {
          console.log('WebSocket disconnected')
          setIsConnected(false)
          
          // Attempt to reconnect after 3 seconds
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null
              connect()
            }, 3000)
          }
        }
        
        wsRef.current = ws
      } catch (error) {
        console.error('Error connecting WebSocket:', error)
        setIsConnected(false)
      }
    }
    
    connect()
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [sessionId])
  
  const sendMessage = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }
  
  return {
    lastMessage,
    isConnected,
    sendMessage,
  }
}


