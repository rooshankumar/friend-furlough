# Quick Test Guide - Mobile File Upload

## What Changed?

Applied successful patterns from document upload code to improve chat attachments on mobile.

## Key Improvements

1. ✅ **Better file validation** - Shows exact file size in error messages
2. ✅ **Progress indicator** - Visual progress bar with percentage
3. ✅ **File name display** - Shows which file is uploading
4. ✅ **Async support** - Properly handles async upload operations
5. ✅ **Mobile web support** - Now works on Chrome mobile browser

## Quick Test (Chrome Mobile)

### 1. Open Chat
```
1. Open friend-furlough in Chrome on Android
2. Navigate to chat page
3. Select a conversation
```

### 2. Upload Image
```
1. Click the paperclip (📎) button
2. Select an image from gallery
3. Watch for:
   ✅ Progress popup appears above button
   ✅ File name is displayed
   ✅ Progress bar shows percentage (10% → 100%)
   ✅ Upload completes successfully
   ✅ Image appears in chat
```

### 3. Test Validation
```
Test 1: Large File (>20MB)
- Select a large video file
- Should show: "File too large: Maximum size: 20MB (current: XXmb)"

Test 2: Invalid Type
- Try to select an unsupported file type
- Should show: "Invalid file type: Accepted types: ..."
```

### 4. Check Console
```
Open Chrome DevTools (chrome://inspect)
Look for logs:
📱 Mobile file selected: { name: '...', size: '...MB', type: '...' }
📤 Starting mobile upload: ...
✅ Mobile upload successful
```

## What to Look For

### ✅ Success Indicators
- Progress popup appears immediately
- File name is visible
- Progress bar animates smoothly
- Upload completes within 5-10 seconds
- Message appears in chat with attachment
- No errors in console

### ❌ Failure Indicators
- No progress popup
- File input doesn't open
- Upload hangs at 90%
- Error toast appears
- Console shows errors

## Comparison: Before vs After

### Before
```
❌ No visual feedback during upload
❌ Generic error messages
❌ No file name display
❌ Hard to debug on mobile
❌ Inconsistent behavior
```

### After
```
✅ Visual progress indicator
✅ Detailed error messages with file size
✅ File name displayed during upload
✅ Detailed console logging
✅ Consistent behavior across devices
```

## Files Changed

1. **MobileFileInput.tsx** - Enhanced with progress tracking
2. **ChatPageV2.tsx** - Now uses MobileFileInput for mobile web
3. **ImprovedFileUpload.tsx** - New reusable component (optional)

## Build & Deploy

```bash
# Build web app
npm run build

# Test locally
npm run dev

# Deploy (if needed)
# ... your deployment process
```

## Troubleshooting

### Issue: Progress not showing
**Check:**
- Is `showProgress={true}` set in ChatPageV2.tsx?
- Is Progress component imported?
- Check browser console for errors

### Issue: File input not opening
**Check:**
- Is button disabled?
- Is user online?
- Check console for click events

### Issue: Upload fails silently
**Check:**
- Browser console for errors
- Network tab for failed requests
- Supabase storage bucket permissions

## Expected Behavior

### Mobile Web (Chrome)
1. Click paperclip button
2. Native file picker opens
3. Select file
4. Progress popup appears
5. Progress bar animates 10% → 100%
6. Upload completes
7. Message appears in chat

### Mobile App (APK)
Same as mobile web, but may use native file picker

### Desktop
Falls back to standard file input (no changes)

## Success Criteria

✅ File upload works on Chrome mobile
✅ Progress indicator is visible
✅ File name is displayed
✅ Upload completes successfully
✅ Error messages are clear
✅ No console errors

## Next Steps After Testing

1. ✅ Verify upload works on Chrome mobile
2. ✅ Test with different file types
3. ✅ Test file size validation
4. ✅ Check error handling
5. ✅ Monitor upload success rate

## Need Help?

Check these files for debugging:
- `src/components/MobileFileInput.tsx` - Upload component
- `src/pages/ChatPageV2.tsx` - Chat page integration
- `src/stores/chatStore.ts` - Upload logic
- `src/lib/storage.ts` - Storage upload function

Look for these console logs:
```
📱 Mobile file selected: ...
📤 Starting mobile upload: ...
📊 Upload progress: ...%
✅ Mobile upload successful
```

## Summary

The mobile file upload has been improved with:
- ✅ Visual progress tracking
- ✅ Better validation and error messages
- ✅ File name display
- ✅ Async upload support
- ✅ Mobile web compatibility

**Ready to test on Chrome mobile browser!** 🚀
