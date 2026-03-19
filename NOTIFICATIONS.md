# Notifications – Setup & Usage

This document explains how to configure and use the email notification system
built into Home Repair Request.  Emails are sent via **[Resend](https://resend.com)**
through the `/api/send-notification` Vercel serverless function.

---

## Required Environment Variables

Add the following to your `.env.local` (local development) or to your **Vercel
project environment variables** (production):

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | ✅ Yes | Your Resend API key – obtain from [resend.com/api-keys](https://resend.com/api-keys). **Never commit this value to source control.** |
| `RESEND_FROM_EMAIL` | Optional | Override the sender address once your domain is verified in Resend. Defaults to `First Call Maintenance <onboarding@resend.dev>`. Example: `First Call Maintenance <notifications@firstcallmaintenance.biz>` |
| `APP_URL` | Optional | The stable public URL of the app, used as the link in email notification buttons. Defaults to `https://home-repair-request.vercel.app`. Change to `https://firstcallmaintenance.biz` once that domain is fully working. |

> Admin notifications are sent to **zak@firstcallmaintenance.biz** (the `ADMIN_EMAIL`
> constant in `sendNotification.js`).

---

## Setting Up the Resend Template (optional)

A ready-to-paste HTML template lives at
[`templates/notification-email.html`](./templates/notification-email.html).

1. Log in to [resend.com](https://resend.com) and open **Templates**.
2. Click **Create Template**.
3. Paste the contents of `templates/notification-email.html` into the HTML editor.
4. Replace the `{{placeholder}}` variables with the values for each notification
   type (see the table below).
5. Save the template.

You can use the saved template ID with the Resend SDK / API instead of the
inline HTML that is currently used in `api/send-notification.js`.

### Template Placeholders

| Placeholder | Example value |
|---|---|
| `{{heading}}` | `New Repair Request` |
| `{{message}}` | `Hi Jane, your request has been received.` |
| `{{footer_note}}` | `Scheduled: Monday, 9 AM – 11 AM` |
| `{{cta_url}}` | `https://firstcallmaintenance.biz` |
| `{{cta_label}}` | `View Request` |

---

## Notification Types

The `sendNotification()` helper (exported from `sendNotification.js` in the
repo root) accepts a `type` field that determines the email content:

| Type | Recipient | Triggered when |
|---|---|---|
| `new_request` | Admin (`zak@firstcallmaintenance.biz`) | A customer submits a new repair request |
| `request_confirmation` | Customer | Their new request is saved successfully |
| `request_scheduled` | Customer | Admin schedules an appointment time |
| `new_message` | Customer or Admin | A new chat message is posted on a request |
| `status_update` | Customer | The request status changes |
| `general_update` | Customer | Any other update to a request |

---

## Usage

### From the React app (client side)

```js
import { sendNotification, ADMIN_EMAIL } from '../sendNotification.js';

// Notify admin about a new request
await sendNotification({
  type: 'new_request',
  to: ADMIN_EMAIL,
  customerName: 'Jane Doe',
  requestId: 'abc123',
});

// Send confirmation to the customer
await sendNotification({
  type: 'request_confirmation',
  to: 'customer@example.com',
  customerName: 'Jane Doe',
  requestId: 'abc123',
});

// Notify customer their appointment is scheduled
await sendNotification({
  type: 'request_scheduled',
  to: 'customer@example.com',
  customerName: 'Jane Doe',
  scheduledTime: 'Monday, March 24 at 10:00 AM',
  adminMessage: 'I'll bring the parts needed for the pipe repair.',
});

// Notify about a new message
await sendNotification({
  type: 'new_message',
  to: 'customer@example.com',
  senderName: 'Zak',
  adminMessage: 'Parts have arrived – see you Monday!',
  requestId: 'abc123',
});
```

### From a Node.js / serverless context

Call the `/api/send-notification` endpoint directly with a `POST` request:

```js
await fetch('/api/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'new_request',
    to: 'zak@firstcallmaintenance.biz',
    customerName: 'Jane Doe',
  }),
});
```

---

## Domain Verification (recommended for production)

To send from `notifications@firstcallmaintenance.biz` instead of the default
Resend sandbox address:

1. Open [resend.com/domains](https://resend.com/domains).
2. Add `firstcallmaintenance.biz` and follow the DNS verification steps.
3. Set `RESEND_FROM_EMAIL=First Call Maintenance <notifications@firstcallmaintenance.biz>`
   in your Vercel environment variables.
