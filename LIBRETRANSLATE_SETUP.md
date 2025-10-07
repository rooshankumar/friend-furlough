# 🌐 LibreTranslate Setup Guide

**Date**: 2025-10-07  
**Status**: Ready to Use

---

## 📖 **What is LibreTranslate?**

LibreTranslate is a **free, open-source, self-hostable translation API** that provides:
- ✅ **Zero cost** - Completely free to use
- ✅ **Privacy** - Self-host for complete data control
- ✅ **No API key required** for public instance
- ✅ **Simple REST API** - Easy to integrate
- ✅ **40+ languages** supported

---

## 🚀 **Setup Options**

### **Option 1: Use Public Instance (Quickest)**

**Pros:**
- No setup required
- Works immediately
- Free to use

**Cons:**
- Rate limited
- Shared with others
- Less reliable for production

**Setup:**
Create `.env` file:
```env
VITE_LIBRETRANSLATE_URL=https://libretranslate.com
```

**Done!** Your app will now translate using the public API.

---

### **Option 2: Self-Host with Docker (Recommended)**

**Pros:**
- No rate limits
- Full control
- Better performance
- Private data

**Cons:**
- Requires server/Docker
- ~2GB RAM needed

**Setup:**

1. **Install Docker** (if not already installed)

2. **Run LibreTranslate container:**
```bash
docker run -d \
  --name libretranslate \
  -p 5000:5000 \
  --restart unless-stopped \
  libretranslate/libretranslate
```

3. **Update .env:**
```env
VITE_LIBRETRANSLATE_URL=http://localhost:5000
```

4. **Test it:**
```bash
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"q":"Hello","source":"en","target":"es","format":"text"}'
```

**Expected response:**
```json
{"translatedText":"Hola"}
```

---

### **Option 3: Deploy to Production Server**

**Pros:**
- Best for production
- Accessible from anywhere
- Can add authentication

**Recommended Platforms:**
1. **Railway** - Easy deploy, free tier
2. **Render** - Docker support, free tier
3. **DigitalOcean** - $5/month droplet
4. **AWS/GCP** - Scalable options

**Docker Compose Example:**
```yaml
version: '3'
services:
  libretranslate:
    image: libretranslate/libretranslate
    ports:
      - "5000:5000"
    environment:
      - LT_LOAD_ONLY=en,es,fr,de,it,pt,ru,ja,ko,zh,ar,hi
    restart: unless-stopped
```

**With API Key Protection:**
```bash
docker run -d \
  -p 5000:5000 \
  -e LT_API_KEYS=true \
  -e LT_API_KEY_DB_PATH=/app/db/api_keys.db \
  libretranslate/libretranslate
```

Then update `.env`:
```env
VITE_LIBRETRANSLATE_URL=https://your-domain.com
VITE_LIBRETRANSLATE_API_KEY=your-secret-key
```

---

## 🧪 **Testing the Integration**

### **Test Translation in Browser Console:**
```javascript
// Open your app, then in browser console:
import { translateText } from '@/lib/translation';

// Test translation
const result = await translateText("Hello world", "es");
console.log(result); // Should output: "Hola mundo"
```

### **Test Auto-Translate:**
```javascript
import { autoTranslate } from '@/lib/translation';

const result = await autoTranslate("Bonjour", "en");
console.log(result);
// {
//   original: "Bonjour",
//   detected: "fr",
//   translated: "Hello",
//   isTranslated: true
// }
```

---

## 📊 **Supported Languages**

LibreTranslate supports **40+ languages** including:

| Code | Language | Code | Language |
|------|----------|------|----------|
| en | English | es | Spanish |
| fr | French | de | German |
| it | Italian | pt | Portuguese |
| ru | Russian | ja | Japanese |
| ko | Korean | zh | Chinese |
| ar | Arabic | hi | Hindi |
| bn | Bengali | vi | Vietnamese |
| th | Thai | nl | Dutch |
| pl | Polish | tr | Turkish |

**Get full list programmatically:**
```javascript
import { getSupportedLanguages } from '@/lib/translation';
const langs = await getSupportedLanguages();
```

---

## ⚡ **Performance Tips**

### **1. Enable Caching**
Already implemented! Translations are cached automatically:
```javascript
// First call - hits API
await translateText("Hello", "es");

// Second call - returns from cache (instant)
await translateText("Hello", "es");
```

### **2. Load Only Needed Languages**
When self-hosting:
```bash
docker run -d \
  -e LT_LOAD_ONLY=en,es,fr,de,it,pt \
  libretranslate/libretranslate
```

### **3. Use Batch Translation**
```javascript
import { translateBatch } from '@/lib/translation';

const texts = ["Hello", "World", "How are you?"];
const translations = await translateBatch(texts, "es");
// Concurrent API calls, much faster!
```

---

## 🎨 **Usage Examples**

### **Example 1: Translate Chat Message**
```typescript
import { translateText } from '@/lib/translation';

const message = "Hello, how are you?";
const translated = await translateText(message, "es");
// "Hola, ¿cómo estás?"
```

### **Example 2: Auto-Translate Community Post**
```typescript
import { autoTranslate } from '@/lib/translation';

// User's preferred language
const userLang = "en";

// Post in Spanish
const post = "Hola amigos!";

const result = await autoTranslate(post, userLang);
console.log(result.translated); // "Hello friends!"
console.log(result.detected); // "es"
```

### **Example 3: Detect Language**
```typescript
import { detectLanguage } from '@/lib/translation';

const text = "Bonjour le monde";
const lang = await detectLanguage(text);
console.log(lang); // "fr"
```

---

## 🛠️ **Troubleshooting**

### **Error: Failed to fetch**
**Solution**: Check if LibreTranslate is running:
```bash
curl http://localhost:5000/languages
```

### **Error: Translation failed**
**Solution**: Verify language codes are valid:
```javascript
const langs = await getSupportedLanguages();
console.log(langs);
```

### **Slow translations**
**Solutions**:
1. Self-host for better performance
2. Reduce loaded languages
3. Use caching (already enabled)
4. Batch translate when possible

---

## 🔒 **Security Best Practices**

### **For Self-Hosted:**
1. **Enable API keys** for production
2. **Rate limit** requests
3. **Use HTTPS** in production
4. **Restrict CORS** to your domain

**Example with rate limiting:**
```bash
docker run -d \
  -e LT_API_KEYS=true \
  -e LT_REQ_LIMIT=100 \
  -e LT_CHAR_LIMIT=5000 \
  libretranslate/libretranslate
```

---

## 💰 **Cost Comparison**

| Service | Cost | Limits | Setup |
|---------|------|--------|-------|
| **LibreTranslate (Public)** | Free | Rate limited | Instant |
| **LibreTranslate (Self-hosted)** | Free* | Unlimited | 5 mins |
| **Google Translate** | $20/1M chars | Pay as you go | API key |
| **DeepL** | $5.49/month | 500K chars | API key |

*Server costs may apply

---

## 🎯 **Recommended Setup**

### **For Development:**
```env
VITE_LIBRETRANSLATE_URL=https://libretranslate.com
```

### **For Production:**
```env
VITE_LIBRETRANSLATE_URL=https://your-domain.com
VITE_LIBRETRANSLATE_API_KEY=your-secret-key
```

---

## 📚 **API Documentation**

Full LibreTranslate API docs: https://libretranslate.com/docs

**Endpoints used:**
- `POST /translate` - Translate text
- `POST /detect` - Detect language
- `GET /languages` - Get supported languages

---

## ✨ **Features You Can Build**

Now that translation is integrated, you can:

1. ✅ **Auto-translate chat messages** - Users see messages in their language
2. ✅ **Translate community posts** - Click to see translation
3. ✅ **Multi-language onboarding** - Users onboard in their language
4. ✅ **Language learning comparisons** - Show original + translation side-by-side
5. ✅ **Language detection** - Auto-detect what language users speak
6. ✅ **Translation history** - Track what's been translated

---

## 🚀 **Next Steps**

1. Choose your setup option (public or self-hosted)
2. Add .env configuration
3. Test translation in browser console
4. Implement translation toggles in UI
5. Add auto-translate to community posts
6. Enable translation in chat messages

---

**Translation is now fully functional! 🎉**

Your users can now enjoy multi-language support powered by open-source technology!
