# Home Repair Request App

A modern web application for managing home repair requests built with React, Vite, and Firebase.

## Features

- Submit home repair requests
- Track repair requests in real-time
- Schedule and confirm appointments
- Staff portal for managing requests
- Real-time updates with Firestore

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Firebase project

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Create a Web app and copy the config
4. Update `.env.local` with your Firebase credentials:

```env
VITE_FIREBASE_CONFIG='{"apiKey":"YOUR_KEY","authDomain":"YOUR_AUTH_DOMAIN","projectId":"YOUR_PROJECT_ID","storageBucket":"YOUR_BUCKET","messagingSenderId":"YOUR_SENDER_ID","appId":"YOUR_APP_ID"}'
```

### Development

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:5173
```

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Vercel

1. Push changes to GitHub
2. Connect repo to Vercel
3. Add environment variables from `.env.example` in Vercel dashboard
4. Deploy!

Vercel will automatically:
- Detect Vite configuration
- Run `npm run build`
- Deploy from the `dist` folder

## Environment Variables

See `.env.example` for required variables.

## License

See LICENSE file
