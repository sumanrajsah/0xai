'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function WalletConnectButton() {
  const { isConnected, address } = useAccount()
  const { open } = useAppKit()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          Connected
        </Badge>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {address?.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatAddress(address!)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAddress}
            className="h-6 w-6 p-0"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => open()}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  )
}

