'use client'
import Image from "next/image";
import './style.css'
import { useSidebarStore } from "../../../store/useSidebarStore";
import { usePathname } from "next/navigation";
import Header from "../header/header";
import Sidebar from "../sidebar/sidebar";
import Modal from "../modal";


export default function PageStruct1({ children }: { children: React.ReactNode }) {
    const { isSidebarOpen, toggleSidebar } = useSidebarStore();
    const pathname = usePathname();

    return (
        <>
            <Modal />

            {(pathname !== '/login' && pathname !== '/signup' && pathname !== '/term-and-condition') ? <div className="page-struct1">
                <Header />
                <Sidebar />
                <div className={`page-struct1-body ${isSidebarOpen ? 'collapsed-page' : 'expanded'} `} >
                    {children}
                </div>

            </div> : <>{children}</>}
        </>
    );
}
