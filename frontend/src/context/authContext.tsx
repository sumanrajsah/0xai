"use client";

import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";

interface AuthContextType {
    user: { uid: string; address: string } | null;
    status: string;
    isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const auth = useAuth();

    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuthContext must be used within an AuthProvider");
    return context;
};