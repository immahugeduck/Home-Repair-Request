import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    '__firebase_config': JSON.stringify(process.env.VITE_FIREBASE_CONFIG || '{}'),
    '__app_id': JSON.stringify(process.env.VITE_APP_ID || 'home-repair-app'),
    '__initial_auth_token': JSON.stringify(process.env.VITE_INITIAL_AUTH_TOKEN || '')
  }
});
