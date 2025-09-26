import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Web3ModalProvider from "@/context/wagmi";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "0xAI - AI-Powered Blockchain Assistant",
  description: "Your AI-powered assistant for seamless blockchain exploration and insights",
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const headersObj = await headers();
  const cookies = headersObj.get('cookie')
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3ModalProvider cookies={cookies}>{children}</Web3ModalProvider>
      </body>
    </html>
  );
}
