import { useState, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';

export default function PhotoToPdf() {
  const [images, setImages] = useState<{ file: File; url: string; preview: string }[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newImages = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      preview: URL.createObjectURL(file)
    }));
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

  const convertToPdf = () => {
    if (images.length === 0) return;
    const pdf = new jsPDF({ orientation, unit: 'mm' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    images.forEach((img, index) => {
      if (index > 0) pdf.addPage();
      const tempImg = new Image();
      tempImg.src = img.url;
      const imgRatio = tempImg.width / tempImg.height;
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
      pdf.addImage(img.url, 'JPEG', x, y, drawWidth, drawHeight);
    });

    pdf.save('photos.pdf');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="tool-container">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-file-pdf mr-2" style={{ color: '#ef4444' }}></i>
          Photo to PDF Converter
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Upload images and convert them to a PDF document</p>
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
          onChange={e => handleFiles(e.target.files)}
        />
        <i className="fas fa-cloud-upload-alt text-4xl mb-3" style={{ color: 'var(--accent)' }}></i>
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
          Drop images here or click to upload
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Supports JPG, PNG, WEBP
        </p>
      </div>

      {/* Orientation Controls */}
      <div className="flex items-center gap-4 mb-6">
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Page Orientation:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setOrientation('portrait')}
            className="btn-secondary flex items-center gap-2"
            style={{ background: orientation === 'portrait' ? 'var(--accent)' : undefined, color: orientation === 'portrait' ? 'white' : undefined }}
          >
            <i className="fas fa-mobile-alt"></i> Portrait
          </button>
          <button
            onClick={() => setOrientation('landscape')}
            className="btn-secondary flex items-center gap-2"
            style={{ background: orientation === 'landscape' ? 'var(--accent)' : undefined, color: orientation === 'landscape' ? 'white' : undefined }}
          >
            <i className="fas fa-mobile-alt fa-rotate-90"></i> Landscape
          </button>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {images.length} image{images.length !== 1 ? 's' : ''} selected
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                <img src={img.preview} alt="" className="w-full h-32 object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-times"></i>
                </button>
                <div className="p-2 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  Page {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convert Button */}
      <button
        onClick={convertToPdf}
        disabled={images.length === 0}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i className="fas fa-file-pdf"></i>
        Convert & Download PDF
      </button>
    </div>
  );
}
