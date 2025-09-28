'use client'
import React, { useCallback, useEffect, useRef, useState } from "react"
import './style.css'
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Archive, BrainCircuit, ChevronDown, ChevronRight, ImagePlay, Images, Layers, MessagesSquare, Moon, PanelLeft, Play, Plus, PlusCircle, ScrollText, Search, Image as Limage, EllipsisVertical, MessageSquare, PenLine, Rocket, SquarePen, User, UserPlus, Zap } from "lucide-react"

import axios from "axios"
import SidebarButton from "./sidebarbutton"
import { useSidebarStore } from "../../../store/useSidebarStore"
import { useChat } from "@/context/chatContext"
import { useAuth } from "@/hooks/useAuth"
import { useAlert } from "@/context/alertContext"



const Sidebar = () => {
    const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebarStore();
    const router = useRouter();
    const { messages, aiTyping, setIsChatRoom, setMessages, selectModel, Model, setChatId, chatId, setAgentId } = useChat();

    // console.log(memoizedHistory)
    const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const { user, status } = useAuth()
    const { theme, setTheme, systemTheme } = useTheme();
    const alertMessage = useAlert()
    const SidebarRef = useRef<HTMLDivElement | null>(null);
    const [isWorkspaceExpannd, setWorkspaceExpand] = useState(false)
    const [isAgentExpannd, setAgentExpand] = useState(false)
    const [isStudioExpannd, setStudioExpand] = useState(true)
    const [openProfileModal, setProfileModal] = useState(false)
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [quickAccessExpanded, setQuickAccessExpanded] = useState(false);
    const [quickAccess, setQuickAccess] = useState<any>(null);


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (SidebarRef.current && !SidebarRef.current.contains(event.target as Node)) {

                if (innerWidth <= 1000) {
                    closeSidebar();
                }
            }
        }

        if (isSidebarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSidebarOpen]);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setProfileModal(false)
            }
        }

        if (openProfileModal) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openProfileModal]);


    function toggleDropdown(type: string) {
        if (type === 'quickAccess') {
            setQuickAccessExpanded(!quickAccessExpanded)
            setWorkspaceExpand(false)
        }
        if (type === 'workspace') {
            setAgentExpand(false)
            setWorkspaceExpand(!isWorkspaceExpannd)
        }
    }
    const getUserInitials = (name: string | undefined) => {
        if (!name) return 'U';

        const nameParts = name.trim().split(' ');
        if (nameParts.length === 1) {
            return nameParts[0].charAt(0).toUpperCase();
        }

        const firstInitial = nameParts[0].charAt(0).toUpperCase();
        const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();

        return firstInitial + lastInitial;
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const currentTheme = theme === 'system' ? systemTheme : theme;

    return (
        <>
            {isSidebarOpen && <div className="sidebar" onClick={() => { setActiveMenuChatId('') }} ref={SidebarRef}>
                <div className="slogo-cont" >
                    <Image src="/sitraone.png" onClick={() => { router.push('/'); setMessages([]); }} alt="0xXplorer" width={30} height={30} priority />
                    <SidebarButton className="sidebar-button-2 close-sidebar" style={{ cursor: 'w-resize' }} data-tooltip="Close Sidebar" onClick={() => { toggleSidebar() }}>
                        <PanelLeft size={20} />
                    </SidebarButton >
                </div>
                <hr />
                <div className="sidebar-2-top-cont top-cont-scroll" onClick={(e) => { e.stopPropagation() }}>


                    <SidebarButton className="sidebar-button" onClick={() => { router.push(`/?model=${Model}`); setMessages([]); setChatId(""); setAgentId('') }}>
                        <SquarePen size={20} />New Chat
                    </SidebarButton >
                    <SidebarButton className="sidebar-button" onClick={() => { router.push('/create') }}>
                        <PlusCircle size={20} />Create
                    </SidebarButton >





                    <SidebarButton className="sidebar-button" data-tooltip={'history'} onClick={() => router.push('/agents')}>
                        <Layers size={20} /> AI Agents
                    </SidebarButton>
                    <SidebarButton className="sidebar-button" data-tooltip={'history'} onClick={() => router.push('/agents/publish')}>
                        <Layers size={20} /> Publish Agents
                    </SidebarButton>

                </div>
                <div className="sidebar-2-bottom-cont" onClick={(e) => { e.stopPropagation() }}>
                    <hr />
                </div>

            </div>}
            {!isSidebarOpen && <div className="sidebar-2" style={{ cursor: 'w-resize' }} onClick={() => { toggleSidebar() }}>
                <div className="slogo-cont" onClick={() => { router.push('/') }} style={{ justifyContent: 'center' }}>
                    <Image src="/sitraone.png" alt="0xXplorer" width={30} height={30} priority />
                </div>
                <div className="sidebar-2-top-cont" onClick={(e) => { e.stopPropagation() }}>
                    <SidebarButton className="sidebar-button-2 toggle-sidebar" data-tooltip="open sidebar" style={{ cursor: 'w-resize' }} title={isSidebarOpen ? "close" : "open"} onClick={() => { toggleSidebar() }}>
                        <PanelLeft size={20} />
                    </SidebarButton>

                    <SidebarButton className="sidebar-button-2" data-tooltip="New Chat" onClick={() => { router.push(`/?model=${Model}`); setMessages([]); setChatId("") }}> <SquarePen size={20} /></SidebarButton>
                    <SidebarButton className="sidebar-button-2" data-tooltip="Create" onClick={() => { router.push('/create') }}>
                        <PlusCircle size={20} />
                    </SidebarButton >



                </div>

            </div>}
        </>
    )
}

export default Sidebar;