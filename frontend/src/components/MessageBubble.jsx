import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import clsx from 'clsx'

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  return (
    <div className={clsx(
      'flex mb-6 group',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={clsx(
        'flex items-start space-x-3 max-w-[85%]',
        isUser && 'flex-row-reverse space-x-reverse'
      )}>
        {/* Avatar */}
        <div className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        )}>
          {isUser ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          )}
        </div>
        
        {/* Message Content */}
        <div className="flex-1">
          <div className={clsx(
            isUser
              ? 'rounded-2xl px-4 py-3 bg-blue-600 text-white'
              : 'px-4 py-3 text-gray-900 dark:text-gray-100'
          )}>
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed m-0">
                {message.content}
              </p>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({node, ...props}) => <p className="mb-4 last:mb-0 text-[15px] leading-7 text-gray-800 dark:text-gray-200" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-3 mt-6 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-gray-100" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-[15px] leading-7" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-[15px] leading-7" {...props} />,
                    li: ({node, ...props}) => <li className="text-gray-800 dark:text-gray-200 pl-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-300" {...props} />,
                    code: ({node, inline, ...props}) => 
                      inline ? (
                        <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded text-[13px] font-mono border border-gray-200 dark:border-gray-700" {...props} />
                      ) : (
                        <code className="block bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded-lg text-[13px] font-mono overflow-x-auto my-4 border border-gray-200 dark:border-gray-700" {...props} />
                      ),
                    pre: ({node, ...props}) => <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-[13px] font-mono overflow-x-auto my-4 border border-gray-200 dark:border-gray-700" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-6 border-gray-200 dark:border-gray-700" {...props} />,
                    a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
                    tbody: ({node, ...props}) => <tbody {...props} />,
                    tr: ({node, ...props}) => <tr className="border-b border-gray-200 dark:border-gray-700" {...props} />,
                    th: ({node, ...props}) => <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                    td: ({node, ...props}) => <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Copy Button - appears on hover */}
          {!isUser && (
            <div className="mt-1 flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded flex items-center space-x-1"
                title="Copy message"
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
