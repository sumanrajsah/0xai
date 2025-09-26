'use client'

import { useState, useEffect } from 'react'
import WalletConnectButton from '@/components/WalletConnectButton'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  timestamp: Date
}

export default function Dashboard() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const currentChat = chats.find(chat => chat.id === activeChatId)
  const messages = currentChat?.messages || []

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date()
    }
    setChats(prev => [newChat, ...prev])
    setActiveChatId(newChat.id)
  }

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId)
  }

  const sendMessage = async (content: string) => {
    if (!activeChatId) {
      createNewChat()
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    }

    // Add user message
    setChats(prev => prev.map(chat => 
      chat.id === activeChatId 
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    ))

    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about "${content}". This is a simulated AI response. In a real implementation, this would connect to your AI service to provide intelligent responses about blockchain, DeFi, and Web3 topics.`,
        isUser: false,
        timestamp: new Date()
      }

      setChats(prev => prev.map(chat => 
        chat.id === activeChatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, aiMessage],
              title: chat.title === 'New Chat' ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : chat.title
            }
          : chat
      ))

      setIsLoading(false)
    }, 1500)
  }

  // Create initial chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat()
    }
  }, [])

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        onNewChat={createNewChat}
        onSelectChat={selectChat}
        chats={chats}
        activeChatId={activeChatId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                {currentChat?.title || '0xAI Chat'}
              </h1>
              {currentChat && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentChat.messages.length} messages
                </span>
              )}
            </div>
            <WalletConnectButton />
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1">
          <ChatArea
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}

