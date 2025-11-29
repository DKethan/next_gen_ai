import { useState } from 'react'

function TypingSuggestions({ suggestions, onSuggestionClick }) {
  if (!suggestions || !suggestions.predictions || suggestions.predictions.length === 0) return null
  
  // Get top 4 suggestions
  const topSuggestions = suggestions.predictions.slice(0, 4)
  
  return (
    <div className="bg-transparent px-2 py-2">
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-2">
          {topSuggestions.map((prediction, index) => (
            <SuggestionBubble
              key={index}
              suggestion={prediction.question}
              confidence={prediction.confidence}
              onSuggestionClick={onSuggestionClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SuggestionBubble({ suggestion, confidence, onSuggestionClick }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onSuggestionClick(suggestion)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-md transition-all text-left group min-h-[80px] w-full"
    >
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2 break-words">
        {suggestion}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isHovered ? 'translate-x-1' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

export default TypingSuggestions
