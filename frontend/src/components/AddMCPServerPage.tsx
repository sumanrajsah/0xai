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
  TestTube
} from 'lucide-react'

interface AddMCPServerPageProps {
  onBack: () => void
}

export default function AddMCPServerPage({ onBack }: AddMCPServerPageProps) {
  const [formData, setFormData] = useState({
    serverLabel: 'SitrAi',
    serverDescription: 'Short description',
    connectionType: 'Streamable HTTP',
    uri: 'https://mcp.sitrai.com/mcp',
    authentication: 'No'
  })
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false)
      setVerificationStatus('success')
    }, 2000)
  }

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
            <Button variant="outline" onClick={handleVerify} disabled={isVerifying} className="gap-2">
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
            <Button onClick={handleSave} className="gap-2">
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
                  value={formData.serverLabel}
                  onChange={(e) => handleInputChange('serverLabel', e.target.value)}
                  placeholder="Enter server label"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Server Description</label>
                <Textarea 
                  value={formData.serverDescription}
                  onChange={(e) => handleInputChange('serverDescription', e.target.value)}
                  placeholder="Enter server description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Connection Type *</label>
                <select 
                  value={formData.connectionType}
                  onChange={(e) => handleInputChange('connectionType', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="Streamable HTTP">Streamable HTTP</option>
                  <option value="WebSocket">WebSocket</option>
                  <option value="gRPC">gRPC</option>
                  <option value="TCP">TCP</option>
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
                  value={formData.authentication}
                  onChange={(e) => handleInputChange('authentication', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="No">No</option>
                  <option value="API Key">API Key</option>
                  <option value="OAuth">OAuth</option>
                  <option value="JWT">JWT</option>
                  <option value="Basic Auth">Basic Auth</option>
                </select>
              </div>
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
