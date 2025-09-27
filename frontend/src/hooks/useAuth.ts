import { useEffect, useState } from "react";
import axios from "axios";
import { useAccount } from "wagmi";
import { useAppKit, useDisconnect } from "@reown/appkit/react";
import { signMessage } from "@wagmi/core";
import { config } from "@/config/wagmi";

interface User {
    uid: string;
    address: string;
}
type Status = "authenticated" | "unauthenticated" | "pending";

const SignInWithEthereum = async (address: string) => {
    const message = `Sign in with Ethereum\n\nAddress: ${address}\nNonce: ${Date.now()}`;
    const signature = await signMessage(config, { message });

    const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URI}/v1/auth/account`,
        { address, message, signature },
        { withCredentials: true }
    );
    return res.data.user as User;
};

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<Status>("pending");
    const [loading, setLoading] = useState(true);

    const account = useAccount();
    const { disconnect } = useDisconnect();
    const { open } = useAppKit();

    const fetchAuth = async () => {
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/auth/me`,
                { withCredentials: true }
            );
            console.info("Auth fetch response:", res.data);
            setUser(res.data.user);
            setStatus("authenticated");
        } catch {
            setUser(null);
            setStatus("unauthenticated");
        } finally {
            setLoading(false);
        }
    };

    const ConnectWallet = async () => {
        if (!account.isConnected) {
            await open();
            return;
        }
        if (account.address && status !== "authenticated") {
            const u = await SignInWithEthereum(account.address);
            setUser(u);
            setStatus("authenticated");
        }
    };

    const Logout = async () => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/auth/logout`,
                {},
                { withCredentials: true }
            );
            disconnect();
        } catch (e) {
            console.error("Logout failed", e);
        }
        setUser(null);
        setStatus("unauthenticated");
    };

    useEffect(() => {
        fetchAuth();
    }, [account.status]);

    useEffect(() => {
        if (account.isConnected && account.address && status === "unauthenticated") {
            SignInWithEthereum(account.address)
                .then(u => {
                    setUser(u);
                    setStatus("authenticated");
                })
                .catch(() => setStatus("unauthenticated"));
        }
    }, [account.isConnected, account.address, status]);
    console.log("Auth State:", { user, status, loading });

    return { user, status, isAuthLoading: loading, ConnectWallet, Logout };
};
