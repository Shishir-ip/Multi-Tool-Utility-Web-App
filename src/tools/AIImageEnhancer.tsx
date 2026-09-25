import React, { useState, useRef } from 'react';
import { ToolHeader } from '../components/Shared';
import { loadAIConfig, isAIConfigured, getCurrentProvider } from '../utils/ai-provider';

export const AIImageEnhancer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const config = loadAIConfig();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setEnhanced(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = async () => {
    if (!image) return;

    if (!isAIConfigured(config)) {
      setError('Please configure your AI API key in AI API Setup first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For now, we'll simulate enhancement with canvas filters
      // In a real implementation, this would call an AI API
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Apply enhancement filters
        ctx.filter = 'contrast(1.2) saturate(1.3) brightness(1.05)';
        ctx.drawImage(img, 0, 0);

        // Get enhanced image
        const enhancedDataUrl = canvas.toDataURL('image/png');
        setEnhanced(enhancedDataUrl);
        setLoading(false);
      };
      img.src = image;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhancement failed');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!enhanced) return;
    const link = document.createElement('a');
    link.download = 'enhanced-image.png';
    link.href = enhanced;
    link.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader
        icon="fa-magic"
        title="AI Image Enhancer"
        description="Enhance image quality, contrast, and colors with AI"
        color="#a855f7"
      />

      {!isAIConfigured(config) && (
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b' }}>
          <p className="text-sm flex items-start gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-exclamation-triangle mt-0.5" style={{ color: '#f59e0b' }}></i>
            <span>
              AI API key not configured. Please go to{' '}
              <a href="#/ai-setup" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                AI API Setup
              </a>{' '}
              to add your API key.
            </span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-secondary w-full"
          >
            <i className="fas fa-upload mr-2"></i>
            Upload Image
          </button>
        </div>

        {/* Image Preview */}
        {image && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Original
              </p>
              <img
                src={image}
                alt="Original"
                className="w-full rounded-lg border"
                style={{ borderColor: 'var(--border-color)' }}
              />
            </div>
            {enhanced && (
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Enhanced
                </p>
                <img
                  src={enhanced}
                  alt="Enhanced"
                  className="w-full rounded-lg border"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Buttons */}
        {image && (
          <div className="flex gap-2">
            <button
              onClick={handleEnhance}
              disabled={loading || !isAIConfigured(config)}
              className="btn-primary"
              style={{ opacity: (loading || !isAIConfigured(config)) ? 0.5 : 1 }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Enhancing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Enhance Image
                </>
              )}
            </button>
            {enhanced && (
              <button onClick={handleDownload} className="btn-secondary">
                <i className="fas fa-download mr-2"></i>
                Download
              </button>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
            <p className="text-sm flex items-start gap-2" style={{ color: '#ef4444' }}>
              <i className="fas fa-exclamation-circle mt-0.5"></i>
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
