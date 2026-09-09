import { useState, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';

interface ImageItem {
  file: File;
  url: string;
  dataUrl: string;
  width: number;
  height: number;
}

export default function PhotoToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [dragActive, setDragActive] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load an image file into an ImageItem with pre-computed data URL and dimensions
  const loadImageItem = (file: File): Promise<ImageItem> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        // Draw to canvas to get a compressed JPEG data URL (avoids blob URL issues with jsPDF)
        const maxDim = 2400; // cap for performance
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ file, url, dataUrl, width: w, height: h });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    // Load images sequentially to avoid overwhelming the main thread
    const newImages: ImageItem[] = [];
    for (const file of imageFiles) {
      try {
        const item = await loadImageItem(file);
        newImages.push(item);
      } catch (err) {
        console.error('Skipping invalid image:', err);
      }
    }
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = (index: number) => {
    setImages(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].url);
      copy.splice(index, 1);
      return copy;
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setProgress(0);
  };

  const convertToPdf = async () => {
    if (images.length === 0 || converting) return;
    setConverting(true);
    setProgress(0);

    try {
      const pdf = new jsPDF({ orientation, unit: 'mm', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (i > 0) pdf.addPage();

        // Calculate fit dimensions maintaining aspect ratio
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;
        let drawWidth = pageWidth;
        let drawHeight = pageHeight;
        if (imgRatio > pageRatio) {
          drawHeight = pageWidth / imgRatio;
        } else {
          drawWidth = pageHeight * imgRatio;
        }
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        // Use the pre-compressed dataUrl (JPEG) — this is what jsPDF needs
        pdf.addImage(img.dataUrl, 'JPEG', x, y, drawWidth, drawHeight, undefined, 'FAST');

        // Yield to the main thread between images so the UI stays responsive
        setProgress(Math.round(((i + 1) / images.length) * 100));
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 16)); // ~1 frame
        }
      }

      // Trigger the download — use save() which internally creates a blob URL
      pdf.save('converted-documents.pdf');
    } catch (err) {
      console.error('PDF conversion error:', err);
      alert('An error occurred while converting to PDF. Please try again.');
    } finally {
      setConverting(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="tool-container">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-file-pdf mr-2" style={{ color: '#ef4444' }}></i>
          Photo to PDF Converter
        </h2>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>Upload images and convert them to a PDF document</p>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone mb-6 ${dragActive ? 'active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => { handleFiles(e.target.files); if (fileRef.current) fileRef.current.value = ''; }}
        />
        <i className="fas fa-cloud-upload-alt text-3xl sm:text-4xl mb-3" style={{ color: 'var(--accent)' }}></i>
        <p className="font-medium text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
          Drop images here or click to upload
        </p>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Supports JPG, PNG, WEBP
        </p>
      </div>

      {/* Orientation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Page Orientation:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setOrientation('portrait')}
            className="btn-secondary flex items-center gap-2 text-sm"
            style={{
              background: orientation === 'portrait' ? 'var(--accent)' : undefined,
              color: orientation === 'portrait' ? 'white' : undefined,
              borderColor: orientation === 'portrait' ? 'var(--accent)' : undefined
            }}
          >
            <i className="fas fa-mobile-alt"></i> Portrait
          </button>
          <button
            onClick={() => setOrientation('landscape')}
            className="btn-secondary flex items-center gap-2 text-sm"
            style={{
              background: orientation === 'landscape' ? 'var(--accent)' : undefined,
              color: orientation === 'landscape' ? 'white' : undefined,
              borderColor: orientation === 'landscape' ? 'var(--accent)' : undefined
            }}
          >
            <i className="fas fa-mobile-alt fa-rotate-90"></i> Landscape
          </button>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
              {images.length} image{images.length !== 1 ? 's' : ''} selected
            </h3>
            <button onClick={clearAll} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              <i className="fas fa-trash-alt"></i> Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((img, i) => (
              <div key={`${img.url}-${i}`} className="relative rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <img src={img.dataUrl} alt={`Page ${i + 1}`} className="w-full h-28 sm:h-32 object-cover" />
                {/* Always-visible remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center shadow-lg transition-colors"
                  title="Remove image"
                  aria-label={`Remove image ${i + 1}`}
                >
                  <i className="fas fa-times text-[10px]"></i>
                </button>
                <div className="px-2 py-1.5 text-xs truncate flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>Page {i + 1}</span>
                  <span className="text-[10px] opacity-70">{img.width}×{img.height}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {converting && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Converting...</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
      )}

      {/* Convert Button */}
      <button
        onClick={convertToPdf}
        disabled={images.length === 0 || converting}
        className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {converting ? (
          <><i className="fas fa-spinner fa-spin"></i> Converting...</>
        ) : (
          <><i className="fas fa-file-pdf"></i> Convert & Download PDF</>
        )}
      </button>
    </div>
  );
}
