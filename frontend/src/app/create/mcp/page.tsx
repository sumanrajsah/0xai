'use client'
import { useState } from "react";
import './style.css';
import { ToastContainer, toast } from "react-toastify";
import { Oval } from "react-loader-spinner";
import { useTheme } from "next-themes";
import { useAuth } from "../../../hooks/useAuth";
import { useAlert } from "../../../context/alertContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import { MCP } from "../../../../utils/mcp";
import { useAccount } from "wagmi";

// Define the McpServer type
interface McpServer {
    label: string;
    description: string;
    uri: string;
    type: string;
    auth: boolean;
    header: {
        key: string;
        value: string;
    },
    tools: string[];
}

const McpServerModalSetting = () => {
    const account = useAccount();
    const router = useRouter();
    const [create, setCreate] = useState(false)
    const [mcpServer, setMcpServer] = useState<McpServer>({
        label: "",
        description: "",
        auth: false,
        uri: "",
        type: "http",
        header: {
            key: '',
            value: ''
        }, tools: []
    });
    const [isPending, setPending] = useState(false);
    const { user } = useAuth();
    const alertMessage = useAlert();

    const updateServer = (field: keyof McpServer | "header.key" | "header.value", value: any) => {
        if (field === "header.key") {
            setMcpServer(prev => ({
                ...prev,
                header: {
                    ...prev.header,
                    key: value
                }
            }));
        } else if (field === "header.value") {
            setMcpServer(prev => ({
                ...prev,
                header: {
                    ...prev.header,
                    value: value
                }
            }));
        } else {
            setMcpServer(prev => ({ ...prev, [field]: value }));
        }
    };

    const CheckConnection = async (serverInfo: McpServer) => {
        if (!serverInfo.uri || !serverInfo.label) {
            toast.warn("Missing required fields");
            return;
        }

        setPending(true);
        try {
            const server =
            {
                uri: serverInfo.uri,
                header: {
                    key: serverInfo.header.key,
                    value: serverInfo.header.value
                },
                type: serverInfo.type
            }
            const response = await MCP(server);
            if (response.mcpClient !== null) {
                alertMessage.success("Server is live");
                console.log(response.tools)
                updateServer('tools', response.tools.map(item => item.function.name))
            } else {
                alertMessage.error('Check your server details');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setPending(false);
        }
    };

    const SaveServer = async () => {
        if (!mcpServer.label?.trim() || !mcpServer.uri?.trim()) {
            toast.warn("Please fill in all required fields");
            return;
        }

        if (!user?.uid) {
            alertMessage.warn('unauthorized')
            return;
        }

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/agents/save`,
                {
                    servers: mcpServer,
                    address: account.address,
                },
                {
                    withCredentials: true
                }
            );


            if (response.status === 200) {
                if (response.data.message === 'success') {
                    alertMessage.success("Server successfully saved");
                    // Reset form after successful save
                    setMcpServer({
                        label: "",
                        description: "",
                        auth: false,
                        uri: "",
                        header: {
                            key: '',
                            value: ''
                        },
                        type: "http",
                        tools: []
                    });
                    location.href = '/store/mcp/mine';
                } else {
                    alertMessage.warn(response.data.message);
                }
            }
        } catch (e) {
            console.error(e);
            alertMessage.error("Something went wrong while saving");
        }
    };
    if (account.isDisconnected) {
        return <div className="mcpserver-body">
            <p>You must be logged in to create an MCP server.</p>
        </div>
    }

    return (
        <div className="mcpserver-body">
            <h1>Add MCP</h1>
            <div className="mcpserver-cont">
                <div className="mcpserver-sbox">
                    <label>Server Label</label>
                    <input
                        placeholder="SitrAi"
                        value={mcpServer.label}
                        onChange={(e) => updateServer("label", e.target.value)}
                        type="text"
                        required
                    />

                    <label>Server Description</label>
                    <textarea
                        placeholder="Short description"
                        value={mcpServer.description}
                        onChange={(e) => updateServer("description", e.target.value)}
                        required
                    />

                    <label>Connection Type</label>
                    <select onChange={(e) => { updateServer("type", e.target.value) }} defaultValue={'http'}>
                        <option value={'http'}>Streamable HTTP</option>
                        <option value={'sse'}>SSE</option>
                        {/* <option value={'sse'}>SSE</option> */}
                    </select>
                    <label>URI</label>
                    <input
                        placeholder="https://mcp.sitrai.com/mcp"
                        value={mcpServer.uri}
                        onChange={(e) => updateServer("uri", e.target.value)}
                        type="url"
                        required
                    />
                    <label>Authentication</label>
                    <select onChange={(e) => { updateServer("auth", e.target.value === 'true') }} defaultValue={'false'}>
                        <option value={'true'}>Yes</option>
                        <option value={'false'}>No</option>
                    </select>
                    {mcpServer.auth && <>
                        <label>Header Name</label>
                        <input
                            placeholder="Authorization"
                            value={mcpServer.header.key}
                            onChange={(e) => updateServer("header.key", e.target.value)}
                            type="text"
                        />
                        <label>Bearer Token</label>
                        <input
                            placeholder="Bearer Token"
                            value={mcpServer.header.value}
                            onChange={(e) => updateServer("header.value", e.target.value)}
                            type="password"
                        />
                    </>}
                    <div className="server-btn-cont">
                        {isPending ? (
                            <Oval height={30} width={30} color="gray" secondaryColor="gray" visible />
                        ) : (
                            <button
                                onClick={() => CheckConnection(mcpServer)}
                                disabled={!mcpServer.label || !mcpServer.uri}
                            >
                                Verify
                            </button>
                        )}
                    </div>

                </div>

                <div className="server-btn-cont">
                    <button
                        className="mcp-save-btn"
                        onClick={SaveServer}
                        disabled={!mcpServer.label?.trim() || !mcpServer.uri?.trim()}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>

    );
};

export default McpServerModalSetting;