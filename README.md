# 🍳 BiteCraft Kitchen

BiteCraft Kitchen is a premium, full-stack cloud kitchen platform engineered with a high-conversion, modern web interface. It runs seamlessly on your PC and supports both lightweight **unlimited offline-first local mode** and **production-ready live Supabase cloud database synchronization**.

---

## 🚀 Quick Start Guide

To run BiteCraft Kitchen locally on your computer, follow these simple steps:

### 1. Prerequisite Installations
Make sure you have [Node.js](https://nodejs.org/) installed on your system (v18 or higher recommended).

### 2. Extract & Setup Folder
Extract the downloaded ZIP package and open terminal/cmd in the project's root directory.

### 3. Install All Dependencies
Run the following command to download and install all necessary npm packages:
```bash
npm install
```

### 4. Create Environment File
Copy the example environment file to create your active `.env` file:
```bash
cp .env.example .env
```

### 5. Launch the Application
Start the unified local development server by executing:
```bash
npm run dev
```
Once started, open **[http://localhost:3000](http://localhost:3000)** in your favorite search browser.

---

## ⚡ Supabase Live Integration

By default, the platform boots in **Safe Fallback Local Mode**, storing all items and order tracking state in your terminal workspace's `database.json` file. 

If you want to sync real-time order states and dynamic menus with your global **Supabase** cloud database, follow these steps:

### 1. Setup Your Database Schema
1. Go to your [Supabase Dashboard](https://supabase.com/).
2. Open the **SQL Editor** in your project sidebar.
3. Paste the dynamic **BiteCraft DDL Schema** and click **Run**.
   * *Tip: You can copy this script directly from the "Admin Dashboard" -> "Copy DDL Schema" section inside the app, or download it via the `/api/supabase-schema` endpoint!*

### 2. Add Secrets in `.env`
Update your local `.env` file with your project credentials:
```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-role-token"
```

### 3. Restart Dev Server
Restart your local development server. The backend will detect these keys and automatically:
- Establish real-time connection with Supabase.
- Auto-seed the food card menu catalog if your table is currently empty!
- Synchronize all user orders and historic dashboard metrics fully in the cloud database.

---

## 📦 Production Build & Deployment

To bundle the application and test production builds locally:

1. **Build the Entire App**:
   ```bash
   npm run build
   ```
   This will bundle frontend assets into `/dist` and compile the backend `server.ts` into a standalone high-performance `dist/server.cjs` bundle using `esbuild`.

2. **Start stand-alone Production Server**:
   ```bash
   npm run start
   ```

---

## ☁️ Vercel One-Click Deployment Guide

Deploying BiteCraft Kitchen to Vercel is highly streamlined! Thanks to our integrated `vercel.json` routing configuration, Vercel hosts all client-side pages on lightning-fast CDN servers while running your Express API serverlessly.

### Step-by-Step Deployment:

1. **Push your code to GitHub**:
   Create a new GitHub repository, commit your code files, and push them to your repository.
   
2. **Import to Vercel**:
   - Go to your [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
   - Select your GitHub repository and click **Import**.

3. **Configure Environment Variables**:
   Under the **Environment Variables** accordion, add your Supabase credentials:
   - `SUPABASE_URL` = `your-supabase-project-url`
   - `SUPABASE_ANON_KEY` = `your-supabase-public-anon-key`

4. **Deploy**:
   - Click **Deploy**. Vercel will automatically read `vercel.json`, build the React frontend via Vite, package your Express API routing endpoints, and compile the live deployment.

Once deployment finishes, your global links are direct, serverless, and automatically synced with Supabase!

---

## ✨ Outstanding Features included
* **Gourmet Food Catalog**: Categorized interactive sliders with premium layout, preparation times, calorie information, and high-contrast responsive badges.
* **Integrated Video Player previews**: Fully-qualified immersive previews showing preparation videos loaded securely.
* **Simulated Checkout & Payment Gateways**: Highly-interactive embedded Razorpay sandbox simulator confirming transactions instantly.
* **Real-time Live Order Monitoring**: Interactive step-by-step progress tracker mimicking kitchen preparation, dispatching, and delivery stages.
* **Admin Control Center**: Visualizes analytical business performance (total revenue, active commissions, average values) utilizing robust interactive Recharts graphs. Includes an editable order logs register for updating food item milestones manually.
