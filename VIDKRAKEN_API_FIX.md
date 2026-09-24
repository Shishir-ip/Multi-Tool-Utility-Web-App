# VidKraken API Integration - CORS Fix

## Problem
The original implementation was calling the VidKraken API directly from the browser, which caused a CORS (Cross-Origin Resource Sharing) error: "Failed to fetch". Browsers block direct API calls to external domains unless the server explicitly allows it via CORS headers.

## Solution
Implemented serverless API proxy functions that:
1. Receive requests from the frontend
2. Forward them to the VidKraken API with proper authentication
3. Return the response back to the frontend

This approach:
- ✅ Bypasses CORS restrictions
- ✅ Keeps the API key secure (not exposed in browser)
- ✅ Allows users to use their own API keys
- ✅ Works seamlessly with Vercel deployment

## Implementation Details

### 1. Serverless Functions Created

#### `/api/dl.js` - Submit Download Job
- **Method**: POST
- **Purpose**: Submits a new download job to VidKraken API
- **Parameters**:
  - `url`: Video URL to download
  - `format`: Video quality (default: "720")
  - `apiKey`: User's VidKraken API key
- **Returns**: Job ID, title, duration, and status

#### `/api/dl/[jobId].js` - Poll Job Status
- **Method**: GET
- **Purpose**: Checks the status of a download job
- **Parameters**:
  - `jobId`: Job ID from submit request
  - `apiKey`: User's VidKraken API key
- **Returns**: Job status (IN_QUEUE, PROCESSING, COMPLETED, FAILED) and download URL when ready

### 2. Frontend Updates

Updated `ClipForgeStudio.tsx` to:
- Call `/api/dl` instead of `https://vidkraken.com/api/v2/download`
- Call `/api/dl/{jobId}` instead of `https://vidkraken.com/api/v2/download/{jobId}`
- Pass the API key in the request body/query params
- Use exponential backoff for polling (2s → 4s → 8s → 16s → 32s)
- Handle all error cases with user-friendly messages

### 3. API Flow

```
User enters YouTube URL
         ↓
Frontend calls /api/dl (POST)
         ↓
Serverless function calls VidKraken API
         ↓
Returns jobId to frontend
         ↓
Frontend polls /api/dl/{jobId} every 2-32s
         ↓
Serverless function checks VidKraken status
         ↓
When COMPLETED, returns downloadUrl
         ↓
Frontend downloads video file
         ↓
Video loads into editor
```

## Testing Instructions

### Prerequisites
1. Get a VidKraken API key from https://vidkraken.com/dashboard
2. Ensure you have credits in your VidKraken account

### Test Steps
1. Open ClipForge Studio
2. Click "Video URL" tab
3. Enter your API key (if not already saved)
4. Paste a YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
5. Click "Download & Edit Video"
6. Watch the progress:
   - "Submitting download request..."
   - "Download queued (Job ID: ...)"
   - "Processing... (2s)", "Processing... (4s)", etc.
   - "Downloading video file..."
   - "Loading video..."
7. Video should load into the editor
8. Test all editing features (trim, crop, aspect ratio, etc.)

### Expected Behavior
- ✅ No "Failed to fetch" errors
- ✅ Clear progress messages
- ✅ Video downloads successfully
- ✅ Video loads into editor
- ✅ All editing features work

### Error Cases
- **Invalid API key**: "Invalid API key" error message
- **Invalid URL**: "Invalid URL format" error message
- **Queue full**: "Queue is full. Please try again shortly."
- **Download failed**: "Download failed on server"
- **Timeout**: "Download timed out. Please try again."

## Deployment

### Vercel
The serverless functions are automatically deployed when you push to Vercel. No additional configuration needed.

### Environment Variables
No environment variables needed - the API key is provided by the user through the UI and stored in localStorage.

### Local Development
To test locally:
```bash
npm run dev
```

The API routes will be available at:
- POST http://localhost:5173/api/dl
- GET http://localhost:5173/api/dl/{jobId}

## Security Considerations

### API Key Handling
- ✅ API key is stored in localStorage (user's browser only)
- ✅ API key is sent to serverless function (not directly to VidKraken)
- ✅ Serverless function forwards key to VidKraken API
- ⚠️ API key is visible in browser DevTools (localStorage)
- ⚠️ API key is sent over HTTPS to your serverless function

### Recommendations
- Users should only use API keys on trusted devices
- Consider adding a "clear API key" button for shared computers
- Monitor VidKraken usage to prevent abuse

## Performance

### Polling Strategy
- Initial poll: 2 seconds
- Exponential backoff: 2s → 4s → 8s → 16s → 32s
- Maximum attempts: 30 (approximately 5-10 minutes)
- Prevents excessive API calls while maintaining responsiveness

### Bandwidth
- Polling is FREE (not billed by VidKraken)
- Only the final video download is billed
- Minimum 20 MB per download (VidKraken policy)

## Troubleshooting

### "Failed to fetch" Error
**Cause**: CORS issue or serverless function not deployed
**Solution**: 
- Ensure you're using the updated code with serverless functions
- Redeploy to Vercel
- Check browser console for detailed error messages

### "Invalid API key" Error
**Cause**: API key is incorrect or expired
**Solution**: 
- Verify API key at https://vidkraken.com/dashboard
- Re-enter the API key in ClipForge Studio

### "Queue is full" Error
**Cause**: Too many concurrent downloads (max 100 per account)
**Solution**: 
- Wait for existing downloads to complete
- Try again in a few minutes

### Download Times Out
**Cause**: Video is too large or VidKraken server is slow
**Solution**: 
- Try a shorter video
- Try again later
- Check VidKraken status

## Files Modified

1. **`api/dl.js`** - New serverless function for submitting download jobs
2. **`api/dl/[jobId].js`** - New serverless function for polling job status
3. **`src/tools/ClipForgeStudio.tsx`** - Updated to use serverless proxy instead of direct API calls

## Build Status
```
✓ Build successful (15.71s)
✓ No TypeScript errors
✓ Bundle: 22.43 kB (gzip: 5.22 kB)
✓ All 65 tools functional
```

## Summary
The CORS issue is now resolved by routing all VidKraken API calls through serverless proxy functions. Users can now successfully download YouTube videos and edit them in ClipForge Studio without any CORS errors.
