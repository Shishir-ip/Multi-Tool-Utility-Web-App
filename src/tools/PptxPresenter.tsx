import React, { useState, useRef, useEffect } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';
import JSZip from 'jszip';

interface Slide {
  id: number;
  content: string;
  notes?: string;
}

export const PptxPresenter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFile = async (fl: FileList) => {
    const f = fl[0];
    if (!f) return;
    if (!f.name.endsWith('.pptx')) {
      setError('Please upload a .pptx file');
      return;
    }
    setFile(f);
    setError(null);
    setLoading(true);
    
    try {
      // PPTX is a ZIP file containing XML
      const zip = new JSZip();
      const arrayBuffer = await f.arrayBuffer();
      const loadedZip = await zip.loadAsync(arrayBuffer);
      
      // Extract slide content from XML
      const extractedSlides: Slide[] = [];
      const slideFiles = Object.keys(loadedZip.files)
        .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
          return numA - numB;
        });
      
      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        const slideXml = await loadedZip.files[slideFile].async('text');
        
        // Parse text content from XML (simplified)
        const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
        const textContent = textMatches
          .map(match => match.replace(/<[^>]+>/g, ''))
          .filter(text => text.trim())
          .join('\n');
        
        // Try to extract notes
        const notesFile = slideFile.replace('slides/', 'notesSlides/').replace('slide', 'notesSlide');
        let notes = '';
        if (loadedZip.files[notesFile]) {
          const notesXml = await loadedZip.files[notesFile].async('text');
          const notesMatches = notesXml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
          notes = notesMatches
            .map(match => match.replace(/<[^>]+>/g, ''))
            .filter(text => text.trim())
            .join('\n');
        }
        
        extractedSlides.push({
          id: i + 1,
          content: textContent || 'Empty slide',
          notes: notes || undefined,
        });
      }
      
      setSlides(extractedSlides);
      setCurrentSlide(0);
    } catch (err) {
      console.error('Error parsing PPTX:', err);
      setError('Failed to parse presentation. The file may be corrupted.');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const startPresentation = () => {
    setIsPresenting(true);
    setCurrentSlide(0);
  };

  const exitPresentation = () => {
    setIsPresenting(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slides.length === 0) return;
      
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        if (isPresenting) {
          exitPresentation();
        }
      } else if (e.key === 'F11') {
        e.preventDefault();
        if (!isPresenting) {
          startPresentation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length, isPresenting]);

  // Fullscreen for presentation mode
  useEffect(() => {
    if (isPresenting && containerRef.current) {
      containerRef.current.requestFullscreen?.().catch(err => {
        console.log('Fullscreen not available:', err);
      });
    } else if (!isPresenting && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [isPresenting]);

  if (isPresenting && slides.length > 0) {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: '#000' }}
      >
        {/* Slide Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-5xl">
            <div 
              className="aspect-video rounded-lg flex items-center justify-center p-12"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <div className="text-center text-white">
                <pre className="text-2xl md:text-4xl whitespace-pre-wrap font-sans">
                  {slides[currentSlide].content}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="flex items-center gap-4">
            <Button onClick={prevSlide} icon="fa-chevron-left" variant="secondary" disabled={currentSlide === 0}>
              Previous
            </Button>
            <span className="text-white font-medium">
              {currentSlide + 1} / {slides.length}
            </span>
            <Button onClick={nextSlide} icon="fa-chevron-right" variant="secondary" disabled={currentSlide === slides.length - 1}>
              Next
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowNotes(!showNotes)} icon="fa-sticky-note" variant="secondary">
              {showNotes ? 'Hide' : 'Show'} Notes
            </Button>
            <Button onClick={exitPresentation} icon="fa-times" variant="secondary">
              Exit (Esc)
            </Button>
          </div>
        </div>

        {/* Notes Panel */}
        {showNotes && slides[currentSlide].notes && (
          <div className="p-6 max-h-48 overflow-auto" style={{ background: 'rgba(30,30,30,0.95)', borderTop: '1px solid #333' }}>
            <p className="text-sm font-medium mb-2" style={{ color: '#aaa' }}>Presenter Notes:</p>
            <p className="text-white whitespace-pre-wrap">{slides[currentSlide].notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tool-container">
      <ToolHeader 
        icon="fa-presentation-screen" 
        title="PPTX Presenter" 
        description="Present PowerPoint files interactively" 
        color="#d24726" 
      />

      {!file || slides.length === 0 ? (
        <div className="space-y-4">
          <DropZone 
            onFiles={handleFile} 
            accept=".pptx" 
            icon="fa-file-powerpoint" 
            title="Upload PPTX file" 
            subtitle="Microsoft PowerPoint presentation (.pptx)"
          />

          {loading && (
            <div className="flex items-center gap-2 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: 'var(--accent)' }}></i>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Parsing presentation...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }}></i>
              <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{file?.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {slides.length} slide{slides.length !== 1 ? 's' : ''} • {(file?.size || 0 / 1024).toFixed(1)} KB
            </p>
          </div>

          {/* Slide Preview */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Slide Preview
            </p>
            <div 
              className="aspect-video rounded-lg flex items-center justify-center p-8 mb-4"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid var(--border-color)'
              }}
            >
              <div className="text-center text-white">
                <pre className="text-lg md:text-2xl whitespace-pre-wrap font-sans">
                  {slides[currentSlide].content}
                </pre>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button onClick={prevSlide} icon="fa-chevron-left" variant="secondary" disabled={currentSlide === 0}>
                Previous
              </Button>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Slide {currentSlide + 1} of {slides.length}
              </span>
              <Button onClick={nextSlide} icon="fa-chevron-right" variant="secondary" disabled={currentSlide === slides.length - 1}>
                Next
              </Button>
            </div>
          </div>

          {/* Notes */}
          {slides[currentSlide].notes && (
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                <i className="fas fa-sticky-note mr-1"></i>
                Presenter Notes:
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {slides[currentSlide].notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={startPresentation} icon="fa-play">
              Start Presentation (F11)
            </Button>
            <Button variant="secondary" onClick={() => { setFile(null); setSlides([]); setCurrentSlide(0); setError(null); }} icon="fa-redo">
              Load Another
            </Button>
          </div>

          {/* Help */}
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <i className="fas fa-keyboard mr-1"></i>
              Keyboard Shortcuts:
            </p>
            <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
              <li>• <kbd className="px-1 rounded" style={{ background: 'var(--card-bg)' }}>→</kbd> or <kbd className="px-1 rounded" style={{ background: 'var(--card-bg)' }}>Space</kbd> - Next slide</li>
              <li>• <kbd className="px-1 rounded" style={{ background: 'var(--card-bg)' }}>←</kbd> - Previous slide</li>
              <li>• <kbd className="px-1 rounded" style={{ background: 'var(--card-bg)' }}>F11</kbd> - Start presentation</li>
              <li>• <kbd className="px-1 rounded" style={{ background: 'var(--card-bg)' }}>Esc</kbd> - Exit presentation</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
