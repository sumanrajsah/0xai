"use client";

import React from "react";

interface HtmlPreviewProps {
    code: string;
    open: boolean;
    onClose: () => void;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({ code, open, onClose }) => {
    if (!open) return null;

    // Download handler
    const handleDownload = () => {
        const blob = new Blob([code], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "index.html";
        a.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                right: 0,
                height: "100vh",
                width: "50vw",
                boxShadow: "-2px 0 10px rgba(0,0,0,0.2)",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                }}
            >
                <span style={{ fontWeight: 600 }}>HTML Preview</span>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={handleDownload}
                        style={{
                            padding: "6px 12px",

                            borderRadius: "4px",

                            cursor: "pointer",
                        }}
                    >
                        Download
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Iframe */}
            <iframe
                sandbox="allow-scripts"
                style={{
                    flex: 1,
                    width: "100%",
                    border: "none",
                }}
                srcDoc={code}
            />
        </div>
    );
};

export default HtmlPreview;
