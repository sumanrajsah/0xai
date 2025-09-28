import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Web3ModalProvider from "@/context/wagmi";
import { headers } from "next/headers";
import { AuthProvider } from "@/context/authContext";
import { AlertProvider } from "@/context/alertContext";
import { AppContextProvider } from "@/context/chatContext";
import PageStruct1 from "@/components/pagestruct/struct1";
import ThemeP from "./themeProvider";

const geistSans = Poppins({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: "400"
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
        className={`${geistSans.variable} antialiased`}
      >
        <Web3ModalProvider cookies={cookies}>

          <AuthProvider>
            <AlertProvider>
              <AppContextProvider>
                <ThemeP>
                  <PageStruct1>

                    {children}
                  </PageStruct1>
                </ThemeP>
              </AppContextProvider>
            </AlertProvider>
          </AuthProvider>
        </Web3ModalProvider>
      </body>
    </html>
  );
}
