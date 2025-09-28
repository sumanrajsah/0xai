export const llmModels = [
    { value: "codestral-2501-2", label: "Codestral 2501", tools: true, mediaSupport: false, inputCredits: 3, outputCredits: 9 },

    { value: "cohere-command-a", label: "Cohere Command A", tools: true, mediaSupport: false, inputCredits: 30, outputCredits: 105 },
    { value: "cohere-command-r-08-2024", label: "Cohere Command R", tools: true, mediaSupport: false, inputCredits: 5, outputCredits: 10 },
    { value: "cohere-command-r-plus-08-2024", label: "Cohere Command R+", tools: true, mediaSupport: false, inputCredits: 30, outputCredits: 105 },

    { value: "deepseek-r1", label: "DeepSeek R1", tools: false, mediaSupport: false, inputCredits: 15, outputCredits: 59 },
    { value: "deepseek-r1-0528", label: "DeepSeek R1 0528", tools: false, mediaSupport: false, inputCredits: 15, outputCredits: 59 },
    { value: "deepseek-v3", label: "DeepSeek V3", tools: false, mediaSupport: false, inputCredits: 12, outputCredits: 50 },
    { value: "deepseek-v3-0324", label: "DeepSeek V3 0324", tools: false, mediaSupport: false, inputCredits: 12, outputCredits: 50 },

    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", tools: true, mediaSupport: true, inputCredits: 1, outputCredits: 8 },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", tools: true, mediaSupport: true, inputCredits: 1, outputCredits: 8 },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", tools: true, mediaSupport: true, inputCredits: 30, outputCredits: 158 },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", tools: true, mediaSupport: true, inputCredits: 3, outputCredits: 25 },

    { value: "gpt-4o-mini", label: "GPT 4o Mini", tools: true, mediaSupport: true, inputCredits: 5, outputCredits: 10 },
    { value: "gpt-4o", label: "GPT 4o", tools: true, mediaSupport: true, inputCredits: 30, outputCredits: 105 },
    { value: "gpt-4.1-mini", label: "GPT 4.1 Mini", tools: true, mediaSupport: true, inputCredits: 4, outputCredits: 16 },
    { value: "gpt-4.1-nano", label: "GPT 4.1 Nano", tools: true, mediaSupport: true, inputCredits: 1, outputCredits: 4 },
    { value: "gpt-4.1", label: "GPT 4.1", tools: true, mediaSupport: true, inputCredits: 24, outputCredits: 96 },
    { value: "gpt-5-mini", label: "GPT 5 Mini", tools: true, mediaSupport: true, inputCredits: 4, outputCredits: 19 },
    { value: "gpt-5-nano", label: "GPT 5 Nano", tools: true, mediaSupport: true, inputCredits: 1, outputCredits: 4 },
    { value: "gpt-5", label: "GPT 5", tools: true, mediaSupport: true, inputCredits: 12, outputCredits: 50 },
    { value: "gpt-oss-120b", label: "GPT OSS 120B", tools: true, mediaSupport: false, inputCredits: 4, outputCredits: 19 },

    { value: "grok-3-mini", label: "Grok 3 Mini", tools: true, mediaSupport: false, inputCredits: 3, outputCredits: 4 },
    { value: "grok-3", label: "Grok 3", tools: true, mediaSupport: false, inputCredits: 36, outputCredits: 180 },

    { value: "llama-3.1-405b", label: "Llama 3.1 405B", tools: false, mediaSupport: false, inputCredits: 64, outputCredits: 216 },
    { value: "llama-4-Maverick-17B-128E", label: "Llama 4 Maverick", tools: false, mediaSupport: true, inputCredits: 7, outputCredits: 12 },
    { value: "llama-4-Scout-17B-16E", label: "Llama 4 Scout", tools: false, mediaSupport: true, inputCredits: 3, outputCredits: 11 },

    { value: "mai-ds-r1", label: "MAI DeepSeek R1", tools: false, mediaSupport: true, inputCredits: 15, outputCredits: 59 },

    { value: "ministral-3b", label: "Ministral 3B", tools: true, mediaSupport: false, inputCredits: 1, outputCredits: 1 },
    { value: "mistral-large-2411", label: "Mistral Large 2411", tools: true, mediaSupport: false, inputCredits: 24, outputCredits: 72 },
    { value: "mistral-medium-2505", label: "Mistral Medium 2505", tools: true, mediaSupport: false, inputCredits: 4, outputCredits: 19 },
    { value: "mistral-small-2503", label: "Mistral Small 2503", tools: true, mediaSupport: false, inputCredits: 1, outputCredits: 4 },
    { value: "mistral-nemo", label: "Mistral Nemo", tools: true, mediaSupport: false, inputCredits: 2, outputCredits: 2 },

    { value: "o3-mini", label: "O3 Mini", tools: true, mediaSupport: true, inputCredits: 11, outputCredits: 44 },
    { value: "o4-mini", label: "O4 Mini", tools: true, mediaSupport: true, inputCredits: 11, outputCredits: 44 },
    { value: "o1", label: "O1", tools: true, temperature: false, topP: false, mediaSupport: true, inputCredits: 180, outputCredits: 720 },

    { value: "phi-4", label: "Phi 4", tools: false, mediaSupport: false, inputCredits: 2, outputCredits: 5 },
    { value: "phi-4-mini-reasoning", label: "Phi 4 Mini Reasoning", tools: false, mediaSupport: false, inputCredits: 1, outputCredits: 4 },
    { value: "phi-4-reasoning", label: "Phi 4 Reasoning", tools: false, mediaSupport: false, inputCredits: 2, outputCredits: 5 }
];