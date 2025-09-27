'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import './style.css'
import { CircleCheck } from 'lucide-react';
type AlertType = 'success' | 'error' | 'warn';

type Alert = {
    message: string;
    type: AlertType;
};

type AlertContextType = {
    toast: {
        success: (msg: string) => void;
        error: (msg: string) => void;
        warn: (msg: string) => void;
    };
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context.toast;
}

export function AlertProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<Alert | null>(null);

    const show = (type: AlertType, message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 2000); // auto close in 3s
    };

    const toastAPI = {
        success: (msg: string) => show('success', msg),
        error: (msg: string) => show('error', msg),
        warn: (msg: string) => show('warn', msg),
    };

    return (
        <AlertContext.Provider value={{ toast: toastAPI }}>
            {children}
            {toast && (
                <div className='toast-container'>
                    <div className={`toast toast-${toast.type}`}>
                        {toast.type === 'success' && <CircleCheck size={20} color='green' />}
                        {toast.type === 'error' && <span className="toast-icon">❌</span>}
                        {toast.type === 'warn' && <span className="toast-icon">⚠️</span>}
                        {toast.message}
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
}
