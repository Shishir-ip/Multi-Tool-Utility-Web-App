import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type VideoCompatibilityStatus = 
  | 'checking'
  | 'native'
  | 'transcoding'
  | 'ready'
  | 'error';

export interface VideoProcessingState {
  status: VideoCompatibilityStatus;
  progress: number;
  message: string;
  error?: string;
}

export interface ProcessedVideo {
  sourceFile: File;
  sourceUrl: string;
  previewFile?: Blob;
  previewUrl?: string;
  duration: number;
  width: number;
  height: number;
  isNativePlayable: boolean;
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

/**
 * Initialize FFmpeg WASM instance (lazy loaded)
 */
export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (ffmpegLoading) {
    return ffmpegLoading;
  }

  ffmpegLoading = (async () => {
    const ffmpeg = new FFmpeg();
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoading;
}

/**
 * Check if browser can natively play the video
 */
export function checkNativePlayback(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    let resolved = false;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    };

    // Set timeout for cases where no events fire
    const timeout = setTimeout(cleanup, 5000);

    video.oncanplay = () => {
      clearTimeout(timeout);
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(url);
        resolve(true);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
    };

    // Check canPlayType first as a quick check
    const canPlay = video.canPlayType(file.type);
    if (canPlay === '') {
      clearTimeout(timeout);
      cleanup();
      return;
    }

    video.src = url;
    video.load();
  });
}

/**
 * Get video metadata
 */
export function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };

    video.preload = 'metadata';
    video.src = url;
  });
}

/**
 * Transcode video to browser-compatible format using FFmpeg
 */
export async function transcodeVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  const inputName = 'input' + getExtension(file.name);
  const outputName = 'output.mp4';

  // Write input file to FFmpeg filesystem
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Set up progress monitoring
  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress && progress >= 0 && progress <= 1) {
      onProgress(Math.round(progress * 100));
    }
  });

  // Transcode to H.264/AAC in MP4 container
  // Using conservative settings for maximum compatibility
  await ffmpeg.exec([
    '-i', inputName,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    outputName,
  ]);

  // Read output file
  const data = await ffmpeg.readFile(outputName);
  
  // Clean up FFmpeg filesystem
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  // Convert to Blob - ensure we have a proper ArrayBuffer
  const uint8Array = data as Uint8Array;
  const arrayBuffer = uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength
  ) as ArrayBuffer;
  
  return new Blob([arrayBuffer], { type: 'video/mp4' });
}

/**
 * Process video with automatic compatibility handling
 */
export async function processVideo(
  file: File,
  onStateChange: (state: VideoProcessingState) => void
): Promise<ProcessedVideo> {
  const sourceUrl = URL.createObjectURL(file);

  try {
    // Step 1: Get metadata
    onStateChange({
      status: 'checking',
      progress: 0,
      message: 'Analyzing video...',
    });

    const metadata = await getVideoMetadata(file);

    // Step 2: Check native playback
    onStateChange({
      status: 'checking',
      progress: 20,
      message: 'Checking browser compatibility...',
    });

    const isNativePlayable = await checkNativePlayback(file);

    if (isNativePlayable) {
      // Native playback works - use original file
      onStateChange({
        status: 'native',
        progress: 100,
        message: 'Video ready',
      });

      return {
        sourceFile: file,
        sourceUrl,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        isNativePlayable: true,
      };
    }

    // Step 3: Transcode with FFmpeg
    onStateChange({
      status: 'transcoding',
      progress: 0,
      message: 'Preparing compatible preview...',
    });

    const previewFile = await transcodeVideo(file, (progress) => {
      onStateChange({
        status: 'transcoding',
        progress: Math.round(progress * 0.8), // Reserve 20% for finalization
        message: `Converting video... ${progress}%`,
      });
    });

    const previewUrl = URL.createObjectURL(previewFile);

    onStateChange({
      status: 'ready',
      progress: 100,
      message: 'Video ready',
    });

    return {
      sourceFile: file,
      sourceUrl,
      previewFile,
      previewUrl,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      isNativePlayable: false,
    };
  } catch (error) {
    // Clean up on error
    URL.revokeObjectURL(sourceUrl);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    onStateChange({
      status: 'error',
      progress: 0,
      message: 'Processing failed',
      error: errorMessage,
    });

    throw error;
  }
}

/**
 * Clean up processed video resources
 */
export function cleanupProcessedVideo(video: ProcessedVideo) {
  URL.revokeObjectURL(video.sourceUrl);
  if (video.previewUrl) {
    URL.revokeObjectURL(video.previewUrl);
  }
}

/**
 * Get file extension
 */
function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? `.${ext}` : '';
}

/**
 * Check if FFmpeg is supported in the browser
 */
export function isFFmpegSupported(): boolean {
  return typeof WebAssembly !== 'undefined' && 
         typeof SharedArrayBuffer !== 'undefined';
}
