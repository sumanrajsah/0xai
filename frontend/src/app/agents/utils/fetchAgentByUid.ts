export const fetchAgentsByUID = async (uid: string) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/v1/agents/uid/${uid}`, {
            method: 'GET',
            credentials: 'include', // include cookies if using auth
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch agents');
        }

        return {
            success: true,
            agents: data.agents,
        };
    } catch (error: any) {
        // console.error('Error fetching agents:', error.message);
        return {
            success: false,
            error: error.message,
            agents: [],
        };
    }
};