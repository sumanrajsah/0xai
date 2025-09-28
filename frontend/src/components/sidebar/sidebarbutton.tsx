import Image from "next/image";
import './style.css'
import { PanelRight } from "lucide-react";

interface SidebarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export default function SidebarButton({ children, ...props }: SidebarButtonProps) {
    return (
        <button {...props}>
            {children}
        </button>
    );
}
