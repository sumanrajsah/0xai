'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Bot,
  Search,
  Plus,
  MessageSquare,
  Settings,
  Play,
  MoreVertical,
  Star,
  Users,
  Clock,
  Zap,
  Shield,
  Globe,
  Code,
  Brain,
  Sparkles,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  X,
  Tag,
  CheckCircle,
  Upload,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import axios from 'axios'

interface AIAgentsListPageProps {
  onBack: () => void
  onCreateAgent: () => void
  onStartChat: (agent: AIAgent) => void
}

interface AIAgent {
  aid: string
  name: string
  handle: string
  description: string
  avatar?: string
  image?: string
  category: string
  categories?: string[]
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

interface PublishedAgent {
  publish_id: string
  createdAt: string
  updatedAt: string
  agent: {
    aid: string
    name: string
    description: string
    image?: string
    handle: string
    categories: string[]
    tags: string[]
  }
  owner: {
    uid: string
    name?: string
    email?: string
  }
}

const categories = ['All', 'Finance', 'Security', 'Analytics', 'Infrastructure', 'Governance', 'Trading', 'Development']

export default function AIAgentsListPage({ onBack, onCreateAgent, onStartChat }: AIAgentsListPageProps) {
  const { user, isAuthLoading } = useAuth()
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [publishedAgents, setPublishedAgents] = useState<PublishedAgent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<AIAgent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent')
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalAgents, setTotalAgents] = useState(0)

  // My Agents dropdown functionality
  const [showMyAgentsDropdown, setShowMyAgentsDropdown] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [UserAgents, setUserAgents] = useState<any[] | undefined>();

  // Fetch user's agents for publishing
  useEffect(() => {
    async function fetchUserAgents() {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URI}/v1/agent/getAgentByUid/${user?.uid}`,
          { withCredentials: true }
        );
        console.log(res)
        setUserAgents(res.data.agents)
      } catch (err) {
        console.error("Error fetching user agents", err);
      }
    }
    if (user) fetchUserAgents();
  }, [user]);

  // Fetch published agents
  const fetchPublishedAgents = async (page = 1, reset = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URI}/v1/agent/published?${params}`,
        { withCredentials: true }
      );

      const fetchedAgents = res.data.agents || [];

      if (reset || page === 1) {
        setPublishedAgents(fetchedAgents);
        setCurrentPage(1);
      } else {
        setPublishedAgents(prev => [...prev, ...fetchedAgents]);
      }

      setHasMore(fetchedAgents.length === 12); // If we got less than limit, no more pages
      setCurrentPage(page);
      setTotalAgents(res.data.total || fetchedAgents.length);

    } catch (error) {
      console.error('Error fetching published agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and search/filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPublishedAgents(1, true);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchQuery]);

  // Convert published agents to AIAgent format and filter/sort
  useEffect(() => {
    const convertedAgents: AIAgent[] = publishedAgents.map(published => ({
      aid: published.agent.aid,
      name: published.agent.name,
      handle: published.agent.handle,
      description: published.agent.description,
      image: published.agent.image,
      category: published.agent.categories?.[0] || 'General',
      categories: published.agent.categories,
      tags: published.agent.tags || [],
      status: 'active' as const,
      model: 'Claude-4', // Default model
      conversations: Math.floor(Math.random() * 1000), // Mock data
      rating: 4.0 + Math.random(), // Mock data
      createdAt: new Date(published.createdAt),
      lastUsed: new Date(published.updatedAt),
      tools: ['Chat', 'Analysis'], // Mock data
      isPublic: true,
      isVerified: Math.random() > 0.7 // Mock verification status
    }));

    // Sort agents
    const sorted = [...convertedAgents].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastUsed || b.createdAt).getTime() - new Date(a.lastUsed || a.createdAt).getTime()
        case 'popular':
          return b.conversations - a.conversations
        case 'rating':
          return b.rating - a.rating
        default:
          return 0
      }
    });

    setFilteredAgents(sorted);
  }, [publishedAgents, sortBy]);

  // Load more agents
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPublishedAgents(currentPage + 1, false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-my-agents-dropdown]')) {
        setShowMyAgentsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAgentClick = (agent: AIAgent) => {
    // Navigate to agent details or start conversation
    console.log('Selected agent:', agent)
  }

  const handleStartChat = (agent: AIAgent, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click event
    onStartChat(agent)
  }

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

  // My Agents dropdown helper functions
  const handleAddTag = () => {
    if (tagInput.trim() && selectedTags.length < 3 && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const handlePublish = async () => {
    if (!selectedAgent || selectedTags.length === 0 || selectedCategories.length === 0) {
      return
    }

    setIsPublishing(true)
    try {
      const payload = {
        aid: selectedAgent.aid,
        uid: user?.uid,
        tags: selectedTags,
        categories: selectedCategories,
      }

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URI}/v1/agent/publish`,
        payload,
        { withCredentials: true }
      )

      if (res.status === 200) {
        // Reset form
        setSelectedAgent(null)
        setSelectedTags([])
        setSelectedCategories([])
        setShowMyAgentsDropdown(false)

        // Refresh the published agents list
        fetchPublishedAgents(1, true);

        console.log('Agent published successfully:', res.data)
      }
    } catch (error) {
      console.error('Failed to publish agent:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>Loading AI Agents...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">AI Agents</h1>
              <Badge variant="secondary" className="ml-2">
                {totalAgents.toLocaleString()} published
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* My Agents Dropdown */}
            <div className="relative" data-my-agents-dropdown>
              <Button
                variant="outline"
                onClick={() => setShowMyAgentsDropdown(!showMyAgentsDropdown)}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                My Agents
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showMyAgentsDropdown ? 'rotate-180' : ''}`} />
              </Button>

              {showMyAgentsDropdown && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 flex items-center justify-center">
                        <Users className="h-3 w-3 text-white" />
                      </div>
                      <div className="text-sm font-bold text-foreground">Publish Your Agent</div>
                    </div>

                    {/* Agent Selection */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Select Agent</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {Array.isArray(UserAgents) && UserAgents.map((agent) => (
                          <div
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent)}
                            className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedAgent?.aid === agent.aid
                              ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
                              : 'hover:bg-muted/80'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                                <Bot className="h-3 w-3 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm">{agent.name}</div>
                                <div className="text-xs opacity-80">{agent.handle}</div>
                              </div>
                              {selectedAgent?.aid === agent.id && (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags Input */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Tags (Max 3)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a tag..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          className="flex-1 h-8 text-sm"
                          disabled={selectedTags.length >= 3}
                        />
                        <Button
                          size="sm"
                          onClick={handleAddTag}
                          disabled={!tagInput.trim() || selectedTags.length >= 3}
                          className="h-8 px-3"
                        >
                          <Tag className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs gap-1">
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => handleRemoveTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        AI Model Categories
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.filter(cat => cat !== 'All').map((category) => (
                          <Button
                            key={category}
                            variant={selectedCategories.includes(category) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCategoryToggle(category)}
                            className="h-8 text-xs justify-start"
                          >
                            {selectedCategories.includes(category) && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Publish Button */}
                    <Button
                      onClick={handlePublish}
                      disabled={!selectedAgent || selectedTags.length === 0 || selectedCategories.length === 0 || isPublishing}
                      className="w-full gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isPublishing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Publish Agent
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={onCreateAgent} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4" />
              Create Agent
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'rating')}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="h-8"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Agents Grid/List */}
          {filteredAgents.length === 0 && !loading ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Be the first to publish an AI agent'
                }
              </p>
              <Button onClick={onCreateAgent} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Agent
              </Button>
            </Card>
          ) : (
            <>
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {filteredAgents.map((agent) => (
                  <Card
                    key={agent.aid}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${viewMode === 'list' ? 'flex' : ''
                      }`}
                    onClick={() => handleAgentClick(agent)}
                  >
                    <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            {agent.image ? (
                              <img src={agent.image} alt={agent.name} className="w-12 h-12 rounded-xl object-cover" />
                            ) : (
                              <Bot className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{agent.name}</CardTitle>
                              {agent.isVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{agent.handle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                          <span className="text-xs text-muted-foreground">{getStatusText(agent.status)}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className={viewMode === 'list' ? 'flex-1' : ''}>
                      <CardDescription className="mb-4 line-clamp-2">
                        {agent.description}
                      </CardDescription>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {agent.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {agent.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>{agent.conversations.toLocaleString()} chats</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-4 w-4" />
                          <span>{agent.rating.toFixed(1)}/5.0</span>
                        </div>
                      </div>

                      {/* Tools */}
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">Tools:</p>
                        <div className="flex flex-wrap gap-1">
                          {agent.tools.slice(0, 2).map((tool) => (
                            <Badge key={tool} variant="secondary" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                          {agent.tools.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{agent.tools.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={(e) => handleStartChat(agent, e)}
                        >
                          <Play className="h-4 w-4" />
                          Start Chat
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Load More Agents
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}