import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// `base` is the public path the app is served from. Keep it "/" for root-domain
// hosting (S3+CloudFront, Amplify, Vercel, Netlify). If you deploy under a
// sub-path (e.g. https://host/genarchitect/), set base to "/genarchitect/" AND
// pass the same value as `basename` to <BrowserRouter> in src/main.tsx.
export default defineConfig({
  base: '/',
  plugins: [react()],
})
