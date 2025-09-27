'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Loader2, ChevronDown, Settings, Plus, Image, FileText, X, Wrench, Globe, Star, Zap } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@/hooks/useAuth'

interface OpenAIMessage {
  role: "system" | "user" | "assistant"
  content: string | Array<{
    type: "text" | "image_url"
    text?: string
    image_url?: {
      url: string
      detail?: "low" | "high" | "auto"
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
  attachments?: File[]
}

interface Attachment {
  id: string
  file: File
  type: 'image' | 'pdf'
  preview?: string
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

interface AgentChatAreaProps {
  messages: Message[]
  onSendMessage: (chatRequest: ChatRequest) => void
  isLoading: boolean
  selectedModel?: string
  selectedMCP?: string
  selectedAITool?: string
  selectedLanguage?: string
  chatId?: string
  onModelChange?: (model: string) => void
  onMCPChange?: (mcp: string) => void
  onAIToolChange?: (tool: string) => void
  onLanguageChange?: (language: string) => void
  agent: AIAgent
}

export default function AgentChatArea({
  messages,
  onSendMessage,
  isLoading,
  selectedModel = 'gpt-4o-mini',
  selectedMCP = 'none',
  selectedAITool = 'none',
  selectedLanguage = 'english',
  chatId = 'unique-chat-identifier',
  onModelChange,
  onMCPChange,
  onAIToolChange,
  onLanguageChange,
  agent
}: AgentChatAreaProps) {
  const { user, status } = useAuth();
  const [inputValue, setInputValue] = useState('')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mcpServers, setMcpServers] = useState<any[]>([])

  useEffect(() => {
    async function getData() {
      if (status === 'unauthenticated') {
        console.error("User unauthenticated");
        return;
      }
      if (!user?.uid) {
        console.error("User UID is missing");
        return;
      }

      try {
        const serverResult = await axios.get(`${process.env.NEXT_PUBLIC_API_URI}/v1/mcp?uid=${user.uid}`, { withCredentials: true });

        const serverResponse = serverResult;
        if (serverResponse.status === 200) {
          if (mcpServers.length !== serverResponse.data.data)
            setMcpServers(serverResponse.data.data);
        } else {
          setMcpServers([]);
        }
      } catch (err) {
        // console.error("Unexpected error occurred:", err);
      }
    }

    if (user) getData();
  }, [user, status])

  const languages = [
    { value: 'english', label: 'English', description: 'Default language' },
    { value: 'spanish', label: 'Spanish', description: 'Español' },
    { value: 'french', label: 'French', description: 'Français' },
    { value: 'german', label: 'German', description: 'Deutsch' },
    { value: 'chinese', label: 'Chinese', description: '中文' },
    { value: 'japanese', label: 'Japanese', description: '日本語' },
    { value: 'korean', label: 'Korean', description: '한국어' },
    { value: 'arabic', label: 'Arabic', description: 'العربية' },
    { value: 'hindi', label: 'Hindi', description: 'हिन्दी' },
    { value: 'portuguese', label: 'Portuguese', description: 'Português' }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((inputValue.trim() || attachments.length > 0) && !isLoading) {
      // Convert current chat messages to OpenAI format
      const openAIMessages: OpenAIMessage[] = messages.map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content
      }))

      // Build current message content for the new format
      let messageContent: Array<{ type: "text" | "image_url", text?: string, image_url?: { url: string } }> = []

      if (attachments.length > 0) {
        // Multi-modal message with text and images
        // Add text content if present
        if (inputValue.trim()) {
          messageContent.push({
            type: "text",
            text: inputValue.trim()
          })
        }

        // Add image attachments
        attachments.forEach(attachment => {
          if (attachment.type === 'image' && attachment.preview) {
            messageContent.push({
              type: "image_url",
              image_url: {
                url: attachment.preview,
              }
            })
          }
        })
      } else {
        // Text-only message
        messageContent.push({
          type: "text",
          text: inputValue.trim()
        })
      }

      // Prepare tools array - include agent's tools
      const tools = selectedAITool !== 'none' ? [selectedAITool, ...agent.tools] : agent.tools

      const chatRequest: ChatRequest = {
        chat_id: chatId,
        messageData: {
          content: messageContent
        },
        config: {
          model: selectedModel,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
          supportsMedia: true,
          ...(tools.length > 0 && { tools }),
          mcp_server: selectedMCP !== 'none' ? [{ sid: "mcp_01998a6d-abec-7298-9158-7c7a5dba2db6" }] : [],
          mcp_tools: tools
        }
      }

      onSendMessage(chatRequest)
      setInputValue('')
      setAttachments([])
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments: Attachment[] = files.map(file => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const type = file.type.startsWith('image/') ? 'image' : 'pdf'
      const attachment: Attachment = { id, file, type }

      if (type === 'image') {
        const reader = new FileReader()
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string
        }
        reader.readAsDataURL(file)
      }

      return attachment
    })

    setAttachments(prev => [...prev, ...newAttachments])
    setShowUploadMenu(false)
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-dropdown]') && !target.closest('[data-upload-menu]')) {
        setShowLanguageDropdown(false)
        setShowUploadMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col h-full bg-background">

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="p-8 max-w-md">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Chat with {agent.name}
              </h2>
              <p className="text-muted-foreground mb-4">
                {agent.description}
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {agent.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>{agent.rating}/5.0</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>{agent.tools.length} tools</span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} gap-3`}
            >
              {!message.isUser && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <Card
                className={`max-w-3xl px-4 py-3 ${message.isUser
                  ? 'bg-primary text-primary-foreground ml-12'
                  : 'bg-muted mr-12'
                  }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-2 ${message.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </Card>
              {message.isUser && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="px-4 py-3 bg-muted mr-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">{agent.name} is thinking...</span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-gradient-to-r from-card to-card/95 backdrop-blur-sm p-4 flex-shrink-0">
        {/* Input Container with Integrated Dropdowns */}
        <div className="relative bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm border-2 border-border/50 hover:border-primary/30 focus-within:border-primary/50 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl">
          {/* Dropdown Controls - Integrated */}
          <div className="p-3 pb-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {/* AI Model Dropdown */}


              {/* Languages Dropdown */}
              <div className="relative" data-dropdown>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowLanguageDropdown(!showLanguageDropdown)
                    setShowUploadMenu(false)
                  }}
                  className="gap-1.5 w-full justify-between h-8 bg-muted/30 hover:bg-muted/50 border border-border/30 hover:border-primary/40 transition-all duration-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
                    <span className="truncate font-medium">
                      {languages.find(l => l.value === selectedLanguage)?.label || 'Language'}
                    </span>
                  </div>
                  <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                </Button>
                {showLanguageDropdown && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 w-full bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                          <Globe className="h-3 w-3 text-white" />
                        </div>
                        <div className="text-xs font-bold text-foreground">Languages</div>
                      </div>
                      <div className="space-y-1">
                        {languages.map((language) => (
                          <div
                            key={language.value}
                            onClick={() => {
                              onLanguageChange?.(language.value)
                              setShowLanguageDropdown(false)
                            }}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group ${selectedLanguage === language.value
                              ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg scale-[1.02]'
                              : 'hover:bg-muted/80 hover:shadow-md hover:scale-[1.01]'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-sm">{language.label}</div>
                                <div className={`text-xs mt-1 ${selectedLanguage === language.value ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                  {language.description}
                                </div>
                              </div>
                              {selectedLanguage === language.value && (
                                <div className="w-4 h-4 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 border"
                >
                  {attachment.type === 'image' && attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt="Preview"
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {attachment.file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment.id)}
                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-3 p-3 pt-0">
            {/* Upload Button - Left Side */}
            <div className="relative" data-upload-menu>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowUploadMenu(!showUploadMenu)
                  setShowLanguageDropdown(false)
                }}
                className="h-12 w-12 p-0 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 rounded-xl border-2 bg-background/50 backdrop-blur-sm"
              >
                <Plus className="h-5 w-5" />
              </Button>

              {showUploadMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        fileInputRef.current?.click()
                        setShowUploadMenu(false)
                      }}
                      className="w-full justify-start gap-2 hover:bg-primary/10"
                    >
                      <Image className="h-4 w-4" />
                      Upload Images
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        fileInputRef.current?.click()
                        setShowUploadMenu(false)
                      }}
                      className="w-full justify-start gap-2 hover:bg-primary/10"
                    >
                      <FileText className="h-4 w-4" />
                      Upload PDFs
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${agent.name} anything...`}
                className="min-h-[60px] max-h-[120px] resize-none pr-14 pl-4 py-4 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-muted-foreground/70 text-foreground"
                disabled={isLoading}
              />

              {/* Send Button */}
              <Button
                type="submit"
                size="sm"
                disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
                className="absolute right-2 top-2 h-8 w-8 p-0 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}
