'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Server,
  CheckCircle,
  AlertCircle,
  Save,
  TestTube,
  Plus,
  X
} from 'lucide-react'
import { MCP } from '@/lib/mcp'

interface AddMCPServerPageProps {
  onBack: () => void
}

interface McpServer {
  label: string;
  description: string;
  uri: string;
  type: string;
  auth: boolean;
  header?: {
    key: string;
    value: string;
  },
  tools: string[];
}


export default function AddMCPServerPage({ onBack }: AddMCPServerPageProps) {
  const [formData, setFormData] = useState<McpServer>({
    label: '',
    description: '',
    uri: '',
    type: 'http',
    auth: false,
    header: {
      key: '',
      value: ''
    },
    tools: []
  })
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [newTool, setNewTool] = useState('')

  const handleInputChange = (field: keyof McpServer, value: string | boolean | { key: string; value: string } | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateServer = (field: keyof McpServer | "header.key" | "header.value", value: any) => {
    if (field === "header.key") {
      setFormData(prev => ({
        ...prev,
        header: {
          key: value,
          value: prev.header?.value ?? ''
        }
      }));
    } else if (field === "header.value") {
      setFormData(prev => ({
        ...prev,
        header: {
          key: prev.header?.key ?? '',
          value: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };
  const CheckConnection = async (serverInfo: McpServer) => {
    if (!serverInfo.uri || !serverInfo.label) {

      return;
    }

    setIsVerifying(true);
    try {
      const server =
      {
        uri: serverInfo.uri,
        header: {
          key: serverInfo.header?.key ?? '',
          value: serverInfo.header?.value ?? ''
        },
        type: serverInfo.type
      }
      const response = await MCP(server);
      if (response.mcpClient !== null) {
        console.log(response.tools)
        updateServer('tools', response.tools.map(item => item.function.name))
      } else {

      }
    } catch (e) {

      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };


  const handleSave = () => {
    // Handle save logic
    console.log('Saving MCP Server:', formData)
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
              <Server className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Add MCP Server</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => CheckConnection(formData)} disabled={isVerifying} className="gap-2">
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  Verify
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={formData.tools.length === 0} className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Server Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Server Configuration</CardTitle>
              <CardDescription>Configure your MCP server connection details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Server Label *</label>
                <Input
                  value={formData.label}
                  onChange={(e) => handleInputChange('label', e.target.value)}
                  placeholder="Enter server label"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Server Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter server description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Connection Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="http">HTTP</option>
                  <option value="sse">SSE</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URI *</label>
                <Input
                  value={formData.uri}
                  onChange={(e) => handleInputChange('uri', e.target.value)}
                  placeholder="https://mcp.example.com/mcp"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Authentication</label>
                <select
                  value={formData.auth.toString()}
                  onChange={(e) => handleInputChange('auth', e.target.value === 'true')}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {formData.auth && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Header Name *</label>
                    <Input
                      value={formData.header?.key || ''}
                      onChange={(e) => handleInputChange('header', {
                        key: e.target.value,
                        value: formData.header?.value || ''
                      })}
                      placeholder="Authorization"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bearer Token *</label>
                    <Input
                      value={formData.header?.value || ''}
                      onChange={(e) => handleInputChange('header', {
                        key: formData.header?.key || '',
                        value: e.target.value
                      })}
                      placeholder="Bearer token value"
                      type="password"
                    />
                  </div>
                </>
              )}

            </CardContent>
          </Card>


          {/* Verification Status */}
          {verificationStatus !== 'idle' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  {verificationStatus === 'success' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div>
                    <h4 className="font-medium">
                      {verificationStatus === 'success' ? 'Connection Successful' : 'Connection Failed'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {verificationStatus === 'success'
                        ? 'Your MCP server is ready to use'
                        : 'Please check your configuration and try again'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
