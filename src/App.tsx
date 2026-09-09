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
const VALID_TOOL_IDS = TOOLS.map(t => t.id);

// Parse hash from URL: returns tool id or null
function parseHash(): { tool: string | null; category: string | null } {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!hash || hash === 'dashboard') return { tool: null, category: null };
  // Check if it's a valid tool id
  if (VALID_TOOL_IDS.includes(hash)) return { tool: hash, category: null };
  // Check if it's a category
  if (CATEGORIES.includes(hash)) return { tool: null, category: hash };
  return { tool: null, category: null };
}

// Build hash from state
function buildHash(tool: string | null, category: string | null): string {
  if (tool) return `#/${tool}`;
  if (category) return `#/${encodeURIComponent(category)}`;
  return '#/dashboard';
}

function App() {
  // Initialize state from URL hash
  const initial = parseHash();
  const [activeTool, setActiveTool] = useState<string | null>(initial.tool);
  const [activeCategory, setActiveCategory] = useState<string | null>(initial.category);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('multitool-theme');
    return saved ? saved === 'dark' : true;
  });

  const isOledMode = activeTool ? TIME_FOCUS_IDS.includes(activeTool) : false;

  // Sync hash ↔ state (two-way binding)
  useEffect(() => {
    const newHash = buildHash(activeTool, activeCategory);
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
  }, [activeTool, activeCategory]);

  // Listen for browser back/forward and manual hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash();
      setActiveTool(parsed.tool);
      setActiveCategory(parsed.category);
      if (!parsed.tool) {
        setSearchQuery('');
      }
    };

    // Also handle popstate for browser back/forward
    const handlePopState = () => {
      const parsed = parseHash();
      setActiveTool(parsed.tool);
      setActiveCategory(parsed.category);
      if (!parsed.tool) {
        setSearchQuery('');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Persist theme
  useEffect(() => {
    localStorage.setItem('multitool-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Apply body classes for theming
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
    setActiveCategory(null);
    setSidebarOpen(false);
  }, []);

  const goBack = useCallback(() => {
    setActiveTool(null);
    // Don't reset category — let user return to dashboard
    setSearchQuery('');
  }, []);

  const goToDashboard = useCallback(() => {
    setActiveTool(null);
    setActiveCategory(null);
    setSearchQuery('');
    setSidebarOpen(false);
  }, []);

  const selectCategory = useCallback((cat: string) => {
    setActiveCategory(cat);
    setActiveTool(null);
    setSearchQuery('');
    setSidebarOpen(false);
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
        <div className="p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-toolbox text-white text-lg"></i>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>MultiTool</h1>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Browser Utilities</p>
            </div>
          </div>
        </div>

        <nav className="p-3 sm:p-4">
          <button
            onClick={goToDashboard}
            className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-2 font-medium transition-all flex items-center gap-3"
            style={{
              background: !activeCategory && !activeTool ? 'var(--bg-tertiary)' : 'transparent',
              color: 'var(--text-primary)'
            }}
          >
            <i className="fas fa-th-large w-5 text-center"></i>
            <span className="truncate">Dashboard</span>
          </button>

          <div className="mt-4 mb-2 px-3 sm:px-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Categories</p>
          </div>

          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => selectCategory(cat)}
              className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg mb-1 text-sm transition-all flex items-center gap-3"
              style={{
                background: activeCategory === cat && !activeTool ? 'var(--bg-tertiary)' : 'transparent',
                color: activeCategory === cat && !activeTool ? 'var(--accent)' : 'var(--text-secondary)'
              }}
            >
              <i className={`fas ${cat === 'Photo & PDF' ? 'fa-images' : cat === 'Developer Tools' ? 'fa-laptop-code' : cat === 'Time & Focus' ? 'fa-clock' : cat === 'Student & Writing' ? 'fa-pen-fancy' : 'fa-wrench'} w-5 text-center flex-shrink-0`}></i>
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Header */}
      <header className="app-header flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
        <button
          className="lg:hidden p-2 rounded-lg flex-shrink-0"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <i className="fas fa-bars text-lg"></i>
        </button>

        {!activeTool && (
          <div className="flex-1 max-w-xl relative min-w-0">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}></i>
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10 text-sm sm:text-base"
            />
          </div>
        )}

        {activeTool && (
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button onClick={goBack} className="btn-secondary flex items-center gap-1.5 sm:gap-2 text-sm flex-shrink-0">
              <i className="fas fa-arrow-left text-xs"></i>
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
            <h2 className="font-semibold text-sm sm:text-lg truncate" style={{ color: 'var(--text-primary)' }}>
              {activeToolMeta?.name}
            </h2>
          </div>
        )}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 sm:p-2.5 rounded-lg transition-all flex-shrink-0"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} text-base sm:text-lg`}></i>
        </button>
      </header>

      {/* Main Content */}
      <main className="main-content" style={{ marginLeft: activeTool ? '0' : undefined }}>
        {!activeTool ? (
          <div className="animate-fade-in">
            {activeCategory && (
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeCategory}</h2>
                <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                  {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} available
                </p>
              </div>
            )}
            {!activeCategory && !searchQuery && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Welcome to MultiTool
                </h2>
                <p className="text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Your all-in-one browser utility suite. Select a tool to get started.
                </p>
              </div>
            )}
            {searchQuery && (
              <div className="mb-6">
                <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                  {filteredTools.length} result{filteredTools.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {filteredTools.map(tool => (
                <div
                  key={tool.id}
                  className="tool-card"
                  onClick={() => openTool(tool.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openTool(tool.id); }}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: tool.category === 'Time & Focus' ? '#000000' : 'var(--bg-tertiary)',
                        border: tool.category === 'Time & Focus' ? '1px solid #333' : '1px solid var(--border-color)'
                      }}
                    >
                      <i className={`fas ${tool.icon} text-sm sm:text-lg`} style={{
                        color: tool.category === 'Time & Focus' ? '#ffffff' : 'var(--accent)'
                      }}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>{tool.name}</h3>
                      <p className="text-xs sm:text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{tool.description}</p>
                      <span className="inline-block mt-2 text-[10px] sm:text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        {tool.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredTools.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <i className="fas fa-search text-3xl sm:text-4xl mb-4" style={{ color: 'var(--text-muted)' }}></i>
                <p className="text-base sm:text-lg" style={{ color: 'var(--text-muted)' }}>No tools found matching your search.</p>
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
