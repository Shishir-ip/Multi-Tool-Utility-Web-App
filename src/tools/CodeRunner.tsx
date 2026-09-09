import { useState, useRef, useEffect } from 'react';

const SAMPLE_HTML = `<h1>Hello World!</h1>\n<p>Welcome to the Live Code Runner</p>\n<button id="btn">Click Me</button>`;
const SAMPLE_CSS = `body {\n  font-family: sans-serif;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n  margin: 0;\n  background: linear-gradient(135deg, #667eea, #764ba2);\n  color: white;\n}\nbutton {\n  padding: 12px 24px;\n  font-size: 16px;\n  border: none;\n  border-radius: 8px;\n  background: white;\n  color: #667eea;\n  cursor: pointer;\n  font-weight: bold;\n}\nbutton:hover {\n  transform: scale(1.05);\n}`;
const SAMPLE_JS = `document.getElementById('btn').addEventListener('click', () => {\n  alert('Button clicked! 🎉');\n});`;

export default function CodeRunner() {
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [css, setCss] = useState(SAMPLE_CSS);
  const [js, setJs] = useState(SAMPLE_JS);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runCode = () => {
    if (!iframeRef.current) return;
    const doc = `<!DOCTYPE html>
<html>
<head><style>${css}</style></head>
<body>${html}<script>${js}<\/script></body>
</html>`;
    const blob = new Blob([doc], { type: 'text/html' });
    iframeRef.current.src = URL.createObjectURL(blob);
  };

  useEffect(() => {
    runCode();
  }, []);

  const clearCode = () => {
    setHtml('');
    setCss('');
    setJs('');
  };

  const insertSample = () => {
    setHtml(SAMPLE_HTML);
    setCss(SAMPLE_CSS);
    setJs(SAMPLE_JS);
    setTimeout(runCode, 100);
  };

  return (
    <div className="tool-container">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-code mr-2" style={{ color: '#10b981' }}></i>
          Live Code Runner
        </h2>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>Write HTML, CSS, and JavaScript and see results in real-time</p>
      </div>

      {/* Action Buttons — wraps on mobile */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
        <button onClick={runCode} className="btn-primary flex items-center gap-2 text-sm">
          <i className="fas fa-play"></i> Run
        </button>
        <button onClick={insertSample} className="btn-secondary flex items-center gap-2 text-sm">
          <i className="fas fa-code"></i> Insert Sample
        </button>
        <button onClick={clearCode} className="btn-secondary flex items-center gap-2 text-sm">
          <i className="fas fa-trash"></i> Clear Code
        </button>
      </div>

      {/* Code Editors — stacks on mobile, 3-col on lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="min-w-0">
          <label className="text-xs sm:text-sm font-semibold mb-2 block flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <i className="fab fa-html5 text-orange-500"></i> HTML
          </label>
          <textarea
            value={html}
            onChange={e => setHtml(e.target.value)}
            className="code-editor"
            spellCheck={false}
            placeholder="<!-- Write HTML here -->"
          />
        </div>
        <div className="min-w-0">
          <label className="text-xs sm:text-sm font-semibold mb-2 block flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <i className="fab fa-css3-alt text-blue-500"></i> CSS
          </label>
          <textarea
            value={css}
            onChange={e => setCss(e.target.value)}
            className="code-editor"
            spellCheck={false}
            placeholder="/* Write CSS here */"
          />
        </div>
        <div className="min-w-0">
          <label className="text-xs sm:text-sm font-semibold mb-2 block flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <i className="fab fa-js-square text-yellow-500"></i> JavaScript
          </label>
          <textarea
            value={js}
            onChange={e => setJs(e.target.value)}
            className="code-editor"
            spellCheck={false}
            placeholder="// Write JavaScript here"
          />
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="text-xs sm:text-sm font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
          <i className="fas fa-eye mr-1"></i> Live Preview
        </label>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts allow-modals"
            className="w-full bg-white"
            style={{ height: '300px', border: 'none' }}
            title="Code Preview"
          />
        </div>
      </div>
    </div>
  );
}
