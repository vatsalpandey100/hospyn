# Hospyn - Cloudflare Deployment Guide

Hospyn is now fully configured to run on **Cloudflare Pages** with **Pages Functions**.

---

## 🏗️ Architecture Overview

- **Frontend (SPA)**: Built with Vite & React 19, statically served across Cloudflare’s 330+ global data centers with automatic compression (Brotli/Gzip) and edge caching.
- **Edge API Router (`functions/api/[[route]].ts`)**: Edge serverless functions powering all `/api/*` routes (AI Symptom Checker, Report Reader, Transcription, Doctor Specialty Triage, Prescription Safety, Health Timeline, SMS OTP, and Google Calendar sync).
- **SPA Routing (`public/_redirects`)**: Guarantees that refreshing any client route (e.g. `/records`, `/doctors`, `/queue`) serves `index.html` without 404 errors.
- **Route Optimization (`public/_routes.json`)**: Configures Cloudflare to invoke compute functions *only* for `/api/*` requests, ensuring zero cost and maximum speed for static images, icons, and CSS/JS chunks.

---

## 🚀 Deployment Methods

### Method 1: Deploy via Cloudflare Dashboard (Recommended with Git)

This method gives you automatic CI/CD builds whenever you push to your GitHub / GitLab repository.

1. **Push your code to GitHub / GitLab:**
   ```bash
   git add .
   git commit -m "Configure Cloudflare Pages and Edge Functions"
   git push origin main
   ```

2. **Open Cloudflare Dashboard:**
   - Go to [https://dash.cloudflare.com](https://dash.cloudflare.com).
   - In the left sidebar, navigate to **Compute (Workers & Pages)** > **Pages**.
   - Click **Create application** > **Pages** > **Connect to Git**.

3. **Select your repository & configure build settings:**
   - **Project name**: `hospyn` (or your chosen name)
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank or `/`)

4. **Add Environment Variables (Secrets):**
   Under **Environment variables (advanced)**, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - *(Optional)* `SMS_GATEWAY_API_KEY`: *(If using Android SMS Gateway)*
   - *(Optional)* `SMS_GATEWAY_DEVICE_ID`: *(If using Android SMS Gateway)*
   - *(Optional)* `TEXTLOCAL_API_KEY`: *(If using Textlocal SMS Gateway)*
   - *(Optional)* `TEXTLOCAL_SENDER`: `TXTLCL`

5. **Deploy:**
   - Click **Save and Deploy**.
   - Cloudflare will build the Vite frontend, compile the Edge Functions, and give you a live URL like `https://hospyn.pages.dev`.

---

### Method 2: Direct CLI Deployment with Wrangler

If you want to deploy directly from your local terminal without connecting Git:

1. **Log in to Cloudflare:**
   ```bash
   npx wrangler login
   ```
   *(A browser window will open asking you to authorize Wrangler).*

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Deploy to Cloudflare Pages:**
   ```bash
   npm run deploy
   ```
   *(Alternatively: `npx wrangler pages deploy dist --project-name hospyn`)*

4. **Set Production Secrets via CLI:**
   ```bash
   npx wrangler pages secret put GEMINI_API_KEY --project-name hospyn
   ```
   *(Enter your API key when prompted).*

---

## 🧪 Local Testing & Emulation

You can test the exact Cloudflare Pages & Functions environment locally:

1. **Create local environment file:**
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   Open `.dev.vars` and add your `GEMINI_API_KEY`.

2. **Build the frontend assets:**
   ```bash
   npm run build
   ```

3. **Start the local Cloudflare Pages emulator:**
   ```bash
   npm run pages:dev
   ```
   - Hospyn UI: `http://localhost:8788`
   - Edge API Healthcheck: `http://localhost:8788/api/health`

---

## 🌐 Custom Domain Setup & Free SSL

1. Go to **Workers & Pages** in your Cloudflare Dashboard.
2. Select your `hospyn` project.
3. Click on the **Custom domains** tab.
4. Click **Set up a custom domain** (e.g., `hospyn.yourdomain.com` or `yourdomain.com`).
5. Cloudflare will automatically provision a free SSL/TLS certificate, route traffic through Cloudflare's edge network, and activate DDoS protection.

---

## 📁 Key Cloudflare Files Added

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Cloudflare project definition with `nodejs_compat` and output dir `dist`. |
| `functions/api/[[route]].ts` | Universal Edge API router executing all AI, OTP, and Calendar endpoints. |
| `public/_redirects` | SPA fallback rule preventing 404 errors on page reloads. |
| `public/_routes.json` | Cloudflare Pages route filter to route only `/api/*` to edge compute. |
| `.dev.vars.example` | Environment variable template for local Cloudflare preview. |
| `package.json` | Updated with `npm run build`, `npm run pages:dev`, and `npm run deploy`. |
