// Vercel Serverless Function for Email Notifications
// Uses Resend for email delivery

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Escape HTML special characters to prevent XSS in email templates
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { type, to, subject, requestId, customerName, adminMessage, scheduledTime, senderName } = req.body;

  if (!to || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Escape user-supplied values used in HTML templates
  const safeCustomerName = escapeHtml(customerName);
  const safeSenderName = escapeHtml(senderName);
  const safeAdminMessage = escapeHtml(adminMessage);
  const safeScheduledTime = escapeHtml(scheduledTime);

  // Build email content based on notification type
  let emailSubject = subject;
  let emailHtml = '';
  
  const appUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://firstcallmaintenance.biz';

  switch (type) {
    case 'new_request':
      // Notification to admin about new request
      emailSubject = emailSubject || `New Repair Request from ${safeCustomerName}`;
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #9333ea; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">First Call Maintenance</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-top: 0;">New Repair Request</h2>
            <p style="color: #64748b;">You have received a new repair request from <strong>${safeCustomerName}</strong>.</p>
            <p style="color: #64748b;">Log in to your admin dashboard to view details and respond.</p>
            <a href="${appUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">
              View Request
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            First Call Maintenance - Home Repair Services
          </div>
        </div>
      `;
      break;

    case 'request_confirmation':
      // Confirmation to customer that their request was received
      emailSubject = emailSubject || 'Your Repair Request Has Been Received';
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #9333ea; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">First Call Maintenance</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-top: 0;">Request Received!</h2>
            <p style="color: #64748b;">Hi <strong>${safeCustomerName}</strong>, thank you for submitting your repair request.</p>
            <p style="color: #64748b;">Our team has received it and will review the details. We'll be in touch shortly to schedule a time that works for you.</p>
            <a href="${appUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">
              View Your Request
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            First Call Maintenance - 765-246-4405
          </div>
        </div>
      `;
      break;

    case 'request_scheduled':
      // Notification to customer that request has been scheduled
      emailSubject = emailSubject || 'Your Repair Request Has Been Scheduled';
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #9333ea; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">First Call Maintenance</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-top: 0;">Your Repair Has Been Scheduled!</h2>
            <p style="color: #64748b;">Great news! Your repair request has been scheduled.</p>
            ${safeScheduledTime ? `<p style="color: #1e293b; font-size: 18px; font-weight: bold;">Scheduled Time: ${safeScheduledTime}</p>` : ''}
            ${safeAdminMessage ? `<p style="color: #64748b; background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #9333ea;"><strong>Message from technician:</strong><br/>${safeAdminMessage}</p>` : ''}
            <a href="${appUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">
              View Details
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            First Call Maintenance - 765-246-4405
          </div>
        </div>
      `;
      break;

    case 'new_message':
      // Notification about new message in request thread
      emailSubject = emailSubject || `New Message${safeSenderName ? ` from ${safeSenderName}` : ''} on Your Repair Request`;
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #9333ea; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">First Call Maintenance</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-top: 0;">New Message${safeSenderName ? ` from ${safeSenderName}` : ''}</h2>
            <p style="color: #64748b;">You have a new message regarding a repair request.</p>
            ${safeAdminMessage ? `<p style="color: #64748b; background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #9333ea;">${safeAdminMessage}</p>` : ''}
            <a href="${appUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">
              View Conversation
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            First Call Maintenance - 765-246-4405
          </div>
        </div>
      `;
      break;

    case 'status_update':
      // Notification about status change
      emailSubject = emailSubject || 'Your Repair Request Status Has Been Updated';
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #9333ea; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">First Call Maintenance</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-top: 0;">Status Update</h2>
            <p style="color: #64748b;">The status of your repair request has been updated.</p>
            <a href="${appUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">
              View Status
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            First Call Maintenance - 765-246-4405
          </div>
        </div>
      `;
      break;

    case 'general_update':
      // Generic notification for any request update (new message, scheduled time, completion)
      emailSubject = emailSubject || 'Your Repair Request Has Been Updated';
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #9333ea; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">First Call Maintenance</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-top: 0;">Request Updated</h2>
            <p style="color: #64748b;">Your request has been updated. Log in to your account to view the details.</p>
            <a href="${appUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">
              Log In to View Details
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            First Call Maintenance - 765-246-4405
          </div>
        </div>
      `;
      break;

    default:
      return res.status(400).json({ error: 'Invalid notification type' });
  }

  try {
    // Use Resend's default domain until custom domain is verified
    // To use your own domain (notifications@firstcallmaintenance.biz), 
    // verify your domain at https://resend.com/domains
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'First Call Maintenance <onboarding@resend.dev>';
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return res.status(response.status).json({ error: 'Failed to send email', details: data });
    }

    return res.status(200).json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Failed to send email', message: error.message });
  }
}
