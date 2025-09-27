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
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [selectedMCP, setSelectedMCP] = useState('none')

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
        <header className="bg-gradient-to-r from-card to-card/95 backdrop-blur-sm border-b px-6 py-5 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {currentChat?.title || '0xAI Chat'}
                  </h1>
                  {currentChat && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {currentChat.messages.length} messages
                      </Badge>
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WalletConnectButton />
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 min-h-0">
          <ChatArea
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            selectedModel={selectedModel}
            selectedMCP={selectedMCP}
            onModelChange={setSelectedModel}
            onMCPChange={setSelectedMCP}
          />
        </div>
      </div>
    </div>
  )
}

