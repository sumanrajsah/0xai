import { convertToOpenAIFormat } from "./response";



type ModelName = "gpt-4o-mini" | "gpt-4o";


export async function getAiModels(modelName: ModelName, messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content?: MessageContentItem[]; name?: string; tool_calls?: any[]; tool_call_id?: string }>, tools: any[], temperature: any, top_p: any, frequency_penalty: any, presence_penalty: any, supportsMedia: boolean) {
    const apiKey1 = process.env.AZURE_OPENAI_API_KEY;
    const apiKey2 = process.env.AZURE_OPENAI_API_KEY2;

    const messagedata = await convertToOpenAIFormat(messages, supportsMedia);
    // console.log(messagedata)

    if (!apiKey1 || !apiKey2) {
        throw new Error("Azure OpenAI API key is missing!");
    }
    const models = {
        "gpt-4o": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gpt-4o",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
                // parallel_tool_calls: true
            }, apiKey: apiKey1
        },
        "gpt-4o-mini": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gpt-4o-mini",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
                // parallel_tool_calls: true
            }, apiKey: apiKey1
        },
        "gpt-4.1": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gpt-4.1",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
                // parallel_tool_calls: true
            }, apiKey: apiKey1
        },
        "gpt-4.1-mini": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/gpt-4.1-mini/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gpt-4.1-mini",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
                // parallel_tool_calls: true
            }, apiKey: apiKey1
        },
        "gpt-4.1-nano": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/gpt-4.1-nano/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gpt-4.1-nano",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
                // parallel_tool_calls: true
            }, apiKey: apiKey1
        },
        "gpt-5": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/gpt-5-chat/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gpt-5-chat",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
                // parallel_tool_calls: true
            }, apiKey: apiKey1
        },
        "gpt-5-mini": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/gpt-5-mini/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                temperature: 1,
                model: "gpt-5-mini",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
                // parallel_tool_calls: true
            }, apiKey: apiKey1
        },
        "gpt-5-nano": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/gpt-5-nano/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,

                temperature: 1,
                model: "gpt-5-nano",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
                // parallel_tool_calls: true
            }, apiKey: apiKey1
        },
        "gpt-oss-120b": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gpt-oss-120b",
                tools: [...tools],
                //tool_choice: 'auto',
                // parallel_tool_calls: true
            }, apiKey: apiKey2
        },

    };

    if (!models[modelName]) throw new Error(`Model "${modelName}" not found.`);
    return models[modelName];
}