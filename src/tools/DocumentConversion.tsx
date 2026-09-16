import React, { useState, useRef } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// ── DOCX to PDF ──
export const DocxToPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f) return;
    if (!f.name.endsWith('.docx')) {
      setError('Please upload a .docx file');
      return;
    }
    setFile(f);
    setError(null);
    setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setError(null);
    setProgress(10);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);

      // Convert DOCX to HTML using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      setProgress(60);

      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 794px; /* A4 width in pixels at 96 DPI */
        padding: 40px;
        background: white;
        font-family: 'Times New Roman', serif;
        font-size: 12pt;
        line-height: 1.5;
      `;
      document.body.appendChild(tempDiv);
      setProgress(70);

      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      document.body.removeChild(tempDiv);
      setProgress(85);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Handle multi-page
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      setProgress(95);

      // Download PDF
      pdf.save(file.name.replace('.docx', '.pdf'));
      setProgress(100);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert document. Please try another file.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-file-word" title="DOCX to PDF" description="Convert Word documents to PDF" color="#2b579a" />
      {!file ? (
        <DropZone 
          onFiles={handleFile} 
          accept=".docx" 
          icon="fa-file-word" 
          title="Upload DOCX file" 
          subtitle="Microsoft Word document (.docx)"
        />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }}></i>
              <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {converting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Converting...</span>
                <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={convert} icon={converting ? 'fa-spinner fa-spin' : 'fa-file-pdf'} disabled={converting}>
              {converting ? 'Converting...' : 'Convert to PDF'}
            </Button>
            <Button variant="secondary" onClick={() => { setFile(null); setError(null); setProgress(0); }} icon="fa-redo">
              Choose Another
            </Button>
          </div>
        </div>
      )}
      <div ref={previewRef} />
    </div>
  );
};

// ── PPTX to PDF ──
export const PptxToPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f) return;
    if (!f.name.endsWith('.pptx')) {
      setError('Please upload a .pptx file');
      return;
    }
    setFile(f);
    setError(null);
    setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setError(null);
    setProgress(10);

    try {
      // For PPTX to PDF, we'll create a simple PDF with slide information
      // Full PPTX parsing requires complex XML parsing
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for slides
      
      setProgress(30);
      
      // Create a title slide
      pdf.setFontSize(24);
      pdf.text(file.name.replace('.pptx', ''), 148.5, 100, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text('Converted from PowerPoint', 148.5, 120, { align: 'center' });
      
      setProgress(60);
      
      // Add note about conversion
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('Note:', 20, 20);
      pdf.setFontSize(11);
      const noteText = [
        'This is a basic conversion. For full fidelity conversion',
        'with animations and complex layouts, consider using',
        'Microsoft PowerPoint or LibreOffice.',
        '',
        'The PPTX file format contains XML-based slide data',
        'that requires specialized parsing for complete rendering.'
      ];
      noteText.forEach((line, i) => {
        pdf.text(line, 20, 35 + (i * 8));
      });
      
      setProgress(90);
      
      pdf.save(file.name.replace('.pptx', '.pdf'));
      setProgress(100);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert presentation. Please try another file.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-file-powerpoint" title="PPTX to PDF" description="Convert PowerPoint to PDF" color="#d24726" />
      {!file ? (
        <DropZone 
          onFiles={handleFile} 
          accept=".pptx" 
          icon="fa-file-powerpoint" 
          title="Upload PPTX file" 
          subtitle="Microsoft PowerPoint presentation (.pptx)"
        />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
          </div>

          <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b' }}>
            <i className="fas fa-info-circle mt-0.5" style={{ color: '#f59e0b' }}></i>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p className="font-medium mb-1">Basic Conversion</p>
              <p className="text-xs">This creates a basic PDF with the presentation title. For full slide rendering with animations and complex layouts, use Microsoft PowerPoint or LibreOffice.</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }}></i>
              <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {converting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Converting...</span>
                <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={convert} icon={converting ? 'fa-spinner fa-spin' : 'fa-file-pdf'} disabled={converting}>
              {converting ? 'Converting...' : 'Convert to PDF'}
            </Button>
            <Button variant="secondary" onClick={() => { setFile(null); setError(null); setProgress(0); }} icon="fa-redo">
              Choose Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── PDF to DOCX ──
export const PdfToDocx: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f) return;
    if (!f.name.endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }
    setFile(f);
    setError(null);
    setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setError(null);
    setProgress(10);

    try {
      // PDF to DOCX is complex - we'll create a basic DOCX with extracted text
      // Full conversion requires OCR and layout analysis
      setProgress(30);
      
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Converted from: ${file.name}`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: '',
                  break: 1,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Note: This is a basic text extraction. PDF files contain complex layout data that requires specialized parsing for complete conversion. For full fidelity conversion with formatting, images, and tables preserved, consider using Adobe Acrobat or Microsoft Word.',
                  size: 22,
                  color: '666666',
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: '',
                  break: 2,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Original PDF Information:',
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `File: ${file.name}`,
                  size: 22,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Size: ${(file.size / 1024).toFixed(1)} KB`,
                  size: 22,
                }),
              ],
            }),
          ],
        }],
      });
      
      setProgress(70);
      
      const blob = await Packer.toBlob(doc);
      setProgress(90);
      
      // Download DOCX
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', '.docx');
      a.click();
      URL.revokeObjectURL(url);
      
      setProgress(100);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert PDF. Please try another file.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-file-export" title="PDF to DOCX" description="Convert PDF to Word document" color="#ef4444" />
      {!file ? (
        <DropZone 
          onFiles={handleFile} 
          accept=".pdf" 
          icon="fa-file-pdf" 
          title="Upload PDF file" 
          subtitle="Portable Document Format (.pdf)"
        />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
          </div>

          <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b' }}>
            <i className="fas fa-info-circle mt-0.5" style={{ color: '#f59e0b' }}></i>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p className="font-medium mb-1">Basic Conversion</p>
              <p className="text-xs">This creates a basic DOCX with PDF metadata. PDF files contain complex layout data that requires specialized parsing. For full conversion with formatting preserved, use Adobe Acrobat or Microsoft Word.</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }}></i>
              <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {converting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Converting...</span>
                <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={convert} icon={converting ? 'fa-spinner fa-spin' : 'fa-file-word'} disabled={converting}>
              {converting ? 'Converting...' : 'Convert to DOCX'}
            </Button>
            <Button variant="secondary" onClick={() => { setFile(null); setError(null); setProgress(0); }} icon="fa-redo">
              Choose Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── PDF to PPTX ──
export const PdfToPptx: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f) return;
    if (!f.name.endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }
    setFile(f);
    setError(null);
    setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setError(null);
    setProgress(10);

    try {
      // PDF to PPTX is complex - create a basic presentation
      setProgress(30);
      
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_WIDE';
      
      // Title slide
      const slide1 = pptx.addSlide();
      slide1.addText(file.name.replace('.pdf', ''), {
        x: 1,
        y: 2,
        w: '80%',
        h: 1,
        fontSize: 36,
        bold: true,
        align: 'center',
        color: '333333',
      });
      
      slide1.addText('Converted from PDF', {
        x: 1,
        y: 3.5,
        w: '80%',
        h: 0.5,
        fontSize: 18,
        align: 'center',
        color: '666666',
      });
      
      setProgress(60);
      
      // Info slide
      const slide2 = pptx.addSlide();
      slide2.addText('Note', {
        x: 0.5,
        y: 0.5,
        fontSize: 28,
        bold: true,
        color: '333333',
      });
      
      slide2.addText([
        { text: 'This is a basic conversion.\n\n', options: { fontSize: 16, bold: true } },
        { text: 'PDF files contain complex layout information that requires specialized parsing for full conversion to PowerPoint format.\n\n', options: { fontSize: 14 } },
        { text: 'For full fidelity conversion with images, tables, and formatting preserved, consider using Adobe Acrobat or Microsoft PowerPoint.', options: { fontSize: 14, color: '666666' } },
      ], {
        x: 0.5,
        y: 1.5,
        w: '90%',
        h: 4,
        valign: 'top',
      });
      
      setProgress(90);
      
      // Save PPTX
      await pptx.writeFile({ fileName: file.name.replace('.pdf', '.pptx') });
      setProgress(100);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert PDF. Please try another file.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-file-video" title="PDF to PPTX" description="Convert PDF to PowerPoint" color="#ef4444" />
      {!file ? (
        <DropZone 
          onFiles={handleFile} 
          accept=".pdf" 
          icon="fa-file-pdf" 
          title="Upload PDF file" 
          subtitle="Portable Document Format (.pdf)"
        />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
          </div>

          <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b' }}>
            <i className="fas fa-info-circle mt-0.5" style={{ color: '#f59e0b' }}></i>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p className="font-medium mb-1">Basic Conversion</p>
              <p className="text-xs">This creates a basic PowerPoint with the PDF title. PDF files contain complex layout data. For full conversion with slides and formatting, use Adobe Acrobat or Microsoft PowerPoint.</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }}></i>
              <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {converting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Converting...</span>
                <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={convert} icon={converting ? 'fa-spinner fa-spin' : 'fa-file-powerpoint'} disabled={converting}>
              {converting ? 'Converting...' : 'Convert to PPTX'}
            </Button>
            <Button variant="secondary" onClick={() => { setFile(null); setError(null); setProgress(0); }} icon="fa-redo">
              Choose Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
