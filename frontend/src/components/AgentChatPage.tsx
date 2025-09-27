'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import WalletConnectButton from '@/components/WalletConnectButton'
import AgentChatArea from '@/components/AgentChatArea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, Bot, Settings, Star, Users, Clock, Zap } from 'lucide-react'

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

interface AgentChatPageProps {
  agent: AIAgent
  onBack: () => void
}

export default function AgentChatPage({ agent, onBack }: AgentChatPageProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(agent.model || 'gpt-4o-mini')
  const [selectedMCP, setSelectedMCP] = useState('none')

  const currentChat = chats.find(chat => chat.id === activeChatId)
  const messages = currentChat?.messages || []

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Chat with ${agent.name}`,
      messages: [],
      timestamp: new Date()
    }
    setChats(prev => [newChat, ...prev])
    setActiveChatId(newChat.id)
  }

  const sendMessage = async (chatRequest: ChatRequest) => {
    if (!activeChatId) {
      createNewChat()
      return
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
      chat.id === activeChatId
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
        }
      )

      // Handle the API response
      if (response.data && response.data.success) {
        let aiResponseContent = ''

        if (response.data.needsToolExecution && response.data.toolCalls) {
          // Handle tool execution response
          const toolCalls = response.data.toolCalls
          aiResponseContent = `I need to execute some tools to help you:\n\n`

          toolCalls.forEach((toolCall: any, index: number) => {
            aiResponseContent += `${index + 1}. **${toolCall.function.name}**\n`
            aiResponseContent += `   Arguments: ${toolCall.function.arguments}\n\n`
          })

          aiResponseContent += 'Let me execute these tools and get back to you with the results.'
        } else if (response.data.response) {
          // Handle regular text response
          aiResponseContent = response.data.response
        } else {
          aiResponseContent = 'I received your message but no response content was provided.'
        }

        const aiMessage: Message = {
          id: response.data.msg_id || (Date.now() + 1).toString(),
          content: aiResponseContent,
          isUser: false,
          timestamp: new Date(response.data.created || Date.now())
        }

        setChats(prev => prev.map(chat =>
          chat.id === activeChatId
            ? {
              ...chat,
              messages: [...chat.messages, aiMessage],
              title: chat.title === `Chat with ${agent.name}` ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : chat.title
            }
            : chat
        ))
      } else {
        // Handle unexpected response format
        throw new Error('API returned an unsuccessful response')
      }

    } catch (error) {
      console.error('Error sending message to API:', error)

      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error while processing your request. ${axios.isAxiosError(error)
          ? error.response?.data?.error || error.message
          : 'Please try again later.'
          }`,
        isUser: false,
        timestamp: new Date()
      }

      setChats(prev => prev.map(chat =>
        chat.id === activeChatId
          ? {
            ...chat,
            messages: [...chat.messages, errorMessage],
            title: chat.title === `Chat with ${agent.name}` ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : chat.title
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
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-gray-500'
      case 'training':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'training':
        return 'Training'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-card to-card/95 backdrop-blur-sm border-b px-6 py-5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {agent.handle}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                  <span className="text-xs text-muted-foreground">{getStatusText(agent.status)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">

            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Agent Info Card */}

      {/* Chat Area */}
      <div className="flex-1 min-h-0">
        <AgentChatArea
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          selectedModel={selectedModel}
          selectedMCP={selectedMCP}
          onModelChange={setSelectedModel}
          onMCPChange={setSelectedMCP}
          agent={agent}
        />
      </div>
    </div>
  )
}