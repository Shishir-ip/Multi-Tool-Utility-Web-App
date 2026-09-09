import { useState, useEffect, useCallback, useMemo } from 'react';
import { TOOLS, CATEGORIES } from './types';
import PhotoToPdf from './tools/PhotoToPdf';
import ImageResizer from './tools/ImageResizer';
import PdfEditor from './tools/PdfEditor';
import CodeRunner from './tools/CodeRunner';
import DigitalClock from './tools/DigitalClock';
import AnalogClock from './tools/AnalogClock';
import Stopwatch from './tools/Stopwatch';
import Timer from './tools/Timer';
import WordCounter from './tools/WordCounter';
import QrGenerator from './tools/QrGenerator';

const TIME_FOCUS_IDS = ['digital-clock', 'analog-clock', 'stopwatch', 'timer'];

function App() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const isOledMode = activeTool ? TIME_FOCUS_IDS.includes(activeTool) : false;

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
    if (isOledMode) {
      document.body.classList.add('oled-black');
    } else {
      document.body.classList.remove('oled-black');
    }
  }, [darkMode, isOledMode]);

  const filteredTools = useMemo(() => {
    let tools = TOOLS;
    if (activeCategory) {
      tools = tools.filter(t => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some(k => k.includes(q))
      );
    }
    return tools;
  }, [searchQuery, activeCategory]);

  const openTool = useCallback((id: string) => {
    setActiveTool(id);
    setSidebarOpen(false);
  }, []);

  const goBack = useCallback(() => {
    setActiveTool(null);
    setActiveCategory(null);
    setSearchQuery('');
  }, []);

  const renderTool = () => {
    switch (activeTool) {
      case 'photo-to-pdf': return <PhotoToPdf />;
      case 'image-resizer': return <ImageResizer />;
      case 'pdf-editor': return <PdfEditor />;
      case 'code-runner': return <CodeRunner />;
      case 'digital-clock': return <DigitalClock />;
      case 'analog-clock': return <AnalogClock />;
      case 'stopwatch': return <Stopwatch />;
      case 'timer': return <Timer />;
      case 'word-counter': return <WordCounter />;
      case 'qr-generator': return <QrGenerator />;
      default: return null;
    }
  };

  const activeToolMeta = TOOLS.find(t => t.id === activeTool);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : 'light'}`} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Sidebar Overlay for mobile */}
      <div
        className={`sidebar-overlay lg:hidden ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${activeTool ? 'collapsed' : ''}`}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <i className="fas fa-toolbox text-white text-lg"></i>
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>MultiTool</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Browser Utilities</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          <button
            onClick={() => { setActiveCategory(null); setActiveTool(null); setSidebarOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-lg mb-2 font-medium transition-all flex items-center gap-3"
            style={{
              background: !activeCategory && !activeTool ? 'var(--bg-tertiary)' : 'transparent',
              color: 'var(--text-primary)'
            }}
          >
            <i className="fas fa-th-large w-5"></i>
            Dashboard
          </button>

          <div className="mt-4 mb-2 px-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Categories</p>
          </div>

          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setActiveTool(null); setSidebarOpen(false); }}
              className="w-full text-left px-4 py-2.5 rounded-lg mb-1 text-sm transition-all flex items-center gap-3"
              style={{
                background: activeCategory === cat ? 'var(--bg-tertiary)' : 'transparent',
                color: activeCategory === cat ? 'var(--accent)' : 'var(--text-secondary)'
              }}
            >
              <i className={`fas ${cat === 'Photo & PDF' ? 'fa-images' : cat === 'Developer Tools' ? 'fa-laptop-code' : cat === 'Time & Focus' ? 'fa-clock' : cat === 'Student & Writing' ? 'fa-pen-fancy' : 'fa-wrench'} w-5 text-center`}></i>
              {cat}
            </button>
          ))}
        </nav>
      </aside>

      {/* Header */}
      <header className="app-header flex items-center px-6 gap-4" style={{ left: activeTool ? '0' : undefined }}>
        <button
          className="lg:hidden p-2 rounded-lg"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className="fas fa-bars text-xl"></i>
        </button>

        {!activeTool && (
          <div className="flex-1 max-w-xl relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}></i>
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        )}

        {activeTool && (
          <div className="flex items-center gap-3 flex-1">
            <button onClick={goBack} className="btn-secondary flex items-center gap-2">
              <i className="fas fa-arrow-left"></i>
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            <h2 className="font-semibold text-lg hidden sm:block" style={{ color: 'var(--text-primary)' }}>
              {activeToolMeta?.name}
            </h2>
          </div>
        )}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-lg transition-all"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
        </button>
      </header>

      {/* Main Content */}
      <main className={`main-content ${activeTool ? '' : ''}`} style={{ marginLeft: activeTool ? '0' : undefined }}>
        {!activeTool ? (
          <div className="animate-fade-in">
            {activeCategory && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeCategory}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} available
                </p>
              </div>
            )}
            {!activeCategory && !searchQuery && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Welcome to MultiTool
                </h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Your all-in-one browser utility suite. Select a tool to get started.
                </p>
              </div>
            )}
            {searchQuery && (
              <div className="mb-6">
                <p style={{ color: 'var(--text-secondary)' }}>
                  {filteredTools.length} result{filteredTools.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTools.map(tool => (
                <div
                  key={tool.id}
                  className="tool-card"
                  onClick={() => openTool(tool.id)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: tool.category === 'Time & Focus' ? '#000000' : 'var(--bg-tertiary)',
                        border: tool.category === 'Time & Focus' ? '1px solid #333' : '1px solid var(--border-color)'
                      }}
                    >
                      <i className={`fas ${tool.icon} text-lg`} style={{
                        color: tool.category === 'Time & Focus' ? '#ffffff' : 'var(--accent)'
                      }}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{tool.name}</h3>
                      <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{tool.description}</p>
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        {tool.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredTools.length === 0 && (
              <div className="text-center py-16">
                <i className="fas fa-search text-4xl mb-4" style={{ color: 'var(--text-muted)' }}></i>
                <p className="text-lg" style={{ color: 'var(--text-muted)' }}>No tools found matching your search.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            {renderTool()}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
