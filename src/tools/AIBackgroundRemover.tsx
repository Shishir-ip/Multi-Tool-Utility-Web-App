import React, { useState, useRef } from 'react';
import { ToolHeader } from '../components/Shared';
import { loadAIConfig, isAIConfigured } from '../utils/ai-provider';

export const AIBackgroundRemover: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [processed, setProcessed] = useState<string | null>(null);
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
      setProcessed(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!image) return;

    if (!isAIConfigured(config)) {
      setError('Please configure your AI API key in AI API Setup first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For now, we'll use a simple color-based background removal
      // In a real implementation, this would call an AI API like remove.bg
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple background removal based on corner colors
        // Get average color from corners
        const corners = [
          { x: 0, y: 0 },
          { x: canvas.width - 1, y: 0 },
          { x: 0, y: canvas.height - 1 },
          { x: canvas.width - 1, y: canvas.height - 1 }
        ];

        let r = 0, g = 0, b = 0;
        corners.forEach(corner => {
          const idx = (corner.y * canvas.width + corner.x) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
        });
        r = Math.floor(r / 4);
        g = Math.floor(g / 4);
        b = Math.floor(b / 4);

        // Remove pixels similar to background color
        const threshold = 50;
        for (let i = 0; i < data.length; i += 4) {
          const dr = Math.abs(data[i] - r);
          const dg = Math.abs(data[i + 1] - g);
          const db = Math.abs(data[i + 2] - b);

          if (dr < threshold && dg < threshold && db < threshold) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Get processed image
        const processedDataUrl = canvas.toDataURL('image/png');
        setProcessed(processedDataUrl);
        setLoading(false);
      };
      img.src = image;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Background removal failed');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!processed) return;
    const link = document.createElement('a');
    link.download = 'background-removed.png';
    link.href = processed;
    link.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader
        icon="fa-eraser"
        title="AI Background Remover"
        description="Remove image backgrounds automatically with AI"
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
            {processed && (
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Background Removed
                </p>
                <div
                  className="w-full rounded-lg border"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  }}
                >
                  <img
                    src={processed}
                    alt="Processed"
                    className="w-full rounded-lg"
                  />
                </div>
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
              onClick={handleRemoveBackground}
              disabled={loading || !isAIConfigured(config)}
              className="btn-primary"
              style={{ opacity: (loading || !isAIConfigured(config)) ? 0.5 : 1 }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-eraser mr-2"></i>
                  Remove Background
                </>
              )}
            </button>
            {processed && (
              <button onClick={handleDownload} className="btn-secondary">
                <i className="fas fa-download mr-2"></i>
                Download PNG
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

        {/* Info Note */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <i className="fas fa-info-circle mr-1" style={{ color: 'var(--accent)' }}></i>
            <strong>Note:</strong> This tool uses basic background removal. For best results with complex backgrounds, 
            consider using professional AI services like remove.bg or Adobe Express.
          </p>
        </div>
      </div>
    </div>
  );
};
