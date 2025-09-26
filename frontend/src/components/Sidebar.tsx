'use client'

import { useState } from 'react'

interface SidebarProps {
  onNewChat: () => void
  onSelectChat: (id: string) => void
  chats: Array<{ id: string; title: string; timestamp: Date }>
  activeChatId: string | null
}

export default function Sidebar({ onNewChat, onSelectChat, chats, activeChatId }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const sidebarItems = [
    { icon: '💬', label: 'New Chat', action: onNewChat },
    { icon: '📝', label: 'History', action: () => {} },
    { icon: '⚙️', label: 'Settings', action: () => {} },
    { icon: '❓', label: 'Help', action: () => {} },
  ]

  return (
    <div className={`bg-gray-900 dark:bg-gray-800 border-r border-gray-700 dark:border-gray-600 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 dark:border-gray-600">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white">0xAI</h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-3 p-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 group"
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </div>

        {/* Chat History */}
        {!isCollapsed && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Chats</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${
                    activeChatId === chat.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium truncate">{chat.title}</div>
                  <div className="text-xs text-gray-400">
                    {chat.timestamp.toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 dark:border-gray-600">
        {!isCollapsed && (
          <div className="text-xs text-gray-400 text-center">
            Powered by 0xAI
          </div>
        )}
      </div>
    </div>
  )
}

