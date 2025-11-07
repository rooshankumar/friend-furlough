# Cloudinary Setup Guide (5 Minutes)

## ✅ What's Done
- Cloudinary package installed
- Upload functions created (`src/lib/cloudinaryUpload.ts`)
- Storage.ts updated to use Cloudinary
- Environment file template created

## 🚀 Quick Setup (Follow These Steps)

### Step 1: Create Cloudinary Account (2 minutes)

1. Go to: https://cloudinary.com/users/register_free
2. Sign up with email (free forever)
3. Verify your email
4. Login to dashboard

### Step 2: Get Your Credentials (1 minute)

After login, you'll see your dashboard with:

```
Cloud name: dxyz123abc  ← Copy this
API Key: 123456789012345  ← Don't need this
API Secret: abcdefghijk  ← Don't need this
```

**You only need the Cloud Name!**

### Step 3: Create Upload Preset (2 minutes)

1. In Cloudinary dashboard, go to: **Settings** (gear icon)
2. Click **Upload** tab
3. Scroll to **Upload presets**
4. Click **Add upload preset**
5. Configure:
   - **Preset name:** `chat_uploads`
   - **Signing mode:** Select **Unsigned** ⚠️ IMPORTANT!
   - **Folder:** `chat_attachments` (optional)
   - Click **Save**

### Step 4: Add to Your Project

1. Create `.env.local` file in project root:

```bash
# In: C:\Users\priya\StudioProjects\friend-furlough\.env.local

VITE_CLOUDINARY_CLOUD_NAME=dxyz123abc
VITE_CLOUDINARY_UPLOAD_PRESET=chat_uploads
```

Replace `dxyz123abc` with YOUR cloud name from Step 2!

### Step 5: Build and Test

```bash
npm run build
npx cap sync android
```

Then test uploading an image in your app!

## 📊 What You Get

- ✅ **Fast uploads:** 5-10 seconds (vs 45+ with Supabase)
- ✅ **Reliable:** Works on slow mobile networks
- ✅ **Free tier:** 25GB storage, 25GB bandwidth/month
- ✅ **CDN:** Images load instantly worldwide
- ✅ **Auto-optimization:** Images compressed automatically

## 🔍 Verify It's Working

After setup, check console logs when uploading:

```
☁️ Using Cloudinary for upload
📸 Uploading image to Cloudinary
☁️ Upload progress: 30%
☁️ Upload progress: 60%
☁️ Upload progress: 100%
✅ Cloudinary upload complete: https://res.cloudinary.com/...
```

## 🆘 Troubleshooting

### Error: "Upload preset must be whitelisted"
- Go back to Step 3
- Make sure **Signing mode** is set to **Unsigned**
- Save the preset again

### Error: "Invalid cloud name"
- Check `.env.local` file
- Make sure `VITE_CLOUDINARY_CLOUD_NAME` matches your dashboard
- Restart dev server: `npm run dev`

### Still using Supabase?
- Check console logs
- If you see "⚠️ Using Supabase storage (fallback)", Cloudinary env vars are missing
- Verify `.env.local` exists and has correct values

## 🎯 Next Steps

After it works:
1. Test uploading different file types (images, videos, PDFs)
2. Check Cloudinary dashboard to see uploaded files
3. Enjoy fast, reliable uploads! 🎉

## 💡 Pro Tips

- Cloudinary automatically optimizes images (smaller file size)
- Images are served from CDN (faster loading)
- You can view all uploads in Cloudinary dashboard
- Free tier is very generous (25GB/month)

---

**Need help?** Share your console logs and I'll debug!
