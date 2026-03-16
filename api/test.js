// Test endpoint to verify API routes are working
export default async function handler(req, res) {
  console.log('[v0] Test API called');
  
  return res.status(200).json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'not set'
    }
  });
}
