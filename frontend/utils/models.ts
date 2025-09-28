export const llmModels = [
    { value: "codestral-2501-2", label: "Codestral 2501", tools: true, mediaSupport: false, inputCredits: 3, outputCredits: 9, cw: 256 },

    { value: "cohere-command-a", label: "Cohere Command A", tools: true, mediaSupport: false, inputCredits: 30, outputCredits: 105, cw: 256 },
    { value: "cohere-command-r-08-2024", label: "Cohere Command R", tools: true, mediaSupport: false, inputCredits: 5, outputCredits: 10, cw: 128 },
    { value: "cohere-command-r-plus-08-2024", label: "Cohere Command R+", tools: true, mediaSupport: false, inputCredits: 30, outputCredits: 105, cw: 128 },

    { value: "deepseek-r1", label: "DeepSeek R1", tools: false, mediaSupport: false, inputCredits: 15, outputCredits: 59, cw: 128 },
    { value: "deepseek-r1-0528", label: "DeepSeek R1 0528", tools: false, mediaSupport: false, inputCredits: 15, outputCredits: 59, cw: 128 },
    { value: "deepseek-v3", label: "DeepSeek V3", tools: false, mediaSupport: false, inputCredits: 12, outputCredits: 50, cw: 128 },
    { value: "deepseek-v3-0324", label: "DeepSeek V3 0324", tools: false, mediaSupport: false, inputCredits: 12, outputCredits: 50, cw: 128 },

    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", tools: true, mediaSupport: true, inputCredits: 1, outputCredits: 8, cw: 1048 },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", tools: true, mediaSupport: true, inputCredits: 1, outputCredits: 8, cw: 1048 },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", tools: true, mediaSupport: true, inputCredits: 30, outputCredits: 158, cw: 1048 },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", tools: true, mediaSupport: true, inputCredits: 3, outputCredits: 25, cw: 1048 },

    { value: "gpt-4o-mini", label: "GPT 4o Mini", tools: true, mediaSupport: true, inputCredits: 5, outputCredits: 10, cw: 128 },
    { value: "gpt-4o", label: "GPT 4o", tools: true, mediaSupport: true, inputCredits: 30, outputCredits: 105, cw: 128 },
    { value: "gpt-4.1-mini", label: "GPT 4.1 Mini", tools: true, mediaSupport: true, inputCredits: 4, outputCredits: 16, cw: 1048 },
    { value: "gpt-4.1-nano", label: "GPT 4.1 Nano", tools: true, mediaSupport: true, inputCredits: 1, outputCredits: 4, cw: 1048 },
    { value: "gpt-4.1", label: "GPT 4.1", tools: true, mediaSupport: true, inputCredits: 24, outputCredits: 96, cw: 1048 },
    { value: "gpt-5-mini", label: "GPT 5 Mini", tools: true, mediaSupport: true, inputCredits: 4, outputCredits: 19, cw: 400 },
    { value: "gpt-5-nano", label: "GPT 5 Nano", tools: true, mediaSupport: true, inputCredits: 1, outputCredits: 4, cw: 400 },
    { value: "gpt-5", label: "GPT 5", tools: true, mediaSupport: true, inputCredits: 12, outputCredits: 50, cw: 128 },
    { value: "gpt-oss-120b", label: "GPT OSS 120B", tools: true, mediaSupport: false, inputCredits: 4, outputCredits: 19, cw: 131 },

    { value: "grok-3-mini", label: "Grok 3 Mini", tools: true, mediaSupport: false, inputCredits: 3, outputCredits: 4, cw: 131 },
    { value: "grok-3", label: "Grok 3", tools: true, mediaSupport: false, inputCredits: 36, outputCredits: 180, cw: 131 },

    { value: "llama-3.1-405b", label: "Llama 3.1 405B", tools: false, mediaSupport: false, inputCredits: 64, outputCredits: 216, cw: 128 },
    { value: "llama-4-Maverick-17B-128E", label: "Llama 4 Maverick", tools: false, mediaSupport: true, inputCredits: 7, outputCredits: 12, cw: 1048 },
    { value: "llama-4-Scout-17B-16E", label: "Llama 4 Scout", tools: false, mediaSupport: true, inputCredits: 3, outputCredits: 11, cw: 10048 },

    { value: "mai-ds-r1", label: "MAI DeepSeek R1", tools: false, mediaSupport: true, inputCredits: 15, outputCredits: 59, cw: 128 },

    { value: "ministral-3b", label: "Ministral 3B", tools: true, mediaSupport: false, inputCredits: 1, outputCredits: 1, cw: 128 },
    { value: "mistral-large-2411", label: "Mistral Large 2411", tools: true, mediaSupport: false, inputCredits: 24, outputCredits: 72, cw: 128 },
    { value: "mistral-medium-2505", label: "Mistral Medium 2505", tools: true, mediaSupport: false, inputCredits: 4, outputCredits: 19, cw: 128 },
    { value: "mistral-small-2503", label: "Mistral Small 2503", tools: true, mediaSupport: false, inputCredits: 1, outputCredits: 4, cw: 128 },
    { value: "mistral-nemo", label: "Mistral Nemo", tools: true, mediaSupport: false, inputCredits: 2, outputCredits: 2, cw: 128 },

    { value: "o3-mini", label: "O3 Mini", tools: true, mediaSupport: true, inputCredits: 11, outputCredits: 44, cw: 200 },
    { value: "o4-mini", label: "O4 Mini", tools: true, mediaSupport: true, inputCredits: 11, outputCredits: 44, cw: 128 },
    { value: "o1", label: "O1", tools: true, temperature: false, topP: false, mediaSupport: true, inputCredits: 180, outputCredits: 720, cw: 128 },

    { value: "phi-4", label: "Phi 4", tools: false, mediaSupport: false, inputCredits: 2, outputCredits: 5, cw: 16 },
    { value: "phi-4-mini-reasoning", label: "Phi 4 Mini Reasoning", tools: false, mediaSupport: false, inputCredits: 1, outputCredits: 4, cw: 16 },
    { value: "phi-4-reasoning", label: "Phi 4 Reasoning", tools: false, mediaSupport: false, inputCredits: 2, outputCredits: 5, cw: 16 },
];

export function getMediaSupportByModelName(modelValue: string): boolean {
    const model = llmModels.find(m => m.value === modelValue);
    return model ? model.mediaSupport : false;
}
export function getTools(value: string) {
    const model = llmModels.find(m => m.value === value);
    return model ? model.tools : undefined;
}

interface LLMStyleParams {
    temperature: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
}

const styleConfig: Record<string, LLMStyleParams> = {
    "Formal": {
        temperature: 0.2,
        top_p: 0.7,
        frequency_penalty: 0.1,
        presence_penalty: 0.0
    },
    "Informal": {
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.1
    },
    "Polite": {
        temperature: 0.3,
        top_p: 0.8,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
    },
    "Sarcastic": {
        temperature: 1.0,
        top_p: 1.0,
        frequency_penalty: 0.2,
        presence_penalty: 0.3
    },
    "Humorous": {
        temperature: 1.0,
        top_p: 1.0,
        frequency_penalty: 0.3,
        presence_penalty: 0.2
    },
    "Empathetic": {
        temperature: 0.6,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.1
    },
    "Neutral": {
        temperature: 0.2,
        top_p: 0.7,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
    },
    "Authoritative": {
        temperature: 0.3,
        top_p: 0.75,
        frequency_penalty: 0.1,
        presence_penalty: 0.0
    },
    "Optimistic": {
        temperature: 0.6,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.1
    },
    "Pessimistic": {
        temperature: 0.4,
        top_p: 0.8,
        frequency_penalty: 0.1,
        presence_penalty: 0.0
    },
    "BulletPoints": {
        temperature: 0.3,
        top_p: 0.7,
        frequency_penalty: 0.2,
        presence_penalty: 0.0
    },
    "StepByStep": {
        temperature: 0.4,
        top_p: 0.75,
        frequency_penalty: 0.1,
        presence_penalty: 0.0
    },
    "Concise": {
        temperature: 0.3,
        top_p: 0.7,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
    },
    "Detailed": {
        temperature: 0.5,
        top_p: 0.85,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
    },
    "Storytelling": {
        temperature: 0.9,
        top_p: 0.95,
        frequency_penalty: 0.3,
        presence_penalty: 0.2
    },
    "Metaphor": {
        temperature: 0.9,
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.3
    },
    "Poetic": {
        temperature: 0.9,
        top_p: 0.95,
        frequency_penalty: 0.4,
        presence_penalty: 0.2
    },
    "Philosophical": {
        temperature: 0.8,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
    },
    "Technical": {
        temperature: 0.2,
        top_p: 0.7,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
    },
    "Teacher": {
        temperature: 0.4,
        top_p: 0.75,
        frequency_penalty: 0.1,
        presence_penalty: 0.0
    },
    "SupportAgent": {
        temperature: 0.3,
        top_p: 0.75,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
    },
    "Motivational": {
        temperature: 0.8,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.2
    },
    "Comedian": {
        temperature: 1.0,
        top_p: 1.0,
        frequency_penalty: 0.4,
        presence_penalty: 0.3
    },
    "Journalist": {
        temperature: 0.3,
        top_p: 0.7,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
    },
    "LegalAdvisor": {
        temperature: 0.2,
        top_p: 0.7,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
    },
    "Doctor": {
        temperature: 0.2,
        top_p: 0.7,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
    },
    "StreetSlang": {
        temperature: 0.9,
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.4
    }
};

export function getLLMParamsByStyle(style: string): LLMStyleParams {
    return styleConfig[style] || { temperature: 0.7, top_p: 0.9 };  // Default to balanced
}
export function getAllLLMStyles(): string[] {
    return Object.keys(styleConfig);
}