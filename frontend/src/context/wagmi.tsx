'use client'

import React, { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { arbitrum, avalanche, base, baseSepolia, bsc, bscTestnet, mainnet, monadTestnet, optimism, polygon, polygonAmoy, sepolia } from '@reown/appkit/networks'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { projectId, wagmiAdapter } from '@/config/wagmi'


// Setup queryClient
const queryClient = new QueryClient()



// Create modal
const metadata = {
    name: '0xAi',
    description: '0xAI- Your AI-powered assistant for seamless blockchain exploration and insights..',
    url: 'http://localhost:3000', // origin must match your domain & subdomain
    icons: ['https://drive.google.com/file/d/1hjWg19jXDNFBdiT5TXZzh0Z5SjJgFV2F/view?usp=sharing']
}

// Create the modal

export default function Web3ModalProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);
    if (!projectId) throw new Error('Project ID is not defined')
    const appKit = createAppKit({
        themeMode: 'dark',
        //debug: true,
        termsConditionsUrl: 'https://0xxplorer.com/term-and-condition',
        privacyPolicyUrl: 'https://0xxplorer.com/privacy-policy',
        adapters: [wagmiAdapter],
        projectId,
        networks: [sepolia,],
        defaultNetwork: sepolia,
        metadata: metadata,
        featuredWalletIds: [
            'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
            '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
            'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa'
        ],
        features: {
            analytics: true, // Optional - defaults to your Cloud configuration
            //legalCheckbox: true,
            // email: true, // default to true
            // socials: ['google', 'facebook', 'apple', 'discord', 'farcaster', 'github', 'x'],
            // emailShowWallets: false,
            // connectMethodsOrder: ['email', 'social', 'wallet'],

        },
        defaultAccountTypes: { eip155: 'eoa' }
        // siweConfig: siweConfig 
    })
    return (
        <WagmiProvider reconnectOnMount={true} config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}