import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, sepolia, polygonAmoy, optimism, arbitrum, bsc, bscTestnet, avalanche, base, baseSepolia, monadTestnet } from '@reown/appkit/networks'

// Get projectId from https://cloud.walletconnect.com
export const projectId = '2de86afde1387c58f7c4157c9c88381e'
console.log("Project ID:", projectId);

if (!projectId) throw new Error('Project ID is not defined');
export const networks = [sepolia]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
    projectId,
    networks
})

export const config = wagmiAdapter.wagmiConfig;