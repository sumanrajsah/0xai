import { Request, Response } from 'express';
import { BlobDeleteOptions, BlobSASPermissions, BlobServiceClient, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import axios from 'axios';

dotenv.config();

const blobSasUrl = process.env.AZURE_STORAGE_SAS_TOKEN
const blobSasUrlReadOnly = process.env.AZURE_STORAGE_SAS_TOKEN_READ_ONLY
export const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'aum-ai';
const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

if (!blobSasUrl || !blobSasUrlReadOnly || !account || !accountKey) {
    throw new Error('AZURE_STORAGE_SAS_TOKEN or other required Azure environment variables are not defined.');
}

const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
export const blobServiceClient = new BlobServiceClient(
    blobSasUrl
);
const blobServiceClient2 = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential
);
const containerClient = blobServiceClient.getContainerClient(containerName);
const containerClient2 = blobServiceClient2.getContainerClient(containerName);
// Main upload function
export const uploadImageToAzure = async (
    file: { originalname: string; path: string }
): Promise<string> => {
    try {
        if (!file || !file.path || !file.originalname) {
            throw new Error('Invalid file object. Ensure the file is provided with correct properties.');
        }
        const blobName = `${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const filePath = path.resolve(file.path);

        // Upload the file to Azure Blob Storage
        await blockBlobClient.uploadFile(filePath);
        fs.unlinkSync(filePath); // Clean up local file after upload
        //console.log(`File uploaded to Azure Blob Storage: ${blockBlobClient.url}`);

        return `https://${account}.blob.core.windows.net/${containerName}/${blobName}`;
    } catch (error: any) {
        console.error('Image upload failed:', error.message);
        throw new Error('Upload error');
    }
};
export function generateReadOnlySasUrl(blobName: string, expiryMinutes = 15): string {
    const now = new Date();
    const expiresOn = new Date(now.valueOf() + expiryMinutes * 60 * 1000);
    const sasToken = generateBlobSASQueryParameters(
        {
            containerName,
            blobName,
            permissions: BlobSASPermissions.parse("r"), // read-only
            expiresOn,
        },
        sharedKeyCredential
    ).toString();

    return `${containerClient2.getBlockBlobClient(blobName).url}?${sasToken}`;
}
export const deleteBlobByName = async (
    blobName: string
): Promise<{ success: boolean; message: string }> => {
    try {
        if (!blobName) throw new Error('blobName required');

        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const resp = await blockBlobClient.deleteIfExists({
            deleteSnapshots: 'include',
        } as BlobDeleteOptions);
        console.log(resp)

        if ((resp as any).succeeded === false) {
            return { success: false, message: 'Blob not found' };
        }
        return { success: true, message: 'Blob deleted' };
    } catch (err: any) {
        console.error('deleteBlobByName error:', err.message);
        return { success: false, message: 'Delete failed' };
    }
};
export const uploadFileToAzure = async (
    file: { originalname: string; path: string }
): Promise<string> => {
    try {
        if (!file || !file.path || !file.originalname) {
            throw new Error('Invalid file object. Ensure the file is provided with correct properties.');
        }

        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Optional: Ensure the container exists
        await containerClient.createIfNotExists();

        const blobName = `${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const filePath = path.resolve(file.path);

        // Upload file
        await blockBlobClient.uploadFile(filePath);

        // Clean up local file
        fs.unlinkSync(filePath);

        // Return the file URL
        return `https://${account}.blob.core.windows.net/${containerName}/${blobName}?${blobSasUrlReadOnly}`;
    } catch (error: any) {
        console.error('File upload failed:', error.message);
        throw new Error('Azure file upload error');
    }
};
export const UploadAssets = async (uid: string, file: any, db: any) => {

    if (!file) {
        return ({ message: 'No file uploaded', success: false });
    }

    try {
        const buffer = file.buffer;

        // ✅ Generate SHA-256 hash of the file
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

        // ✅ Check DB if file with the same hash exists
        const existingFile = await db.collection('files').findOne({ hash: fileHash });
        if (existingFile) {
            return ({
                success: true,
                message: 'File already uploaded',
                url: existingFile.url,
                type: existingFile.type,
                originalName: existingFile.originalName,
                storedName: existingFile.storedName
            });

        }

        // ✅ Extract file extension
        const fileExt = path.extname(file.originalname); // e.g., '.png'
        const hashedFilename = `${fileHash}${fileExt}`;
        const tempPath = path.join(__dirname, hashedFilename);

        // ✅ Save temp file
        fs.writeFileSync(tempPath, buffer);

        // ✅ Upload to Azure with hashed filename
        let fileUrl: string;
        const isImage = file.mimetype.startsWith('image/');
        if (isImage) {
            fileUrl = await uploadImageToAzure({ originalname: hashedFilename, path: tempPath });
        } else {
            fileUrl = await uploadFileToAzure({ originalname: hashedFilename, path: tempPath });
        }

        // ✅ Delete temp file
        fs.unlinkSync(tempPath);

        // ✅ Save metadata in MongoDB
        const publicUrl = `/assets/${fileHash}`;
        await db.collection('assets').insertOne({
            originalName: file.originalname,
            storedName: hashedFilename,
            hash: fileHash,
            uid: uid,
            azureUrl: fileUrl,
            url: publicUrl,
            type: isImage ? 'image' : 'file',
            uploadedAt: new Date()
        });
        return ({
            message: 'File uploaded successfully',
            url: publicUrl,
            type: isImage ? 'image' : 'file',
            originalName: file.originalname,
            storedName: hashedFilename
        });

    } catch (error: any) {
        console.error('UploadFile error:', error);
        return ({ message: 'File upload failed', success: false });
    }
};
// async function testAzureConnection() {
//     try {
//         console.log(`🔍 Testing connection to container "${containerName}"...`);

//         const containerClient = blobServiceClient.getContainerClient(containerName);

//         const exists = await containerClient.exists();

//         if (!exists) {
//             console.log("❌ Container not found. Creating...");
//             await containerClient.create({ access: "container" });
//             console.log("✅ Container created.");
//         } else {
//             console.log("✅ Container exists.");
//         }

//         console.log("📦 Listing blobs in container:");
//         for await (const blob of containerClient.listBlobsFlat()) {
//             console.log(` - ${blob.name}`);
//         }

//         console.log("✅ Azure Blob Storage connection successful.");
//     } catch (err: any) {
//         console.error("❌ Azure connection test failed:", err.message, err);
//     }
// }

// // Call the connection test function
// testAzureConnection();
