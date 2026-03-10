import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse form data using formidable
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ 
      multiples: true,
      keepExtensions: true,
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { files } = await parseForm(req);
    
    // Handle both single file and multiple files
    let fileArray = files.files || [];
    if (!Array.isArray(fileArray)) {
      fileArray = [fileArray];
    }
    
    const uploadedUrls = [];
    
    for (const file of fileArray) {
      if (!file || !file.filepath) continue;
      
      // Read file from temp location
      const fileBuffer = fs.readFileSync(file.filepath);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const originalName = file.originalFilename || 'photo.jpg';
      const ext = originalName.split('.').pop() || 'jpg';
      const filename = `repair-photos/${timestamp}-${randomStr}.${ext}`;
      
      // Upload to Vercel Blob
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: file.mimetype || 'image/jpeg',
      });
      
      uploadedUrls.push(blob.url);
      
      // Clean up temp file
      try {
        fs.unlinkSync(file.filepath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    return res.status(200).json({ urls: uploadedUrls });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
