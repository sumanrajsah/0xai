'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  History, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Bot,
  Clock,
  PlusCircle,
  BotIcon
} from 'lucide-react'

interface SidebarProps {
  onNewChat: () => void
  onSelectChat: (id: string) => void
  chats: Array<{ id: string; title: string; timestamp: Date }>
  activeChatId: string | null
  onCreateClick?: () => void
}

export default function Sidebar({ onNewChat, onSelectChat, chats, activeChatId, onCreateClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const sidebarItems = [
    { icon: MessageSquare, label: 'New Chat', action: onNewChat },
    { icon: BotIcon, label: 'AI Agent', action: () => {} },
    { icon: PlusCircle, label: 'Create', action: onCreateClick || (() => {}) },

    { icon: History, label: 'History', action: () => {} },
    { icon: Settings, label: 'Settings', action: () => {} },
    { icon: HelpCircle, label: 'Help', action: () => {} },
  ]

  return (
    <div className={`bg-card border-r transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">0xAI</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={item.action}
              className="w-full justify-start gap-3 h-10"
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Chat History */}
        {!isCollapsed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Recent Chats</h3>
              <Badge variant="secondary" className="text-xs">
                {chats.length}
              </Badge>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {chats.map((chat) => (
                <Card
                  key={chat.id}
                  className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    activeChatId === chat.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{chat.title}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {chat.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground text-center">
            Powered by 0xAI
          </div>
        )}
      </div>
    </div>
  )
}

