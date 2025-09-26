'use client'

import { useState, useEffect } from 'react'
import WalletConnectButton from '@/components/WalletConnectButton'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import CreatePage from '@/components/CreatePage'
import AIAgentPage from '@/components/AIAgentPage'
import MCPToolsPage from '@/components/MCPToolsPage'
import AddMCPServerPage from '@/components/AddMCPServerPage'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'

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

type Page = 'dashboard' | 'create' | 'ai-agent' | 'mcp-tools' | 'add-mcp-server'

export default function Dashboard() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

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
    setCurrentPage('dashboard')
  }

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId)
    setCurrentPage('dashboard')
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

  // Handle navigation
  const handleCreateClick = () => {
    setCurrentPage('create')
  }

  const handleAIAgentClick = () => {
    setCurrentPage('ai-agent')
  }

  const handleMCPToolsClick = () => {
    setCurrentPage('mcp-tools')
  }

  const handleAddMCPClick = () => {
    setCurrentPage('add-mcp-server')
  }

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard')
  }

  const handleBackToCreate = () => {
    setCurrentPage('create')
  }

  const handleBackToMCPTools = () => {
    setCurrentPage('mcp-tools')
  }

  const handleAskInChat = () => {
    setCurrentPage('dashboard')
  }

  // Render different pages based on current page
  if (currentPage === 'create') {
    return (
      <CreatePage
        onBack={handleBackToDashboard}
        onSelectAIAgent={handleAIAgentClick}
        onSelectMCPTools={handleMCPToolsClick}
      />
    )
  }

  if (currentPage === 'ai-agent') {
    return (
      <AIAgentPage
        onBack={handleBackToCreate}
        onAskInChat={handleAskInChat}
      />
    )
  }

  if (currentPage === 'mcp-tools') {
    return (
      <MCPToolsPage
        onBack={handleBackToCreate}
        onAddMCP={handleAddMCPClick}
      />
    )
  }

  if (currentPage === 'add-mcp-server') {
    return (
      <AddMCPServerPage
        onBack={handleBackToMCPTools}
      />
    )
  }

  // Default dashboard view
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        onNewChat={createNewChat}
        onSelectChat={selectChat}
        chats={chats}
        activeChatId={activeChatId}
        onCreateClick={handleCreateClick}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">
                  {currentChat?.title || '0xAI Chat'}
                </h1>
              </div>
              {currentChat && (
                <Badge variant="secondary" className="text-xs">
                  {currentChat.messages.length} messages
                </Badge>
              )}
            </div>
            <WalletConnectButton />
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 min-h-0">
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

