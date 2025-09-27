'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import WalletConnectButton from '@/components/WalletConnectButton'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import CreatePage from '@/components/CreatePage'
import AIAgentPage from '@/components/AIAgentPage'
import AIAgentsListPage from '@/components/AIAgentsListPage'
import MyAgentsPage from '@/components/MyAgentsPage'
import MCPToolsPage from '@/components/MCPToolsPage'
import AddMCPServerPage from '@/components/AddMCPServerPage'
import AgentChatPage from '@/components/AgentChatPage'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Bot, Plus } from 'lucide-react'

interface OpenAIMessage {
  role: "system" | "user" | "assistant"
  content: string | Array<{
    type: "text" | "image_url"
    text?: string
    image_url?: {
      url: string
    }
  }>
}

interface ChatRequest {
  chat_id: string
  messageData: {
    content: Array<{
      type: "text" | "image_url"
      text?: string
      image_url?: {
        url: string
      }
    }>
  }
  config: {
    model: string
    temperature?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    supportsMedia?: boolean
    tools?: Array<string>
    mcp_server?: Array<{
      sid: string
    }>
    mcp_tools?: Array<any>
  }
}

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

interface AIAgent {
  id: string
  name: string
  handle: string
  description: string
  avatar?: string
  category: string
  tags: string[]
  status: 'active' | 'inactive' | 'training'
  model: string
  conversations: number
  rating: number
  createdAt: Date
  lastUsed?: Date
  tools: string[]
  isPublic: boolean
  isVerified: boolean
}

type Page = 'dashboard' | 'create' | 'ai-agent' | 'ai-agents-list' | 'my-agents' | 'mcp-tools' | 'add-mcp-server' | 'agent-chat'

export default function Dashboard() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [selectedMCP, setSelectedMCP] = useState('none')
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)

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

  const sendMessage = async (chatRequest: ChatRequest) => {
    // Ensure we have an active chat or create one
    let chatId = activeChatId
    if (!chatId) {
      createNewChat()
      // Wait for the new chat to be created and set as active
      chatId = Date.now().toString()
    }

    // Extract the latest user message from the new chat request format
    const content = chatRequest.messageData.content.find(c => c.type === 'text')?.text || 'Message with attachments'

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    }

    // Add user message to UI immediately
    setChats(prev => prev.map(chat =>
      chat.id === (activeChatId || chatId)
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    ))

    setIsLoading(true)

    try {
      // Send the chat request to your backend API
      console.log('Sending ChatRequest to backend:', chatRequest)

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URI}/v1/chat/completion`,
        chatRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true, // Include cookies if needed for authentication
          timeout: 30000, // 30 second timeout
        }
      )

      console.log('Response from backend:', response.data)

      // Handle the API response
      if (response.data && response.data.success) {
        let aiResponseContent = ''

        // Check if we have a proper message structure
        if (response.data.message && response.data.message.content) {
          aiResponseContent = response.data.message.content
        } else if (response.data.response) {
          // Handle legacy response format
          aiResponseContent = response.data.response
        } else if (response.data.needsToolExecution && response.data.toolCalls) {
          // Handle tool execution response
          const toolCalls = response.data.toolCalls
          aiResponseContent = `I need to execute some tools to help you:\n\n`

          toolCalls.forEach((toolCall: any, index: number) => {
            aiResponseContent += `${index + 1}. **${toolCall.function.name}**\n`
            aiResponseContent += `   Arguments: ${toolCall.function.arguments}\n\n`
          })

          aiResponseContent += 'Let me execute these tools and get back to you with the results.'
        } else {
          aiResponseContent = 'I received your message but encountered an issue processing the response.'
        }

        const aiMessage: Message = {
          id: response.data.message?.msg_id || (Date.now() + 1).toString(),
          content: aiResponseContent,
          isUser: false,
          timestamp: new Date(response.data.message?.created || Date.now())
        }

        setChats(prev => prev.map(chat =>
          chat.id === (activeChatId || chatId)
            ? {
              ...chat,
              messages: [...chat.messages, aiMessage],
              title: chat.title === 'New Chat' ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : chat.title
            }
            : chat
        ))
      } else {
        // Handle unsuccessful API response
        throw new Error(response.data?.error || 'API returned an unsuccessful response')
      }

    } catch (error) {
      console.error('Error sending message to API:', error)

      let errorMessage = 'Sorry, I encountered an error while processing your request. Please try again later.'

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try again with a shorter message or check your connection.'
        } else if (error.response?.status === 400) {
          errorMessage = `Request error: ${error.response.data?.error || 'Bad request'}`
        } else if (error.response?.status === 500) {
          errorMessage = `Server error: ${error.response.data?.error || 'Internal server error'}`
        } else if (error.response?.data?.error) {
          errorMessage = `Error: ${error.response.data.error}`
        } else if (error.message) {
          errorMessage = `Network error: ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`
      }

      // Show error message to user
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        isUser: false,
        timestamp: new Date()
      }

      setChats(prev => prev.map(chat =>
        chat.id === (activeChatId || chatId)
          ? {
            ...chat,
            messages: [...chat.messages, errorMsg],
            title: chat.title === 'New Chat' ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : chat.title
          }
          : chat
      ))
    } finally {
      setIsLoading(false)
    }
  }

  // Create initial chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat()
    }
  }, [chats.length])

  // Handle navigation
  const handleCreateClick = () => {
    setCurrentPage('create')
  }

  const handleAIAgentClick = () => {
    setCurrentPage('ai-agent')
  }

  const handleAIAgentsListClick = () => {
    setCurrentPage('ai-agents-list')
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

  const handleCreateAgent = () => {
    setCurrentPage('ai-agent')
  }

  const handleMyAgents = () => {
    setCurrentPage('my-agents')
  }

  const handleStartAgentChat = (agent: AIAgent) => {
    setSelectedAgent(agent)
    setCurrentPage('agent-chat')
  }

  const handleBackFromAgentChat = () => {
    setSelectedAgent(null)
    setCurrentPage('ai-agents-list')
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

  if (currentPage === 'ai-agents-list') {
    return (
      <AIAgentsListPage
        onBack={handleBackToDashboard}
        onCreateAgent={handleCreateAgent}
        onStartChat={handleStartAgentChat}
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

  if (currentPage === 'my-agents') {
    return (
      <MyAgentsPage
        onBack={handleBackToDashboard}
      />
    )
  }

  if (currentPage === 'agent-chat' && selectedAgent) {
    return (
      <AgentChatPage
        agent={selectedAgent}
        onBack={handleBackFromAgentChat}
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
        onAIAgentsClick={handleAIAgentsListClick}
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
              <Button
                variant="outline"
                onClick={handleAIAgentsListClick}
                className="gap-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
              >
                <Bot className="h-4 w-4" />
                My Agents
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateAgent}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Agent
              </Button>
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