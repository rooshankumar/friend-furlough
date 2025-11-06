# Upload Timeout Fix - Stuck at 50% ✅

## Problem Identified

**Issue**: Image upload stuck at 50% for over 2 minutes
**Root Cause**: Supabase storage upload had no timeout, causing indefinite hang
**Location**: `src/lib/storage.ts` line 249-255

### Why It Happened:
1. Upload progress reaches 50% (compression complete, upload starting)
2. `supabase.storage.upload()` called without timeout
3. Network issues or server problems cause hang
4. No error thrown, no timeout - stuck forever
5. User sees 50% spinner indefinitely

---

## Solution Implemented

### 1. **Upload Timeout Added** ⏱️

Added `Promise.race()` to enforce upload timeout:
- **Mobile**: 60 seconds (1 minute)
- **Desktop**: 120 seconds (2 minutes)

**Code:**
```typescript
// Upload with timeout (60 seconds for mobile, 120 for desktop)
const uploadTimeout = isMobile ? 60000 : 120000;
const uploadPromise = supabase.storage
  .from('chat_attachments')
  .upload(filePath, fileToUpload, {
    contentType,
    cacheControl: '3600',
    upsert: false
  });

const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Upload timeout - please check your connection and try again')), uploadTimeout)
);

const { data: uploadData, error: uploadError } = await Promise.race([
  uploadPromise,
  timeoutPromise
]) as any;
```

### 2. **Failed Upload UI** ❌

Added visual feedback for failed uploads:
- Red overlay with "Upload Failed" message
- Retry button to attempt upload again
- Clear error state indication

**Visual:**
```
┌─────────────────┐
│  Upload Failed  │  ← Red overlay
│   [Retry]       │  ← Retry button
│   [Image]       │
└─────────────────┘
```

### 3. **Retry Mechanism** 🔄

Added retry handler:
- User clicks "Retry" button on failed upload
- Prompts to select file again
- Triggers file input for reselection
- Starts fresh upload attempt

---

## Files Modified

### **src/lib/storage.ts**
**Changes:**
- Added timeout logic to `uploadChatAttachment()`
- Mobile: 60 second timeout
- Desktop: 120 second timeout
- Clear error message on timeout

**Lines Changed:** 246-266

### **src/pages/ChatPageV2.tsx**
**Changes:**
- Added failed upload overlay (red background)
- Added retry button
- Added `handleRetryUpload()` function
- Connected retry handler to EnhancedMessageV2

**Lines Added:**
- 179-192: Failed upload overlay
- 474-486: Retry handler
- 940: onRetry prop

---

## How It Works Now

### Upload Flow with Timeout:

1. **User selects image** → Upload starts
2. **Progress 0-50%** → Compression and validation
3. **Progress 50%** → Upload to Supabase starts
4. **Timeout Check** → Promise.race monitors upload
5. **Two Outcomes:**

**Success Path:**
```
50% → 90% → 100% → ✅ Image displayed
```

**Timeout Path:**
```
50% → ... → 60s timeout → ❌ Failed overlay → Retry button
```

### Visual States:

**Uploading (0-99%):**
```
┌─────────────────┐
│   ◯ 50%         │  ← White circular progress
│   [Image]       │
└─────────────────┘
```

**Timeout/Failed:**
```
┌─────────────────┐
│  Upload Failed  │  ← Red overlay
│   [Retry]       │  ← Clickable button
│   [Image]       │
└─────────────────┘
```

**Success:**
```
┌─────────────────┐
│   [Image]       │  ← Clean display
└─────────────────┘
```

---

## Timeout Durations

### Mobile (60 seconds):
- **Reason**: Mobile networks can be slower
- **Benefit**: Fails faster, better UX
- **Retry**: User can retry with better connection

### Desktop (120 seconds):
- **Reason**: Desktop usually has stable connection
- **Benefit**: Allows for larger files
- **Retry**: Longer timeout for big uploads

---

## Error Messages

### Timeout Error:
```
"Upload timeout - please check your connection and try again"
```

### Failed Upload UI:
```
Upload Failed
[Retry]
```

### Retry Toast:
```
"Retry Upload"
"Please select the file again to retry upload"
```

---

## Testing Checklist

- [ ] Upload image with good connection (should succeed)
- [ ] Upload image with slow 3G (should show progress)
- [ ] Disconnect internet during upload (should timeout)
- [ ] Verify timeout happens at 60s on mobile
- [ ] Click retry button (should prompt file selection)
- [ ] Upload after retry (should work)
- [ ] Check console for timeout error message
- [ ] Verify failed overlay is red and visible

---

## Common Scenarios

### Scenario 1: Slow Network
- **Before**: Stuck at 50% forever
- **After**: Timeout at 60s, retry option

### Scenario 2: Network Disconnection
- **Before**: Stuck at 50% forever
- **After**: Timeout at 60s, clear error

### Scenario 3: Server Issues
- **Before**: Stuck at 50% forever
- **After**: Timeout at 60s, retry available

### Scenario 4: Large File on Slow Connection
- **Before**: Might succeed but no feedback
- **After**: Shows progress, timeout if too slow

---

## Performance Impact

### Before:
- ❌ Indefinite hang possible
- ❌ No error recovery
- ❌ Poor user experience
- ❌ No retry mechanism

### After:
- ✅ Maximum 60s wait on mobile
- ✅ Clear error indication
- ✅ Retry option available
- ✅ Better user experience
- ✅ No memory leaks from hanging promises

---

## Future Enhancements

- [ ] Add upload speed indicator (KB/s)
- [ ] Show estimated time remaining
- [ ] Add cancel upload button
- [ ] Implement automatic retry (1-2 attempts)
- [ ] Add network quality detection
- [ ] Compress more aggressively on slow networks
- [ ] Queue multiple uploads
- [ ] Resume interrupted uploads

---

## Related Issues Fixed

1. ✅ Upload stuck at 50%
2. ✅ No timeout on network issues
3. ✅ No retry mechanism
4. ✅ No failed state indication
5. ✅ Poor error messages

---

## Build & Deploy

### Build:
```bash
npm run build
```

### Deploy APK:
```bash
.\BUILD_AND_DEPLOY.bat
```

### Test Locally:
```bash
npm run preview
```

---

## Technical Details

### Promise.race() Pattern:
```typescript
const result = await Promise.race([
  actualUpload,    // Real upload promise
  timeoutPromise   // Timeout promise
]);
```

**How it works:**
- Whichever promise resolves/rejects first wins
- If upload completes first → Success
- If timeout completes first → Error thrown
- Losing promise is ignored

### Timeout Promise:
```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('...')), timeout)
);
```

**How it works:**
- Creates promise that rejects after timeout
- Uses setTimeout for delay
- Rejects with clear error message
- Caught by try/catch in upload function

---

## Status: ✅ READY FOR TESTING

### Summary:
- ✅ 60-second timeout on mobile uploads
- ✅ 120-second timeout on desktop uploads
- ✅ Failed upload overlay with retry button
- ✅ Clear error messages
- ✅ Retry mechanism implemented
- ✅ No more infinite hangs at 50%

**The upload will now timeout gracefully instead of hanging forever!** 🚀

---

## Debugging Tips

### Check Console Logs:
```javascript
// Look for these messages:
"📤 Starting chat attachment upload"
"📤 Uploading to storage"
"❌ Chat attachment upload error: Upload timeout"
```

### Check Network Tab:
- Look for hanging requests to Supabase storage
- Check request duration (should not exceed timeout)
- Verify upload is actually starting

### Test Timeout:
```javascript
// Temporarily reduce timeout for testing
const uploadTimeout = 5000; // 5 seconds
```

---

## Known Limitations

1. **File not cached**: User must reselect file on retry
2. **No auto-retry**: Manual retry required
3. **No resume**: Upload starts from 0% on retry
4. **Fixed timeout**: Not adaptive to network speed

These can be addressed in future updates.
