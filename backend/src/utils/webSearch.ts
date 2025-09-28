import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from 'dotenv';
dotenv.config();

type SearchResult = {
    title: string;
    snippet: string;
    url: string;
    content?: string; // full crawled text
};
export async function searchWeb(
    query: string,
    limit = 10
): Promise<{ title: string; url: string; snippet: string; content: string }[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;  // set in .env
    const cx = process.env.GOOGLE_CX;           // Search Engine ID

    if (!apiKey || !cx) {
        return [{
            title: "Error",
            url: "",
            snippet: "Google API key or CX (Search Engine ID) is missing",
            content: "Google API key or CX (Search Engine ID) is missing"
        }];
    }

    try {
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}&num=${limit}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return [{
                title: "Error",
                url: "",
                snippet: `HTTP error! Status: ${response.status}`,
                content: `HTTP error! Status: ${response.status}`
            }];
        }

        const data = await response.json();
        return data.items?.map((item: any) => ({
            title: item.title,
            url: item.link,
            snippet: item.snippet,
        })) ?? [];
    } catch (error) {
        return [{
            title: "Error",
            url: "",
            snippet: (error as Error).message,
            content: (error as Error).message
        }];
    }
}



async function crawlPage(url: string): Promise<string> {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    return $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);
}


export async function Search(input: { query?: string; link?: string }): Promise<SearchResult[]> {
    let results: SearchResult[] = [];

    // If query present → do search
    if (input.query) {
        const searchResults = await searchWeb(input.query);
        // crawl top 2
        // for (let i = 0; i < Math.min(2, searchResults.length); i++) {
        //     try {
        //         searchResults[i].content = await crawlPage(searchResults[i].url);
        //     } catch {
        //         searchResults[i].content = "Failed to crawl";
        //     }
        // }
        results = results.concat(searchResults);
    }

    // If link present → crawl directly
    if (input.link) {
        try {
            const content = await crawlPage(input.link);
            results.push({
                title: "Direct page",
                snippet: content.slice(0, 200),
                url: input.link,
                content
            });
        } catch {
            results.push({ title: "Direct page", snippet: "Failed to crawl", url: input.link });
        }
    }

    return results;
}

export const web_search = {
    type: "function" as const,
    function: {
        name: "web_search",
        description:
            "Search the web for information or crawl a specific webpage. Use this tool when the user asks for information requiring up-to-date data or from a provided URL.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description:
                        "The search query to look up on the web. Example: 'latest Ethereum ETF approval news'.",
                },
                link: {
                    type: "string",
                    description:
                        "A direct URL to crawl and extract text content from. Example: 'https://example.com/article'.",
                },
            },
            required: [],
        },
    },
};
