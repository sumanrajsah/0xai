import { Composio } from "composio-core";

export async function fetchApps() {
    const composio = new Composio({ apiKey: "kpf5d2tfq5bagvlz8susu9" });
    const response = await fetch("https://mcp.composio.dev/api/apps", {
        method: "GET",
        headers: {},
    });
    //console.log('APPS:', apps);
    return (await response.json());
}