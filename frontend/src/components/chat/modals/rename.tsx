import { useEffect, useRef, useState } from "react";
import './rename.css'
import { BrainCircuit, Layers, LogOut, Pickaxe, PlusCircle, Server, Settings, Telescope, User2, Wrench, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useAuth } from "../../../../hooks/useAuth";
import { useAlert } from "../../../../context/alertContext";

import axios from "axios";
import { useChat, useWorkspace } from "../../../../context/ChatContext";
import ModalCont from "../../modal/modalCont";


const RenameChatModal = () => {
    const router = useRouter();
    const { theme } = useTheme();
    const { memoizedHistory, setHistory } = useChat()
    const { user } = useAuth()
    const alertMessage = useAlert()
    const [chatName, setChatName] = useState("");
    const { currentWorkspace } = useWorkspace()
    const [params, setParams] = useState({ id: '', name: '' });

    useEffect(() => {
        setChatName(params.name)
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash; // e.g., "#renamechat?name=...&id=..."
            const queryString = hash.split('?')[1]; // get "name=...&id=..."
            const urlParams = new URLSearchParams(queryString);

            setParams({
                id: urlParams.get('id') || '',
                name: decodeURIComponent(urlParams.get('name') || ''),
            });
        }
    }, []);

    async function renameChatTitle(id: string) {
        if (!chatName || chatName.trim() === '') {
            alertMessage.warn('Chat title cannot be empty');
            return;
        }

        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/chat/editChatInfo`,
                {
                    chat_id: id,
                    uid: user?.uid,
                    wid: currentWorkspace,
                    title: chatName
                },
                {
                    withCredentials: true, // ✅ This goes here, not inside the body
                }
            );

            if (response.data.message === 'success') {
                alertMessage.success('edited successfully');
                const updatedHistory = Object.entries(memoizedHistory).reduce((acc, [date, chats]) => {
                    acc[date] = chats.map(chat =>
                        chat.chat_id === id ? { ...chat, title: chatName } : chat
                    );
                    return acc;
                }, {} as GroupedHistoryByDate);


                // Update the state
                setHistory(updatedHistory);
            }
        } catch (e) {
            console.log(e);
            alertMessage.error('something went wrong');
        }
    }


    return (
        <ModalCont>
            <h2 className="rename-title">Rename</h2>
            <div className="rename-input-group">
                <label className="rename-label">Name</label>
                <input type="text" id="workspace-name" className="rename-input" placeholder="Name..." onChange={(e) => { setChatName(e.target.value) }} value={chatName} required />
            </div>
            <button
                className="rename-btn"
                onClick={() => {
                    if (params.id) {
                        renameChatTitle(params.id);
                    } else {
                        alertMessage.error('Chat ID is missing');
                    }
                }}
            >
                Submit
            </button>

        </ModalCont>
    );
};

export default RenameChatModal;
