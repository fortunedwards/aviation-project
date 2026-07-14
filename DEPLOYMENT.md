# Deployment Guide

## Backend: Railway

1. Create a Railway project from the `server` folder.
2. Add the variables from `server/.env.example`.
3. Point `DATABASE_URL` to your Neon PostgreSQL connection string.
4. Set `FRONTEND_URL` to your Vercel domain so CORS and Socket.IO accept it.
5. Keep `CLOUDINARY_URL` in Railway only. Do not expose it to the client.

## Database: Neon

1. Create a Neon PostgreSQL database.
2. Copy the pooled or direct connection string into `DATABASE_URL`.
3. Make sure the connection string includes SSL, or keep `DB_SSL=true`.

## Frontend: Vercel

1. Create a Vercel project from the `client` folder.
2. Set `VITE_API_URL` to your Railway backend URL.
3. Set `VITE_SOCKET_URL` to the same Railway backend URL.
4. Deploy with the default Vite build output (`dist`).
5. Keep `client/.npmrc` in place so Vercel skips the `react-paystack` vs React 19 peer install conflict.

## File Storage

- Application passports and certificates upload to Cloudinary.
- Chat attachments upload to Cloudinary.
- PostgreSQL stores only the resulting file URL, not local file paths.
