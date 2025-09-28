import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { Poppins } from "next/font/google";
import { headers } from 'next/headers'
import '@fontsource-variable/orbitron';
import Head from "next/head";
import Script from "next/script";
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] });
import { GoogleAnalytics } from '@next/third-parties/google'

import ThemeP from "../themeProvider";




export const metadata: Metadata = {
    metadataBase: new URL("https://0xxplorer.com"),
    title: "0xXplorer AI is an AI-Powered Web3 Chatbot Assistant",
    description: "0xXplorer is an AI-powered blockchain explorer & Chatbot Assitant for seamless transaction analysis, smart contract insights, and real-time data.",
    keywords: "0xxplorer,0xai,0x,explorer,xplorer,0xxai,0ai,xai,qubicsquare,chatgpt,openai,dobby,polygon,english,connect,wallet,metamask,etherscan,polygonscan,monad,testnet,mainnet,web3,chatbot,blockchain,decentralized,ethereum,bsc,avalanche,arbitrum,optimism,sepolia,base,amoy,chain,transaction,smart contract,insights,real-time,data,analysis,assistant,ai,artificial intelligence,web3",
    openGraph: {
        title: "0xXplorer AI is an AI-Powered Web3 Chatbot Assistant",
        description: "0xXplorer is an AI-powered blockchain explorer & Chatbot Assitant  for seamless transaction analysis, smart contract insights, and real-time data.",
        images: ['/0xai512.png'],
        type: 'website',
        url: 'https://0xxplorer.com/'
    }, twitter: {
        title: "0xXplorer AI is an AI-Powered Web3 Chatbot Assistant",
        description: "0xXplorer is an AI-powered blockchain explorer & Chatbot Assitant  for seamless transaction analysis, smart contract insights, and real-time data.",
        images: ['/0xai512.png'],
        card: 'summary_large_image',
        site: '@0xxplorerAi'

    }
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "0xXplorer AI is an AI-Powered Blockchain Explorer & Chatbot Assistant",
        "url": "https://0xxplorer.com/",
        "description": "0xXplorer is an AI-powered blockchain explorer & chatbot assistant for seamless transaction analysis, smart contract insights, and real-time data.",
        "image": "https://0xxplorer.com/0xai512.png",
        "author": {
            "@type": "Organization",
            "name": "Qubicsquare Technologies Private Limited",
            "createdBy": "SquareX Labs",
            "url": "https://qubicsquare.tech/"
        }

    };
    const headersObj = await headers();
    const cookies = headersObj.get('cookie')
    return (
        <html lang="en" suppressHydrationWarning>
            <Head>
                {/* Schema.org JSON-LD */}


                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            "name": "0xXplorer Ai",
                            "description": "AI-powered blockchain explorer with chatbot for transaction analysis and smart contract insights.",
                            "url": "https://0xxplorer.com",
                            "image": "https://0xxplorer.com/0xai512.png",
                            "applicationCategory": "Blockchain Explorer,Ai,chatbot",
                            "operatingSystem": "All",
                            "author": {
                                "@type": "Organization",
                                "name": "Qubicsquare Technologies Private Limited",
                                "createdBy": "SquareX Labs",
                                "url": "https://qubicsquare.tech"
                            },
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD",
                                "availability": "https://schema.org/InStock",
                                "seller": {
                                    "@type": "Organization",
                                    "name": "Qubicsquare Technologies Private Limited",
                                    "createdBy": "SquareX Labs",
                                    "url": "https://qubicsquare.tech"
                                }
                            }
                        }),
                    }}
                />

                <script
                    type="application/ld+json"
                >
                    {JSON.stringify(schemaData)}
                </script>
                <link rel="canonical" href="https://0xxplorer.com" />
                <Script async src="https://www.googletagmanager.com/gtag/js?id=G-HNRJ1B7WCF"></Script>
                <Script
                    dangerouslySetInnerHTML={{
                        __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-HNRJ1B7WCF', {
                page_path: window.location.pathname,
              });
            `,
                    }}
                />

            </Head>
            <body className={poppins.className}>
                <Script
                    async
                    strategy="afterInteractive"
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8547142025822525"
                    crossOrigin="anonymous"
                />
                <ThemeP>
                    {children}
                </ThemeP>
            </body>
            <GoogleAnalytics gaId="G-HNRJ1B7WCF" />
        </html>
    );
}
