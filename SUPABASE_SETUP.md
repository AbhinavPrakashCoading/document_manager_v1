# 🗄️ Free Database Setup with Supabase

This guide shows you how to set up **completely FREE** database persistence for your Document Manager app using Supabase.

## 🎯 What You Get (FREE)

- **500MB PostgreSQL database** (more than enough for document metadata)
- **1GB bandwidth per month** 
- **Real-time subscriptions**
- **Row-level security**
- **API auto-generation**
- **No credit card required**

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub (recommended) or email
4. **No credit card required!**

### Step 2: Create New Project
1. Click "New Project"
2. Choose your organization
3. Fill in project details:
   - **Name**: `document-manager`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### Step 3: Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` 
4. Paste into the query editor
5. Click "Run" 
6. You should see: "Database schema created successfully! 🎉"

### Step 4: Get Your Connection Details
1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **API Key** (anon/public key)

### Step 5: Update Environment Variables
1. Open your `.env.local` file
2. Replace the demo values:

```bash
# Replace these with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 6: Test Connection
1. Restart your development server: `npm run dev`
2. Go to the dashboard
3. Look at the **Database Status** panel in the sidebar
4. It should show "Connected to Supabase database" with a green cloud icon

## ✅ Verification

After setup, your app will:

- **Store all processed documents** in Supabase database
- **Sync across devices** (if you add auth later)
- **Work offline** (falls back to localStorage automatically)
- **Show connection status** in the dashboard sidebar

## 🔄 Fallback Behavior

The app is designed to be resilient:

- **✅ Supabase available**: Documents stored in cloud database
- **⚠️ Supabase unavailable**: Automatically falls back to localStorage
- **🔄 Connection restored**: Can sync localStorage data to Supabase later

## 💰 Cost Breakdown

| Feature | Supabase Free Tier | Your Cost |
|---------|-------------------|-----------|
| Database Storage | 500MB | **$0** |
| Monthly Bandwidth | 1GB | **$0** |
| API Requests | 50,000/month | **$0** |
| Realtime Connections | 200 concurrent | **$0** |
| **Total Monthly Cost** | | **$0.00** |

## 🛠️ Troubleshooting

### "Failed to connect to Supabase"
- Check your `.env.local` file has correct URL and key
- Verify the project is active in Supabase dashboard
- Try restarting the development server

### "Table does not exist"
- Make sure you ran the SQL schema from `supabase-schema.sql`
- Check the SQL Editor for any errors
- Verify all tables were created in the Table Editor

### "Row Level Security policy violation"
- The demo uses `demo-user` as user ID
- In production, integrate with proper authentication
- For testing, you can temporarily disable RLS

## 🚀 Next Steps

Once your database is set up:

1. **Test document processing** - Upload files and verify they appear in Supabase
2. **Add authentication** - Integrate with Supabase Auth for multi-user support  
3. **Enable real-time** - Get live updates when documents are processed
4. **Scale up** - Upgrade to Pro when you need more storage/bandwidth

## 📊 Monitoring Usage

In your Supabase dashboard:
- **Database** tab: See storage usage
- **API** tab: Monitor bandwidth usage  
- **Logs** tab: Debug any issues

Your app now has enterprise-grade database capabilities for **$0/month**! 🎉