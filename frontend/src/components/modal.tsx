import { useEffect, useRef, useState } from "react";
import { BrainCircuit, LogOut, Pickaxe, Server, Settings, Telescope, User2, Wrench } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import RenameChatModal from "./chat/modals/rename";
import ImageModal from "./chat/modals/image-modal";
import { useAuth } from "@/hooks/useAuth";
import ToolsModal from "./tools/toolModal";

const Modal = () => {
    const router = useRouter();
    const { user, status } = useAuth()
    const modalRef = useRef<HTMLDivElement | null>(null);
    const { theme } = useTheme();
    const pathname = usePathname();
    const [openToolsModal, setOpenToolsModal] = useState<boolean>(false);


    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleHash = () => {
            const hash = window.location.hash;
            //console.log('HASH:', hash);
            setOpenToolsModal(hash === '#tools');
        };

        // Run on mount
        handleHash();

        // Listen for hash changes (without reload)
        window.addEventListener('hashchange', handleHash);

        return () => {
            window.removeEventListener('hashchange', handleHash);
        };
    }, [pathname]);

    return (
        <>
            {openToolsModal && <ToolsModal />}

        </>
    );
};

export default Modal;
