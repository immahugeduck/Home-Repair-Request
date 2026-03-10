import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get content type header
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }
    
    // Read the raw body as buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Parse multipart form data manually
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary found in Content-Type' });
    }
    
    const parts = parseMultipart(buffer, boundary);
    const uploadedUrls = [];
    
    for (const part of parts) {
      if (part.filename && part.data) {
        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const ext = part.filename.split('.').pop() || 'jpg';
        const filename = `repair-photos/${timestamp}-${randomStr}.${ext}`;
        
        // Upload to Vercel Blob
        const blob = await put(filename, part.data, {
          access: 'public',
          contentType: part.contentType || 'image/jpeg',
        });
        
        uploadedUrls.push(blob.url);
      }
    }
    
    if (uploadedUrls.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    return res.status(200).json({ urls: uploadedUrls });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}

// Simple multipart parser
function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundaryBuffer = Buffer.from(`--${boundary}--`);
  
  let start = 0;
  let idx = buffer.indexOf(boundaryBuffer, start);
  
  while (idx !== -1) {
    const nextIdx = buffer.indexOf(boundaryBuffer, idx + boundaryBuffer.length);
    if (nextIdx === -1) break;
    
    // Extract part between boundaries
    const partStart = idx + boundaryBuffer.length + 2; // +2 for CRLF
    const partEnd = nextIdx - 2; // -2 for CRLF before next boundary
    
    if (partStart < partEnd) {
      const partBuffer = buffer.slice(partStart, partEnd);
      const part = parsePart(partBuffer);
      if (part) parts.push(part);
    }
    
    idx = nextIdx;
  }
  
  return parts;
}

function parsePart(buffer) {
  // Find header/body separator (double CRLF)
  const separator = Buffer.from('\r\n\r\n');
  const sepIdx = buffer.indexOf(separator);
  
  if (sepIdx === -1) return null;
  
  const headerStr = buffer.slice(0, sepIdx).toString('utf8');
  const data = buffer.slice(sepIdx + 4);
  
  // Parse headers
  const headers = {};
  headerStr.split('\r\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();
      headers[key] = value;
    }
  });
  
  // Extract filename from Content-Disposition
  const disposition = headers['content-disposition'] || '';
  const filenameMatch = disposition.match(/filename="([^"]+)"/);
  const filename = filenameMatch ? filenameMatch[1] : null;
  
  // Get content type
  const contentType = headers['content-type'] || 'application/octet-stream';
  
  if (!filename) return null;
  
  return { filename, contentType, data };
}
