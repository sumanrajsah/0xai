import { Children, useEffect, useRef, useState } from "react";
import './style.css'
import { BrainCircuit, Layers, LogOut, Pickaxe, PlusCircle, Server, Settings, Telescope, User2, Wrench, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { ReactNode } from "react";

interface ModalProps {
    children: ReactNode;
    closeBtn?: boolean;
}

const ModalCont = ({ children, closeBtn = true }: ModalProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Add fade-in animation
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            window.location.hash = '';
        }, 200);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <div
            className={`modal-body ${isVisible ? 'modal-visible' : ''}`}
            onClick={handleBackdropClick}
        >
            <div className="modal-wrapper">
                {closeBtn && <button
                    className="modal-close-btn"
                    onClick={handleClose}
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>}

                <div className="modal-cont">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ModalCont;