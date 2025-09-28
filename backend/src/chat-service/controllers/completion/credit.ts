import { v7 as uuidv7 } from 'uuid';
import { llmModels } from '../../../utils/model-list';
export function estimateTokens(text: string): number {
    // rough estimate: 1 token ≈ 4 chars
    const rough = Math.ceil(text.length / 4);
    // add 5% buffer
    return Math.ceil(rough * 1.02);
}

export function estimateToolsTokens(tools: object[]): number {
    const serialized = JSON.stringify(tools);
    return estimateTokens(serialized);
}
export function flattenForTokenCounting(messages: CustomMessage[]): string {
    const chunks: string[] = [];

    for (const m of messages) {
        if (m.role === "system" || m.role === "user" || m.role === "assistant" || m.role === "tool") {
            if (typeof m.content === "string") {
                chunks.push(m.content);
            } else if (Array.isArray(m.content)) {
                for (const item of m.content) {
                    if (typeof item === "string") {
                        chunks.push(item);
                    } else if (item.type === "text") {
                        chunks.push(item.text ?? "");
                    } else if (item.type === "file") {
                        // Only count if you actually inline file data
                        if (item.file?.file_data) chunks.push(item.file.file_data);
                    }
                    // skip image_url for tokens
                }
            }
        }

        if (m.role === "assistant" && Array.isArray((m as any).tool_calls)) {
            for (const tc of (m as any).tool_calls) {
                const a = tc?.function?.arguments;
                chunks.push(typeof a === "string" ? a : JSON.stringify(a ?? ""));
            }
        }

        if (m.role === "tool" && m.content) {
            if (typeof m.content === "string") chunks.push(m.content);
            else if (Array.isArray(m.content)) {
                chunks.push(
                    m.content.map((i: any) => (typeof i === "string" ? i : i?.text ?? "")).join(" ")
                );
            }
        }
    }

    return chunks.filter(Boolean).join(" ");
}
export function buildAndTrimMessages(
    history: CustomMessage[],
    role: "system" | "user" | "assistant" | "tool",
    userInput: MessageContentItem[] | string,
    tool_call_id?: string,
    limitTokens = 16000
): { messages: CustomMessage[]; tokenCount: number } {
    const systemMsg: CustomMessage = {
        role: "system",
        content: [
            {
                type: "text",
                text: `You are a helpful assistant. The current date ${new Date().toISOString()}. Answer based on this.`
            }
        ]
    };

    const newest: CustomMessage = tool_call_id
        ? { role, content: Array.isArray(userInput) ? userInput : [userInput], tool_call_id }
        : { role, content: Array.isArray(userInput) ? userInput : [userInput] };

    let messages: CustomMessage[] = [...history];

    let text = flattenForTokenCounting(messages);
    let count = estimateTokens(text);

    if (count <= limitTokens) return { messages, tokenCount: count };

    // trim oldest after system until under limit
    let i = 1;
    while (count > limitTokens && i < messages.length - 1) {
        const msg = messages[i];

        if (msg.role === "assistant" && Array.isArray((msg as any).tool_calls)) {
            // if next message is tool response, drop both
            if (messages[i + 1] && messages[i + 1].role === "tool") {
                messages.splice(i, 2);
            } else {
                messages.splice(i, 1);
            }
        } else {
            messages.splice(i, 1);
        }

        text = flattenForTokenCounting(messages);
        count = estimateTokens(text);
    }
    console.log('t', messages)

    return { messages, tokenCount: count };
}




export function estimateInputTokens(parts: any[]): number {
    const inputText = Array.isArray(parts) ? flattenForTokenCounting(parts) : String(parts ?? "");
    return estimateTokens(inputText) /* + overheadPerMessage * parts.length if desired */;
}



// output: model response
export function estimateOutputTokens(response: string): number {
    return estimateTokens(response);
}
export function calculateCredits(
    modelValue: string,
    inputParts: any[],
    outputText: string, tools: object[] = []
) {
    // console.log(inputParts, outputText);
    const model = llmModels.find(m => m.value === modelValue);
    if (!model) throw new Error("Model not found");

    const inputTokens = estimateInputTokens(inputParts);
    const outputTokens = estimateOutputTokens(outputText);
    const toolTokens = estimateToolsTokens(tools);

    const inputCreditsUsed = Math.ceil((inputTokens / 1000) * model.inputCredits);
    const outputCreditsUsed = Math.ceil((outputTokens / 1000) * model.outputCredits);
    const toolCreditsUsed = Math.ceil((toolTokens / 1000) * model.inputCredits);
    console.log(toolTokens, toolCreditsUsed)

    const totalCreditsUsed = inputCreditsUsed + outputCreditsUsed + toolCreditsUsed;

    return {
        model: model.label,
        inputTokens,
        outputTokens,
        inputCreditsUsed,
        outputCreditsUsed,
        totalCreditsUsed
    };
}

export async function deductCredits(
    db: any,
    uid: string,
    credits: number,
    metadata: Record<string, any> = {}
) {
    if (credits <= 0) throw new Error("credits must be > 0");
    console.log(credits)

    const creditsCol = db.collection("credits_info");
    const logsCol = db.collection("credit_logs");

    // 1) Load user doc
    const user = await creditsCol.findOne({ $or: [{ userId: uid }, { uid }] });
    if (!user) throw new Error("User not found");

    // 2) Compute split
    let remaining = credits;

    const takeFree = Math.min(remaining, Math.max(0, user.freeCredits.remaining));
    remaining -= takeFree;

    const takeReferral = Math.min(remaining, Math.max(0, user.referralCredits.remaining));
    remaining -= takeReferral;
    const takePlan = Math.min(remaining, Math.max(0, user.planCredits.remaining));
    remaining -= takePlan;

    const takeTopUp = Math.min(remaining, Math.max(0, user.topUpCredits.remaining));
    remaining -= takeTopUp;


    if (remaining > 0) throw new Error("Insufficient credits");

    // 3) Conditional atomic update
    const now = new Date();
    const updateRes = await creditsCol.updateOne(
        {
            _id: user._id,
            "freeCredits.remaining": { $gte: takeFree },
            "referralCredits.remaining": { $gte: takeReferral },
            "planCredits.remaining": { $gte: takePlan },
            "topUpCredits.remaining": { $gte: takeTopUp },
        },
        {
            $inc: {
                ...(takeFree
                    ? { "freeCredits.used": takeFree, "freeCredits.remaining": -takeFree }
                    : {}),
                ...(takeReferral
                    ? { "referralCredits.used": takeReferral, "referralCredits.remaining": -takeReferral }
                    : {}),
                ...(takePlan
                    ? { "planCredits.used": takePlan, "planCredits.remaining": -takePlan }
                    : {}),
                ...(takeTopUp
                    ? { "topUpCredits.used": takeTopUp, "topUpCredits.remaining": -takeTopUp }
                    : {}),
            },
            $set: { lastUpdated: now.toISOString() },
        }
    );

    if (updateRes.modifiedCount !== 1) {
        throw new Error("Concurrent update conflict. Try again.");
    }

    // 4) Read back new balances
    const afterDoc = await creditsCol.findOne({ _id: user._id });
    if (!afterDoc) throw new Error("Post-update read failed");

    // 5) Prepare logs for each deduction
    const logs: any[] = [];

    if (takeFree > 0) {
        logs.push({
            logId: uuidv7(),
            userId: uid,
            event: "deduct",
            source: "freeCredits",
            creditsDelta: -takeFree,
            creditsBefore: user.freeCredits.remaining,
            creditsAfter: afterDoc.freeCredits.remaining,
            metadata,
            timestamp: now.toISOString(),
        });
    }

    if (takePlan > 0) {
        logs.push({
            logId: uuidv7(),
            userId: uid,
            event: "deduct",
            source: "planCredits",
            creditsDelta: -takePlan,
            creditsBefore: user.planCredits.remaining,
            creditsAfter: afterDoc.planCredits.remaining,
            metadata,
            timestamp: now.toISOString(),
        });
    }
    if (takeTopUp > 0) {
        logs.push({
            logId: uuidv7(),
            userId: uid,
            event: "deduct",
            source: "topUpCredits",
            creditsDelta: -takeTopUp,
            creditsBefore: user.topUpCredits.remaining,
            creditsAfter: afterDoc.topUpCredits.remaining,
            metadata,
            timestamp: now.toISOString(),
        });
    }

    if (takeReferral > 0) {
        logs.push({
            logId: uuidv7(),
            userId: uid,
            event: "deduct",
            source: "referralCredits",
            creditsDelta: -takeReferral,
            creditsBefore: user.referralCredits.remaining,
            creditsAfter: afterDoc.referralCredits.remaining,
            metadata,
            timestamp: now.toISOString(),
        });
    }

    if (logs.length > 0) {
        await logsCol.insertMany(logs);
    }
    console.log(logs)

    return {
        deducted: { free: takeFree, plan: takePlan, referral: takeReferral },
        remaining: {
            freeRemainingToday: afterDoc.freeCredits.remaining,
            planRemaining: afterDoc.planCredits.remaining,
            referralRemaining: afterDoc.referralCredits.remaining,
        },
        lastUpdated: afterDoc.lastUpdated,
    };
}