/**
 * sendNotification.js
 * Root-level helper module for sending email notifications via the
 * /api/send-notification serverless endpoint (Resend-powered).
 *
 * Admin notifications are delivered to zak@firstcallmaintenance.biz.
 * Emails are sent from: First Call Maintenance <notifications@firstcallmaintenance.biz>
 * (configure RESEND_FROM_EMAIL on the server once your domain is verified in Resend).
 *
 * Usage:
 *   import { sendNotification, ADMIN_EMAIL } from './sendNotification.js';
 *
 *   await sendNotification({ type: 'new_request', to: ADMIN_EMAIL, customerName: 'Jane Doe' });
 */

/** The admin address that receives new-request and internal alerts. */
export const ADMIN_EMAIL = 'zak@firstcallmaintenance.biz';

/**
 * Send an email notification through the /api/send-notification endpoint.
 *
 * @param {object} options
 * @param {'new_request'|'request_confirmation'|'request_scheduled'|'new_message'|'status_update'|'general_update'} options.type
 *   The notification type (see NOTIFICATIONS.md for details on each).
 * @param {string} options.to   Recipient email address.
 * @param {string} [options.subject]       Override the default subject line.
 * @param {string} [options.customerName]  Full name of the customer.
 * @param {string} [options.adminMessage]  Extra message body text from the admin/technician.
 * @param {string} [options.scheduledTime] Human-readable scheduled appointment time.
 * @param {string} [options.requestId]     Firestore document ID of the repair request.
 * @param {string} [options.senderName]    Name of the message sender (used in new_message type).
 * @returns {Promise<boolean>} Resolves to `true` on success, `false` on failure.
 */
export async function sendNotification({
  type,
  to,
  subject,
  customerName,
  adminMessage,
  scheduledTime,
  requestId,
  senderName,
} = {}) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        to,
        subject,
        customerName,
        adminMessage,
        scheduledTime,
        requestId,
        senderName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Notification failed:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Notification error:', error);
    return false;
  }
}

export default sendNotification;
