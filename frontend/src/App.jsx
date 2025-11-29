import { useState } from 'react'
import ChatWindow from './components/ChatWindow'
import './App.css'

function App() {
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID
    const stored = localStorage.getItem('mindnext_session_id')
    if (stored) return stored
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('mindnext_session_id', newId)
    return newId
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#171717]">
      <ChatWindow sessionId={sessionId} />
    </div>
  )
}

export default App
