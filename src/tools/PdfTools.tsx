import React, { useState, useRef, useCallback } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

// ── PDF to Image ──
export const PdfToImage: React.FC = () => {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const loadPdf = (files: FileList) => {
    const file = files[0];
    if (!file) return;
    
    console.log('📄 PDF file selected:', file.name, 'Size:', file.size, 'bytes');
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      console.error('❌ Invalid file type:', file.type);
      setError('Please upload a valid PDF file.');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    // 1. Enforce worker source EXACTLY matching the library version
    console.log('🔧 Setting up PDF.js worker...');
    if ((window as any).pdfjsLib) {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      console.log('✅ PDF.js worker source set to:', (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc);
    } else {
      console.error('❌ pdfjsLib not found on window object!');
      setError('PDF.js library failed to load. Please refresh the page.');
      setLoading(false);
      return;
    }

    // 2. File Upload Listener with FileReader
    const fileReader = new FileReader();
    
    fileReader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        console.log('✅ PDF ArrayBuffer loaded. Byte length:', typedarray.length);

        // Explicitly pass data as an object
        console.log('📥 Loading PDF document...');
        const loadingTask = (window as any).pdfjsLib.getDocument({ data: typedarray });
        
        const pdf = await loadingTask.promise;
        console.log('✅ PDF parsed successfully! Total pages:', pdf.numPages);
        
        const totalPages = pdf.numPages;
        const imgs: string[] = [];

        // Render each page sequentially
        for (let i = 1; i <= totalPages; i++) {
          console.log(`📄 Rendering page ${i} of ${totalPages}...`);
          const page = await pdf.getPage(i);
          
          // Use high-DPI scale for crisp output
          const viewport = page.getViewport({ scale: 2.0 });
          console.log(`  Viewport dimensions: ${viewport.width}x${viewport.height}`);
          
          // Create off-screen canvas
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Failed to get canvas context');
          }

          // Set canvas dimensions
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Render PDF page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          } as any).promise;

          // Convert canvas to PNG data URL
          const dataUrl = canvas.toDataURL('image/png');
          imgs.push(dataUrl);
          console.log(`✅ Page ${i} rendered successfully`);

          // Update progress
          setProgress(Math.round((i / totalPages) * 100));

          // Clean up canvas to free memory
          canvas.width = 0;
          canvas.height = 0;
        }

        console.log('🎉 All pages rendered successfully!');
        setPages(imgs);
      } catch (error) {
        // Expose the REAL error to the console
        console.error('❌ CRITICAL PDF.JS ERROR:', error);
        console.error('Error Name:', (error as Error).name);
        console.error('Error Message:', (error as Error).message);
        console.error('Error Stack:', (error as Error).stack);
        
        // Show UI error with details
        setError(`Failed to load PDF. Details: ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fileReader.onerror = function() {
      console.error('❌ FileReader Error:', fileReader.error);
      setError('Failed to read the file. Please try again.');
      setLoading(false);
    };
    
    // MUST read as ArrayBuffer, not DataURL or Text
    console.log('📖 Reading file as ArrayBuffer...');
    fileReader.readAsArrayBuffer(file);
  };

  const downloadPage = (dataUrl: string, idx: number) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `page-${idx + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (pages.length === 0) return;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add each page to the zip
      for (let i = 0; i < pages.length; i++) {
        const dataUrl = pages[i];
        const base64Data = dataUrl.split(',')[1];
        zip.file(`page-${i + 1}.png`, base64Data, { base64: true });
      }

      // Generate and download zip
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pdf-pages.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Revoke object URL to free memory
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('ZIP creation failed:', err);
      alert('Failed to create ZIP file. Please try downloading pages individually.');
    }
  };

  const resetTool = () => {
    // Revoke all object URLs to prevent memory leaks
    pages.forEach(pageUrl => {
      if (pageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pageUrl);
      }
    });
    setPages([]);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-file-image" title="PDF to Image" description="Convert PDF pages to PNG images" color="#ef4444" />
      
      {pages.length === 0 ? (
        <div className="space-y-4">
          <DropZone onFiles={loadPdf} accept=".pdf" icon="fa-file-pdf" title="Upload a PDF file" subtitle="Each page will become a PNG image" />
          
          {error && (
            <div className="p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <p className="text-sm" style={{ color: '#ef4444' }}>
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </p>
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Processing PDF...</span>
                <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%`, background: 'var(--accent)' }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <i className="fas fa-check-circle mr-1" style={{ color: '#10b981' }}></i>
              Successfully extracted {pages.length} page{pages.length !== 1 ? 's' : ''}
            </p>
            {pages.length > 1 && (
              <Button onClick={downloadAllAsZip} icon="fa-file-archive" variant="secondary">
                Download All as ZIP
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((p, i) => (
              <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <img src={p} alt={`Page ${i + 1}`} className="w-full" />
                <div className="p-2 flex justify-between items-center" style={{ background: 'var(--bg-tertiary)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {i + 1}</span>
                  <button 
                    onClick={() => downloadPage(p, i)} 
                    className="text-xs px-2 py-1 rounded flex items-center gap-1" 
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    <i className="fas fa-download"></i> Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="secondary" onClick={resetTool} icon="fa-redo">Load Another PDF</Button>
        </div>
      )}
    </div>
  );
};

// ── PDF Merger ──
export const PdfMerger: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);

  const handleFiles = (fl: FileList) => {
    const pdfs = Array.from(fl).filter(f => f.type === 'application/pdf');
    setFiles(prev => [...prev, ...pdfs]);
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const merge = async () => {
    if (files.length < 2) return alert('Select at least 2 PDFs');
    setMerging(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const f of files) {
        const buf = await f.arrayBuffer();
        const src = await PDFDocument.load(buf);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'merged.pdf'; a.click();
    } catch (e) { console.error(e); alert('Merge failed'); }
    setMerging(false);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-object-group" title="PDF Merger" description="Combine multiple PDFs into one document" color="#ef4444" />
      <DropZone onFiles={handleFiles} accept=".pdf" multiple icon="fa-plus-circle" title="Add PDF files" subtitle="Select multiple PDFs to merge" />
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--accent)', color: 'white' }}>{i + 1}</span>
                <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>({(f.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-400 p-1"><i className="fas fa-times"></i></button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={merge} icon={merging ? 'fa-spinner fa-spin' : 'fa-object-group'} disabled={merging}>
              {merging ? 'Merging...' : `Merge ${files.length} PDFs`}
            </Button>
            <Button variant="secondary" onClick={() => setFiles([])} icon="fa-trash">Clear All</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── PDF Compressor ──
export const PdfCompressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(60);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ original: number; compressed: number } | null>(null);

  const handleFile = (fl: FileList) => { if (fl[0]) { setFile(fl[0]); setResult(null); } };

  const compress = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
      setResult({ original: file.size, compressed: bytes.length });
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `compressed-${file.name}`; a.click();
    } catch (e) { console.error(e); alert('Compression failed'); }
    setProcessing(false);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-compress" title="PDF Compressor" description="Reduce PDF file size" color="#ef4444" />
      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf" icon="fa-file-pdf" title="Upload PDF to compress" />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
              Optimization Level: {quality}%
            </label>
            <input type="range" min="20" max="100" value={quality} onChange={e => setQuality(+e.target.value)} className="w-full" />
          </div>
          {result && (
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Original: <strong>{(result.original / 1024).toFixed(1)} KB</strong> → Compressed: <strong>{(result.compressed / 1024).toFixed(1)} KB</strong>
                <span className="ml-2 text-green-500">({(100 - (result.compressed / result.original * 100)).toFixed(1)}% smaller)</span>
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={compress} icon={processing ? 'fa-spinner fa-spin' : 'fa-compress'} disabled={processing}>
              {processing ? 'Compressing...' : 'Compress & Download'}
            </Button>
            <Button variant="secondary" onClick={() => { setFile(null); setResult(null); }} icon="fa-redo">Choose Another</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── PDF Page Extractor ──
export const PdfExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageRange, setPageRange] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // Parse page range string to array of page numbers (1-indexed)
  const parsePageRange = (range: string, total: number): number[] => {
    if (!range.trim()) return [];
    const pages: number[] = [];
    range.split(',').forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= Math.min(end, total); i++) {
            if (i >= 1) pages.push(i);
          }
        }
      } else {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 1 && num <= total) {
          pages.push(num);
        }
      }
    });
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  // Convert array of page numbers to range string
  const pagesToRange = (pages: number[]): string => {
    if (pages.length === 0) return '';
    const sorted = [...pages].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        if (start === end) {
          ranges.push(start.toString());
        } else {
          ranges.push(`${start}-${end}`);
        }
        start = sorted[i];
        end = sorted[i];
      }
    }
    if (start === end) {
      ranges.push(start.toString());
    } else {
      ranges.push(`${start}-${end}`);
    }
    return ranges.join(',');
  };

  // Toggle page selection
  const togglePageSelection = (card: HTMLElement, pageNum: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
        card.classList.remove('selected');
      } else {
        next.add(pageNum);
        card.classList.add('selected');
      }
      // Sync to range input
      setPageRange(pagesToRange(Array.from(next)));
      return next;
    });
  };

  // Generate page thumbnails using direct DOM manipulation
  const generatePageThumbnails = async (pdf: any) => {
    const gridContainer = gridContainerRef.current;
    if (!gridContainer) {
      console.error("Target container #extractor-thumbnails-grid not found in DOM!");
      return;
    }

    gridContainer.innerHTML = ''; // Clear previous contents

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.35 });

        // Create Card Container
        const card = document.createElement('div');
        card.className = 'pdf-thumb-card';
        card.dataset.page = pageNum.toString();

        // Create Canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;
        
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Render Page to Canvas
        const renderContext = { canvasContext: context, viewport: viewport };
        const renderTask = page.render(renderContext);
        await renderTask.promise;

        // Page Label
        const label = document.createElement('span');
        label.className = 'thumb-label';
        label.textContent = `Page ${pageNum}`;

        // Selection Checkmark
        const checkmark = document.createElement('div');
        checkmark.className = 'thumb-checkmark';
        checkmark.innerHTML = '<i class="fas fa-check"></i>';

        card.appendChild(canvas);
        card.appendChild(label);
        card.appendChild(checkmark);
        
        // Selection Click Listener
        card.addEventListener('click', () => togglePageSelection(card, pageNum));

        // Append immediately to show progress
        gridContainer.appendChild(card);
        
      } catch (err) {
        console.error(`Error rendering preview for page ${pageNum}:`, err);
      }
    }
  };

  // Render thumbnails for all pages
  const renderThumbnails = async (pdfFile: File, totalPages: number) => {
    // Cancel any ongoing thumbnail generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoadingThumbnails(true);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      const arrayBuffer = await pdfFile.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      const pdf = await (window as any).pdfjsLib.getDocument({  typedArray }).promise;

      if (!signal.aborted) {
        await generatePageThumbnails(pdf);
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('Thumbnail generation failed:', error);
      }
    } finally {
      if (!signal.aborted) {
        setLoadingThumbnails(false);
      }
    }
  };

  const handleFile = async (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    
    // Reset state
    if (gridContainerRef.current) {
      gridContainerRef.current.innerHTML = '';
    }
    setSelectedPages(new Set());
    setPageRange('');
    
    setFile(f);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await f.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      const pageCount = pdf.getPageCount();
      setNumPages(pageCount);
      
      // Start rendering thumbnails
      renderThumbnails(f, pageCount);
    } catch (e) { 
      console.error('Invalid PDF:', e);
      alert('Invalid PDF'); 
    }
  };

  // Handle range input change - sync to thumbnails
  const handleRangeChange = (value: string) => {
    setPageRange(value);
    const pages = parsePageRange(value, numPages);
    setSelectedPages(new Set(pages));
    
    // Update DOM cards to match selection
    if (gridContainerRef.current) {
      const cards = gridContainerRef.current.querySelectorAll('.pdf-thumb-card');
      cards.forEach((card) => {
        const pageNum = parseInt(card.getAttribute('data-page') || '0');
        if (pages.includes(pageNum)) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });
    }
  };

  // Cleanup on unmount or file change
  const resetTool = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (gridContainerRef.current) {
      gridContainerRef.current.innerHTML = '';
    }
    setFile(null);
    setNumPages(0);
    setPageRange('');
    setSelectedPages(new Set());
    setLoadingThumbnails(false);
  };

  const extract = async () => {
    if (!file || !pageRange.trim()) return;
    setExtracting(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf);
      const out = await PDFDocument.create();
      const indices = pageRange.split(',').flatMap(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [s, e] = trimmed.split('-').map(Number);
          return Array.from({ length: e - s + 1 }, (_, i) => s + i - 1);
        }
        return [parseInt(trimmed) - 1];
      }).filter(i => i >= 0 && i < numPages);
      const pages = await out.copyPages(src, indices);
      pages.forEach(p => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `extracted-${file.name}`; a.click();
    } catch (e) { alert('Extraction failed'); }
    setExtracting(false);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-scissors" title="PDF Page Extractor" description="Extract specific pages from a PDF" color="#ef4444" />
      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf" icon="fa-file-pdf" title="Upload a PDF" />
      ) : (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>{file.name}</strong> — {numPages} pages
          </p>

          {/* Thumbnail Grid Container */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
              Click pages to select (or use range input below)
            </label>
            <div 
              ref={gridContainerRef}
              id="extractor-thumbnails-grid"
              className="pdf-thumbnail-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                minHeight: '100px'
              }}
            />
          </div>

          {loadingThumbnails && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: 'var(--accent)' }}></i>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Generating page previews...</span>
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Page range (e.g. 1,3,5-8)
            </label>
            <input 
              type="text" 
              value={pageRange} 
              onChange={e => handleRangeChange(e.target.value)} 
              placeholder="1,3,5-8" 
              className="input-field" 
            />
            {selectedPages.size > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={extract} icon={extracting ? 'fa-spinner fa-spin' : 'fa-scissors'} disabled={extracting || selectedPages.size === 0}>
              Extract {selectedPages.size > 0 ? `${selectedPages.size} Page${selectedPages.size !== 1 ? 's' : ''}` : 'Pages'}
            </Button>
            <Button variant="secondary" onClick={resetTool} icon="fa-redo">Choose Another</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── PDF Page Reorderer ──
export const PdfReorderer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [order, setOrder] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleFile = async (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    setFile(f);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await f.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      setNumPages(pdf.getPageCount());
      setOrder(Array.from({ length: pdf.getPageCount() }, (_, i) => i + 1).join(','));
    } catch (e) { alert('Invalid PDF'); }
  };

  const reorder = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf);
      const out = await PDFDocument.create();
      const indices = order.split(',').map(s => parseInt(s.trim()) - 1).filter(i => i >= 0 && i < numPages);
      const pages = await out.copyPages(src, indices);
      pages.forEach(p => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `reordered-${file.name}`; a.click();
    } catch (e) { alert('Reorder failed'); }
    setProcessing(false);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-arrows-alt" title="PDF Page Reorderer" description="Rearrange pages in a PDF" color="#ef4444" />
      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf" icon="fa-file-pdf" title="Upload a PDF" />
      ) : (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>{file.name}</strong> — {numPages} pages
          </p>
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              New page order (comma-separated)
            </label>
            <input type="text" value={order} onChange={e => setOrder(e.target.value)} className="input-field" placeholder="3,1,2,4" />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Current: {order}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reorder} icon={processing ? 'fa-spinner fa-spin' : 'fa-arrows-alt'} disabled={processing}>Reorder & Download</Button>
            <Button variant="secondary" onClick={() => { setFile(null); setNumPages(0); setOrder(''); }} icon="fa-redo">Choose Another</Button>
          </div>
        </div>
      )}
    </div>
  );
};
