import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize auth - expects Service Account credentials in env vars
// GOOGLE_SERVICE_ACCOUNT_EMAIL
// GOOGLE_PRIVATE_KEY
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Uploads a base64 image to Google Drive
 * @param base64Image The base64 string of the image (with or without data prefix)
 * @param filename The desired filename
 * @param folderId The ID of the folder to upload to (optional)
 * @returns The webViewLink (URL) of the uploaded file
 */
export async function uploadImageToDrive(base64Image: string, filename: string, folderId?: string) {
    try {
        // Remove data URL prefix if present
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const stream = Readable.from(buffer);

        const fileMetadata: Record<string, unknown> = {
            name: filename,
            // If folderId is provided, put it in that folder
            parents: folderId ? [folderId] : [],
        };

        const media = {
            mimeType: 'image/png',
            body: stream,
        };

        const uploadResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id, webViewLink",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as any); // Google Drive typings are complex

        // Make the file readable by anyone with the link (optional, depends on use case)
        // For private history, we might NOT want this, but for displaying in the app 
        // without complex auth proxying, it's often the easiest "MVP" way.
        // Alternatively, we can just return the ID and serve it via a proxy route.
        // For now, let's keep it private to the service account + shared users.

        return uploadResponse.data.webViewLink;
    } catch (error) {
        console.error('Error uploading to Drive:', error);
        throw error;
    }
}
