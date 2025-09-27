import axios from 'axios';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import textract from 'textract';
import { promisify } from 'util';

// Promisify textract for better async handling
const textractFromFile = promisify(textract.fromFileWithPath);

interface ExtractionOptions {
    maxFileSize?: number; // in bytes
    timeout?: number; // in milliseconds
    preserveFormatting?: boolean;
}

interface ExtractionResult {
    content: string;
    metadata: {
        fileSize: number;
        fileType: string;
        extractionTime: number;
        wordCount: number;
    };
}

/**
 * Downloads a file temporarily and returns its local path
 */
const downloadFile = async (url: string, options: ExtractionOptions = {}): Promise<string> => {
    const { maxFileSize = 50 * 1024 * 1024, timeout = 30000 } = options; // 50MB default, 30s timeout

    const tempPath = path.join(__dirname, `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.tmp`);
    const writer = fs.createWriteStream(tempPath);

    try {
        const response = await axios.get(url, {
            responseType: 'stream',
            timeout,
            maxContentLength: maxFileSize,
            maxBodyLength: maxFileSize
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            let downloadedBytes = 0;

            response.data.on('data', (chunk: Buffer) => {
                downloadedBytes += chunk.length;
                if (downloadedBytes > maxFileSize) {
                    writer.destroy();
                    reject(new Error(`File too large: ${downloadedBytes} bytes exceeds limit of ${maxFileSize} bytes`));
                }
            });

            writer.on('finish', () => {
                const stats = fs.statSync(tempPath);
                if (stats.size === 0) {
                    reject(new Error('Downloaded file is empty'));
                } else {
                    resolve(tempPath);
                }
            });

            writer.on('error', reject);
            response.data.on('error', reject);
        });
    } catch (error) {
        // Clean up on error
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        throw error;
    }
};

function cleanText(text: string, preserveFormatting = false): string {
    if (preserveFormatting) {
        return text.trim();
    }

    return text
        .replace(/[ \t]+\n/g, '\n')           // Remove trailing spaces before newlines
        .replace(/\n{3,}/g, '\n\n')          // Collapse multiple newlines to max 2
        .replace(/[ \t]{2,}/g, ' ')          // Collapse multiple spaces/tabs to single space
        .replace(/\r\n/g, '\n')              // Normalize line endings
        .replace(/\r/g, '\n')                // Handle old Mac line endings
        .trim();
}

/**
 * Extract content from any file type with enhanced error handling
 */
export const extractFileData = async (
    filePath: string,
    ext: string,
    options: ExtractionOptions = {}
): Promise<ExtractionResult> => {
    const startTime = Date.now();
    const stats = fs.statSync(filePath);
    let content = '';

    try {
        switch (ext.toLowerCase()) {
            case '.pdf':
                const dataBuffer = fs.readFileSync(filePath);
                const pdf = await pdfParse(dataBuffer);
                content = pdf.text;
                break;

            case '.docx':
                const result = await mammoth.extractRawText({ path: filePath });
                content = result.value;
                if (result.messages && result.messages.length > 0) {
                    console.warn('DOCX extraction warnings:', result.messages);
                }
                break;

            case '.doc':
                // Use textract for older .doc files
                content = await textractFromFile(filePath) as string;
                break;

            case '.xls':
            case '.xlsx':
                const workbook = XLSX.readFile(filePath);
                const sheets = workbook.SheetNames.map(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_csv(sheet);
                    return `=== Sheet: ${sheetName} ===\n${data}`;
                });
                content = sheets.join('\n\n');
                break;

            case '.csv':
                content = fs.readFileSync(filePath, 'utf8');
                break;

            case '.txt':
            case '.md':
            case '.html':
            case '.htm':
            case '.json':
            case '.js':
            case '.ts':
            case '.xml':
                content = fs.readFileSync(filePath, 'utf8');
                break;

            case '.rtf':
            case '.odt':
            case '.pptx':
            case '.ppt':
                // Use textract for these formats
                content = await textractFromFile(filePath) as string;
                break;

            default:
                // Try reading as text first
                try {
                    content = fs.readFileSync(filePath, 'utf8');
                } catch {
                    // Fallback to textract for binary files
                    content = await textractFromFile(filePath) as string;
                }
        }

        const cleanedContent = cleanText(content, options.preserveFormatting);
        const extractionTime = Date.now() - startTime;
        const wordCount = cleanedContent.split(/\s+/).filter(word => word.length > 0).length;

        return {
            content: cleanedContent,
            metadata: {
                fileSize: stats.size,
                fileType: ext,
                extractionTime,
                wordCount
            }
        };

    } catch (error) {
        throw new Error(`Failed to extract content from ${ext} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Validate URL format
 */
const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Get file extension from URL, handling query parameters
 */
const getFileExtension = (url: string): string => {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const ext = path.extname(pathname).toLowerCase();

        // If no extension in path, try to extract from filename parameter
        if (!ext && urlObj.searchParams.has('filename')) {
            const filename = urlObj.searchParams.get('filename');
            return filename ? path.extname(filename).toLowerCase() : '';
        }

        return ext;
    } catch {
        return path.extname(url).toLowerCase();
    }
};

/**
 * Main handler that takes a file URL, extracts readable content with metadata
 */
export const handleDataExtraction = async (
    url: string,
    options: ExtractionOptions = {}
): Promise<ExtractionResult> => {
    // Validate input
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
    }

    if (!isValidUrl(url)) {
        throw new Error('Invalid URL format');
    }

    const ext = getFileExtension(url);
    if (!ext) {
        throw new Error('Cannot determine file type from URL');
    }

    let tempFile: string | null = null;

    try {
        tempFile = await downloadFile(url, options);
        return await extractFileData(tempFile, ext, options);
    } finally {
        // Cleanup temporary file
        if (tempFile && fs.existsSync(tempFile)) {
            try {
                fs.unlinkSync(tempFile);
            } catch (error) {
                console.warn(`Failed to cleanup temporary file ${tempFile}:`, error);
            }
        }
    }
};

/**
 * Batch process multiple URLs
 */
export const handleBatchDataExtraction = async (
    urls: string[],
    options: ExtractionOptions = {}
): Promise<Array<{ url: string; result?: ExtractionResult; error?: string }>> => {
    const results = await Promise.allSettled(
        urls.map(url => handleDataExtraction(url, options))
    );

    return results.map((result, index) => ({
        url: urls[index],
        ...(result.status === 'fulfilled'
            ? { result: result.value }
            : { error: result.reason?.message || 'Unknown error' }
        )
    }));
};

// Export types for external use
export type { ExtractionOptions, ExtractionResult };