'use client'
import React, { use, useEffect, useRef, useState } from "react"
import './header.css'
import { AlignLeft, CircleFadingPlus, Coins, Layers, MessagesSquare, PanelRightClose, PenLine, Plus, SquarePen, User2 } from "lucide-react"

import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/useAuth"
import { useSidebarStore } from "../../../store/useSidebarStore"
import { useChat } from "@/context/chatContext"




const Header = () => {
    const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebarStore();
    const router = useRouter()
    const { messages, aiTyping, setIsChatRoom, setMessages, selectModel, Model, setChatId, chatId, } = useChat();
    const [openDisconnecModel, setOpenDisconnectModel] = useState<boolean>(false)
    const [openWorkspaceModel, setOpenWorkspaceModel] = useState<boolean>(false)
    const pathname = usePathname()
    const { user, status } = useAuth()
    const modalRef = useRef<HTMLDivElement | null>(null);
    const { theme } = useTheme();


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setOpenDisconnectModel(false);
                setOpenWorkspaceModel(false);
            }
        }

        if (openDisconnecModel || openWorkspaceModel) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openDisconnecModel, openWorkspaceModel]);

    return (
        <>
            <div className={`header ${isSidebarOpen ? 'collapsed' : 'expanded'}`} onClick={async () => { setOpenDisconnectModel(false) }} >
                <div className="header-left-btn-cont">
                    {!isSidebarOpen && <button className="ham-btn" title="open" onClick={(e) => {
                        // e.stopPropagation()
                        toggleSidebar()
                    }}>
                        <AlignLeft size={20} />
                    </button>}

                </div>

                {/* {pathname !== '/' && !pathname.startsWith('/c/') && <button onClick={() => router.push('/')} className="header-button">Home</button>} */}
                <div className="btn-cont">

                    {pathname === '/store/agents' && user && <button onClick={() => router.push('/store/agents/mine')} className="header-button">My Agents</button>}
                    {pathname === '/store/mcp' && user && <button onClick={() => router.push('/store/mcp/mine')} className="header-button">My MCP</button>}

                    <appkit-button />
                </div>

            </div>
        </>
    )
}

export default Header;