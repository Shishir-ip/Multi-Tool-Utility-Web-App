import React, { useState, useRef, useCallback } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

// ── PDF to Image ──
export const PdfToImage: React.FC = () => {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPdf = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf } as any).promise;
      const imgs: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 2 });
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d')!;
        c.width = vp.width; c.height = vp.height;
        await page.render({ canvasContext: ctx as any, viewport: vp } as any).promise;
        imgs.push(c.toDataURL('image/png'));
      }
      setPages(imgs);
    } catch (e) { console.error(e); alert('Failed to load PDF'); }
    setLoading(false);
  };

  const downloadPage = (dataUrl: string, idx: number) => {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = `page-${idx + 1}.png`; a.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-file-image" title="PDF to Image" description="Convert PDF pages to PNG images" color="#ef4444" />
      {pages.length === 0 ? (
        <DropZone onFiles={loadPdf} accept=".pdf" icon="fa-file-pdf" title="Upload a PDF file" subtitle="Each page will become a PNG image" />
      ) : (
        <div className="space-y-4">
          {loading && <p style={{ color: 'var(--text-muted)' }}>Processing...</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((p, i) => (
              <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <img src={p} alt={`Page ${i + 1}`} className="w-full" />
                <div className="p-2 flex justify-between items-center" style={{ background: 'var(--bg-tertiary)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {i + 1}</span>
                  <button onClick={() => downloadPage(p, i)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent)', color: 'white' }}>
                    <i className="fas fa-download mr-1"></i> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" onClick={() => setPages([])} icon="fa-redo">Load Another PDF</Button>
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

  const handleFile = async (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    setFile(f);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await f.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      setNumPages(pdf.getPageCount());
    } catch (e) { alert('Invalid PDF'); }
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
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Page range (e.g. 1,3,5-8)
            </label>
            <input type="text" value={pageRange} onChange={e => setPageRange(e.target.value)} placeholder="1,3,5-8" className="input-field" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={extract} icon={extracting ? 'fa-spinner fa-spin' : 'fa-scissors'} disabled={extracting}>Extract Pages</Button>
            <Button variant="secondary" onClick={() => { setFile(null); setNumPages(0); setPageRange(''); }} icon="fa-redo">Choose Another</Button>
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
