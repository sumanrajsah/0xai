import React from "react";
import { X, Search, Globe, Image } from "lucide-react";
import "./toolChip.css";
import { useChat } from "@/context/chatContext";

interface ToolChipProps {
    tool: string;
    onRemove: (tool: string) => void;
}

const ToolChip: React.FC<ToolChipProps> = ({ tool, onRemove }) => {
    return (
        <div className="tool-chip">
            {tool === "web_search" && <Globe size={18} />}
            {tool === "web_search" && <span className="tool-label">Search</span>}
            {tool === "image" && <Image size={18} />}
            {tool === "image" && <span className="tool-label">Image</span>}
            <button
                className="tool-remove"
                onClick={() => onRemove(tool)}
                aria-label={`Remove ${tool}`}
            >
                <X size={14} />
            </button>
        </div>
    );
};

export const ToolChips: React.FC = () => {
    const { tools, setTools } = useChat();
    const toggleToolSelection = (toolName: string) => {
        setTools(prev =>
            prev.includes(toolName) ? [] : [toolName]  // only keep one tool
        );
    };

    if (!tools || tools.length === 0) return null;

    return (
        <div className="tools-chip-container">
            {tools.map((tool: string) => (
                <ToolChip key={tool} tool={tool} onRemove={() => toggleToolSelection(tool)} />
            ))}
        </div>
    );
};
