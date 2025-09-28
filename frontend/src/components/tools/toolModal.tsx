import { useEffect, useState } from "react";
import './style.css';
import { X, PlusCircle, Trash2, SquarePlus, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { Composio } from "composio-core";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useTheme } from "next-themes";
import { fetchApps } from "./utils";
import { useChat, useMcpServer } from "@/context/chatContext";
import ModalCont from "../modal/modalCont";
import SelectToolButton from "../toolComp/toolmodal";
import SelectMcpButton from "../selectmcp";



const ToolsModal = () => {

    const { theme } = useTheme()
    const { selectedServers } = useMcpServer();
    const { tools } = useChat();

    const [apps, setApps] = useState<any[]>([]);

    // useEffect(() => {
    //     async function fetchData() {
    //         const apps = await fetchApps()
    //         setApps(apps);
    //         console.log('APPS:', apps);
    //     }
    //     fetchData();
    // }, []);

    return (
        <ModalCont>
            {selectedServers.length === 0 && <SelectToolButton />}
            {tools.length === 0 && <SelectMcpButton />}
        </ModalCont>
    );
};

export default ToolsModal;
