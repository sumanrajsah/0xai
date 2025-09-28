import { convertToOpenAIFormat } from "./response";

type ModelName = "gpt-4o-mini" | "gpt-4o";


export const llmModels = ['gpt-5-nano', 'gpt-4.1-nano', 'mistral-small-2503', 'ministral-3b', 'grok-3-mini', 'mistral-nemo', 'phi-4-mini-reasoning', 'gpt-4o-mini'];

export function isModelAvailable(modelValue: string): boolean {
    return llmModels.includes(modelValue);
}



export async function getAiModels(modelName: ModelName, messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content?: MessageContentItem[]; name?: string; tool_calls?: any[]; tool_call_id?: string }>, tools: any[], temperature: any, top_p: any, frequency_penalty: any, presence_penalty: any, supportsMedia: boolean) {
    const apiKey1 = process.env.AZURE_OPENAI_API_KEY;
    const apiKey2 = process.env.AZURE_OPENAI_API_KEY2;
    const apiKeyLlamaM = process.env.AZURE_OPENAI_API_KEY_Llama_M;
    const apiKeyLlamaS = process.env.AZURE_OPENAI_API_KEY_Llama_S;
    const apiKeyGemini = process.env.GEMINI_API_KEY;

    const messagedata = await convertToOpenAIFormat(messages, supportsMedia);
    // console.log(messagedata)

    if (!apiKey1 || !apiKey2 || !apiKeyLlamaM || !apiKeyLlamaS || !apiKeyGemini) {
        throw new Error("Azure OpenAI API key is missing!");
    }
    const models = {
        "ai21-jamba-1.5-large": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "AI21-Jamba-1.5-Large",

                // tools: [generate_image, ...tools],
            }, apiKey: apiKey2
        },
        "codestral-2501-2": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Codestral-2501-2",

                tools: [...tools],
            }, apiKey: apiKey2
        },
        "codex-mini": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/openai/v1/responses?api-version=preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "codex-mini",

                // tools: [generate_image, ...tools],
            }, apiKey: apiKey2
        },
        "cohere-command-a": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "cohere-command-a",
                tools: [...tools],
            }, apiKey: apiKey2
        },
        "cohere-command-r-plus-08-2024": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "cohere-command-r-plus-08-2024",

                tools: [...tools],
            }, apiKey: apiKey2
        },
        "cohere-command-r-08-2024": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "cohere-command-r-08-2024",

                tools: [...tools],
            }, apiKey: apiKey2
        },
        "deepseek-r1": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "deepseek-r1",

                // tools: [generate_image, ...tools],
            }, apiKey: apiKey2
        },
        "deepseek-r1-0528": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "deepseek-r1-0528",

                // tools: [generate_image, ...tools],
            }, apiKey: apiKey2
        },
        "deepseek-v3": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "deepseek-v3",
                // tools: [generate_image, ...tools],
            }, apiKey: apiKey2
        },
        "deepseek-v3-0324": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "deepseek-v3-0324",
                // tools: [generate_image, ...tools],
            }, apiKey: apiKey2
        },
        "gemini-2.0-flash": {
            url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            provider: 'google',
            payload: {
                messages: messagedata,
                stream: true,

                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gemini-2.0-flash",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
            }, apiKey: apiKeyGemini
        },
        "gemini-2.0-flash-lite": {
            url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            provider: 'google',
            payload: {
                messages: messagedata,
                stream: true,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gemini-2.0-flash-lite",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
            }, apiKey: apiKeyGemini
        },
        "gemini-2.5-pro": {
            url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            provider: 'google',
            payload: {
                messages: messagedata,
                stream: true,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gemini-2.5-pro",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
            }, apiKey: apiKeyGemini
        },
        "gemini-2.5-flash": {
            url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            provider: 'google',
            payload: {
                messages: messagedata,
                stream: true,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "gemini-2.5-flash",
                tools: [...tools],
                ...(tools && tools.length > 0 ? { tool_choice: "auto" } : {}),
            }, apiKey: apiKeyGemini
        },
        "gpt-4o": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
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
                stream: true,
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
                stream: true,
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
                stream: true,
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
                stream: true,
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
                stream: true,
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
                stream: true,
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
                stream: true,

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
                stream: true,
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
        "grok-3-mini": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                temperature: temperature,
                top_p: top_p,
                model: "grok-3-mini",
                tools: [...tools],
            }, apiKey: apiKey2
        },
        "grok-3": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,
                temperature: temperature,
                top_p: top_p,
                model: "grok-3",
                tools: [...tools],
            }, apiKey: apiKey2
        },

        "llama-3.3-70b-instruct": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Llama-3.3-70B-Instruct",
                // tools: [ ...tools],
            }, apiKey: apiKey2
        },
        "llama-3.1-405b": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Meta-Llama-3.1-405B-Instruct",
                // tools: [ ...tools],
            }, apiKey: apiKey2
        },
        "llama-4-Maverick-17B-128E": {
            url: "https://Llama-4-Maverick-17B-128E-sitrai.eastus2.models.ai.azure.com/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Llama-4-Maverick-17B-128E-sitrai",
                // tools: [ ...tools],
            }, apiKey: apiKeyLlamaM
        },
        "llama-4-Scout-17B-16E": {
            url: "https://Llama-4-Scout-17B-16E-I-sitrai.eastus2.models.ai.azure.com/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Llama-4-Scout-17B-16E-I-sitrai",
                // tools: [ ...tools],
            }, apiKey: apiKeyLlamaS
        },
        "mai-ds-r1": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                model: "MAI-DS-R1",
                // tools: [ ...tools],
            }, apiKey: apiKey2
        },
        "ministral-3b": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Ministral-3B",
                tools: [...tools],
            }, apiKey: apiKey2
        },
        "mistral-medium-2505": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Mistral-Medium-2505",
                tools: [...tools],
            }, apiKey: apiKey2
        },
        "mistral-nemo": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Mistral-Nemo",
                tools: [...tools],
            }, apiKey: apiKey2
        },
        "mistral-small-2503": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Mistral-Small-2503",
                tools: [...tools],
            }, apiKey: apiKey2
        },
        "mistral-large-2411": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Mistral-Large-2411",
                tools: [...tools],
            }, apiKey: apiKey2
        },
        "o1": {
            url: "https://ai-rsuman7868-8048.openai.azure.com/openai/deployments/o1/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                presence_penalty: presence_penalty,
                model: "o1",
                tools: [...tools],
            }, apiKey: apiKey2
        },
        "o1-mini": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/o1-mini/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                presence_penalty: presence_penalty,
                model: "o1-mini",
                tools: [...tools],
            }, apiKey: apiKey1
        },
        "o3-mini": {
            url: "https://ai-rsuman7868-8048.openai.azure.com/openai/deployments/o3-mini/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                presence_penalty: presence_penalty,
                model: "o3-mini",
                tools: [...tools],
            }, apiKey: apiKey2
        },
        "o4-mini": {
            url: "https://ai-rsuman78689277ai911734052583.openai.azure.com/openai/deployments/o4-mini/chat/completions?api-version=2025-01-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                presence_penalty: presence_penalty,

                temperature: 1,
                model: "o4-mini",
                tools: [...tools],
                // reasoning_effort: 'high'
            }, apiKey: apiKey1
        },
        "phi-4": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,

                temperature: temperature,
                top_p: top_p,
                model: "Phi-4",
                // tools: [ ...tools],
                //reasoning_effort: 'high'
            }, apiKey: apiKey2
        },
        "phi-4-mini-reasoning": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,
                model: "Phi-4-mini-reasoning",
                // tools: [ ...tools],
                //reasoning_effort: 'high'
            }, apiKey: apiKey2
        },
        "phi-4-reasoning": {
            url: "https://ai-rsuman7868-8048.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
            provider: 'azure',
            payload: {
                messages: messagedata,
                stream: true,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty,
                model: "Phi-4-reasoning",
                // tools: [ ...tools],
                //reasoning_effort: 'high'
            }, apiKey: apiKey2
        },

    };

    if (!models[modelName]) throw new Error(`Model "${modelName}" not found.`);
    return models[modelName];
}