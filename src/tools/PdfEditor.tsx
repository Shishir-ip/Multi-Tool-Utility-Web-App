import { useState, useRef, useCallback, useEffect } from 'react';

export default function PdfEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [tool, setTool] = useState<'text' | 'draw' | null>(null);
  const [annotations, setAnnotations] = useState<{ page: number; type: 'text' | 'draw'; data: any }[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPaths, setDrawPaths] = useState<{ page: number; points: { x: number; y: number }[] }[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPdf = useCallback(async (file: File) => {
    setPdfFile(file);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx as any, viewport } as any).promise;
        pages.push(canvas.toDataURL());
      }
      setPdfPages(pages);
    } catch (err) {
      console.error('Error loading PDF:', err);
      alert('Error loading PDF. Please try another file.');
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !pdfPages[currentPage]) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // Draw saved annotations for this page
      drawPaths.filter(p => p.page === currentPage).forEach(path => {
        if (path.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      });
      // Draw text annotations
      annotations.filter(a => a.page === currentPage && a.type === 'text').forEach(a => {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText(a.data.text, a.data.x, a.data.y);
      });
    };
    img.src = pdfPages[currentPage];
  }, [pdfPages, currentPage, drawPaths, annotations]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'draw') {
      setIsDrawing(true);
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath([{ x, y }]);
    } else if (tool === 'text') {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (textInput.trim()) {
        setAnnotations(prev => [...prev, { page: currentPage, type: 'text', data: { text: textInput, x, y } }]);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool !== 'draw') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(prev => [...prev, { x, y }]);
    // Draw current stroke
    const ctx = canvasRef.current!.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      drawPaths.filter(p => p.page === currentPage).forEach(path => {
        if (path.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      });
      annotations.filter(a => a.page === currentPage && a.type === 'text').forEach(a => {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText(a.data.text, a.data.x, a.data.y);
      });
      // Draw current path
      const allPoints = [...currentPath, { x, y }];
      if (allPoints.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.moveTo(allPoints[0].x, allPoints[0].y);
        allPoints.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      }
    };
    img.src = pdfPages[currentPage];
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      setDrawPaths(prev => [...prev, { page: currentPage, points: [...currentPath] }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const clearAnnotations = () => {
    setDrawPaths(prev => prev.filter(p => p.page !== currentPage));
    setAnnotations(prev => prev.filter(a => a.page !== currentPage));
  };

  return (
    <div className="tool-container">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-edit mr-2" style={{ color: '#f59e0b' }}></i>
          Mini PDF Editor
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Load a PDF and add text or freehand drawings</p>
      </div>

      {!pdfFile ? (
        <div
          className="drop-zone"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0])} />
          <i className="fas fa-file-pdf text-4xl mb-3" style={{ color: '#ef4444' }}></i>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Click to load a PDF file</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Select a PDF to begin editing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <button
              onClick={() => setTool(tool === 'text' ? null : 'text')}
              className="btn-secondary text-sm flex items-center gap-2"
              style={{ background: tool === 'text' ? 'var(--accent)' : undefined, color: tool === 'text' ? 'white' : undefined }}
            >
              <i className="fas fa-font"></i> Add Text
            </button>
            <button
              onClick={() => setTool(tool === 'draw' ? null : 'draw')}
              className="btn-secondary text-sm flex items-center gap-2"
              style={{ background: tool === 'draw' ? 'var(--accent)' : undefined, color: tool === 'draw' ? 'white' : undefined }}
            >
              <i className="fas fa-pencil-alt"></i> Freehand Draw
            </button>
            <button onClick={clearAnnotations} className="btn-secondary text-sm flex items-center gap-2">
              <i className="fas fa-eraser"></i> Clear Page
            </button>
            {tool === 'text' && (
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Type text, then click on PDF..."
                className="input-field flex-1 min-w-[200px]"
              />
            )}
          </div>

          {/* Page Navigation */}
          {pdfPages.length > 1 && (
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="btn-secondary text-sm">
                <i className="fas fa-chevron-left"></i>
              </button>
              <span style={{ color: 'var(--text-secondary)' }}>Page {currentPage + 1} of {pdfPages.length}</span>
              <button onClick={() => setCurrentPage(Math.min(pdfPages.length - 1, currentPage + 1))} disabled={currentPage === pdfPages.length - 1} className="btn-secondary text-sm">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}

          {/* Canvas */}
          <div className="border rounded-lg overflow-auto" style={{ borderColor: 'var(--border-color)' }}>
            <canvas
              ref={canvasRef}
              className="max-w-full cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => { setPdfFile(null); setPdfPages([]); setDrawPaths([]); setAnnotations([]); }} className="btn-secondary">
              <i className="fas fa-folder-open mr-1"></i> Load Different PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
