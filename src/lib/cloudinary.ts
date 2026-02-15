import { v2 as cloudinary } from 'cloudinary';

// Configure/verify credentials
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export async function uploadToCloudinary(file: Buffer | string, folder: string = 'uv-market'): Promise<string> {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        throw new Error('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    }

    // If Base64 String
    if (typeof file === 'string') {
        const result = await cloudinary.uploader.upload(file, { folder });
        return result.secure_url;
    }

    // If Buffer
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) reject(error);
                else resolve(result!.secure_url);
            }
        );
        uploadStream.end(file);
    });
}
