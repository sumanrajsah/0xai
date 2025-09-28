import { useEffect, useRef, useState } from "react";
import './profile.css'
import { BrainCircuit, LogOut, Pickaxe, Server, Settings, Telescope, User2, Wrench, Mail, UserCircle, ScrollText, Headset, Gavel, Sparkle, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import ThemeToggle from "../ThemeToggle";
import { useTheme } from "next-themes";
import { useAuth } from "../../../hooks/useAuth";
import { useAlert } from "../../../context/alertContext";
const planOrder = ["free", "plus", "pro", "pro-plus"];
const planLabels: Record<string, string> = {
    free: "Free",
    plus: "Plus",
    pro: "Pro",
    "pro-plus": "Pro+",
};
const ProfileCont = () => {
    const router = useRouter();
    const { theme } = useTheme();
    const { user, setUser, setStatus } = useAuth()
    const alertMessage = useAlert()
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Function to get user initials
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

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const handleCloseModal = () => {
        setShowLogoutModal(false);
    };

    async function handleLogout() {
        console.log('Logging out', user);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/v1/auth/logout`, {
            method: "POST",
            credentials: "include", // VERY IMPORTANT: enables sending/receiving cookies
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user }),
        });
        console.log('Logout response:', res);

        if (res?.ok) {
            setUser(null);
            setStatus("unauthenticated");
            alertMessage.success("✅ Logout successful");
            location.href = "/login";
            localStorage.removeItem("auth-user");
        } else {
            alertMessage.warn("⚠️ Logout failed");
        }
    }
    if (!user || !user.plan) {
        return null;
    }
    const currentIndex = planOrder.indexOf(user.plan as string);

    const nextPlan = planOrder[currentIndex + 1];
    return (
        <>
            <div className="profile-sidebar-body">
                {/* User Details Section */}
                <div className="user-details">
                    <div className="user-avatar">
                        {user?.image ? (
                            <img
                                src={user.image}
                                alt="Profile"
                                className="avatar-image"
                                onError={(e) => {
                                    // Hide the image and show initials if image fails to load
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    if ((e.target as HTMLImageElement).nextSibling && (e.target as HTMLImageElement).nextSibling instanceof HTMLElement) {
                                        ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                                    }
                                }}
                            />
                        ) : null}
                        <div
                            className="avatar-initials"
                            style={{
                                display: user?.image ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(94, 129, 173, 0.2)',
                                color: 'rgba(94, 129, 173, 1)',
                                fontSize: '14px',
                                fontWeight: '600',
                                borderRadius: '50%'
                            }}
                        >
                            {getUserInitials(user?.name)}
                        </div>

                    </div>
                    <span className="plan" style={{ textTransform: 'uppercase', fontWeight: '600' }}>{user?.plan === 'pro-plus' ? 'pro+' : `${user?.plan}`}</span>
                    <div className="user-info">
                        <div className="user-name">
                            {user?.name || 'User'}
                        </div>
                        <div className="user-email">
                            {user?.email || 'user@example.com'}
                        </div>
                    </div>
                </div>

                {user?.plan !== 'pro-plus' && <button className="profile-btn upgrade-btn" onClick={() => { router.push('/plan') }}>
                    <Sparkles size={20} />  Upgrade to {planLabels[nextPlan]}
                </button>}
                <hr />
                <button className="profile-btn" onClick={() => { location.href = '#settings' }}>
                    <Settings size={20} />Settings
                </button>
                {/* <button className="profile-btn" onClick={() => { router.push('?settings=true') }}>
                <Settings size={20} />Settings
            </button> */}
                <ThemeToggle />

                <hr />
                <button className="profile-btn" onClick={() => { router.push('/term-and-condition') }}>
                    <Gavel size={20} />Terms & Policies
                </button>
                <button className="profile-btn" onClick={() => { router.push('/faq') }}>
                    <ScrollText size={20} />FAQ
                </button>
                <button className="profile-btn" onClick={() => { window.open('https://t.me/aumai_customer_support', '_blank') }}>
                    <Headset size={20} />Support
                </button>
                <hr />

                <button className="logout-btn" onClick={handleLogoutClick}>
                    <LogOut size={24} />Log out
                </button>
            </div>
            {showLogoutModal && (
                <div className="logout-modal-overlay" onClick={handleCloseModal}>
                    <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-modal-header">
                            <h3>Confirm Logout</h3>
                            <button
                                className="logout-modal-close-btn"
                                onClick={handleCloseModal}
                                disabled={isLoggingOut}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="logout-modal-body">
                            <p>Are you sure you want to log out?</p>
                        </div>
                        <div className="logout-modal-actions">
                            <button
                                className="logout-modal-btn logout-cancel-btn"
                                onClick={handleCloseModal}
                                disabled={isLoggingOut}
                            >
                                Cancel
                            </button>
                            <button
                                className="logout-modal-btn logout-confirm-btn"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <>
                                        <div className="logout-spinner"></div>
                                        Logging out...
                                    </>
                                ) : (
                                    <>
                                        <LogOut size={18} />
                                        Log out
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfileCont;