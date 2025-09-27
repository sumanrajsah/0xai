import { getLLMParamsByStyle } from '@/app/utils/models-list';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type LLMStyleStore = {
    selectedStyle: string;
    temperature: number;
    frequency_penalty: number;
    presence_penalty: number;
    top_p: number;
    setStyle: (style: string) => void;
};

export const useLLMStyleStore = create<LLMStyleStore>()(
    persist(
        (set) => ({
            selectedStyle: 'Formal',
            temperature: getLLMParamsByStyle('Formal').temperature,
            top_p: getLLMParamsByStyle('Formal').top_p,
            frequency_penalty: getLLMParamsByStyle('Formal').frequency_penalty,
            presence_penalty: getLLMParamsByStyle('Formal').presence_penalty,
            setStyle: (style) => {
                const { temperature, top_p, frequency_penalty, presence_penalty } = getLLMParamsByStyle(style);
                set({ selectedStyle: style, temperature, top_p, frequency_penalty, presence_penalty });
            },
        }),
        {
            name: 'LLMStyle-settings',
        }
    )
);
