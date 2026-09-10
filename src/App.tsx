import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { TOOLS, CATEGORIES, CATEGORY_MAP, TIME_FOCUS_IDS } from './types';

// Lazy-load tool modules for performance
const ToolModules: Record<string, React.LazyExoticComponent<React.FC>> = {
  'photo-to-pdf': lazy(() => import('./tools/PhotoToPdf')),
  'image-resizer': lazy(() => import('./tools/ImageResizer')),
  'pdf-editor': lazy(() => import('./tools/PdfEditor')),
  'code-runner': lazy(() => import('./tools/CodeRunner')),
  'digital-clock': lazy(() => import('./tools/DigitalClock')),
  'analog-clock': lazy(() => import('./tools/AnalogClock')),
  'stopwatch': lazy(() => import('./tools/Stopwatch')),
  'timer': lazy(() => import('./tools/Timer')),
  'word-counter': lazy(() => import('./tools/WordCounter')),
  'qr-generator': lazy(() => import('./tools/QrGenerator')),
  'pdf-to-image': lazy(() => import('./tools/PdfTools').then(m => ({ default: m.PdfToImage }))),
  'pdf-merger': lazy(() => import('./tools/PdfTools').then(m => ({ default: m.PdfMerger }))),
  'pdf-compressor': lazy(() => import('./tools/PdfTools').then(m => ({ default: m.PdfCompressor }))),
  'pdf-extractor': lazy(() => import('./tools/PdfTools').then(m => ({ default: m.PdfExtractor }))),
  'pdf-reorderer': lazy(() => import('./tools/PdfTools').then(m => ({ default: m.PdfReorderer }))),
  'image-converter': lazy(() => import('./tools/ImageDesign').then(m => ({ default: m.ImageConverter }))),
  'image-cropper': lazy(() => import('./tools/ImageDesign').then(m => ({ default: m.ImageCropper }))),
  'exif-viewer': lazy(() => import('./tools/ImageDesign').then(m => ({ default: m.ExifViewer }))),
  'collage-maker': lazy(() => import('./tools/ImageDesign').then(m => ({ default: m.CollageMaker }))),
  'favicon-generator': lazy(() => import('./tools/ImageDesign').then(m => ({ default: m.FaviconGenerator }))),
  'color-picker': lazy(() => import('./tools/ColorPicker')),
  'gpa-calculator': lazy(() => import('./tools/StudentTools').then(m => ({ default: m.GpaCalculator }))),
  'marks-calculator': lazy(() => import('./tools/StudentTools').then(m => ({ default: m.MarksCalculator }))),
  'attendance-calculator': lazy(() => import('./tools/StudentTools').then(m => ({ default: m.AttendanceCalculator }))),
  'citation-generator': lazy(() => import('./tools/StudentTools').then(m => ({ default: m.CitationGenerator }))),
  'matrix-calculator': lazy(() => import('./tools/StudentTools').then(m => ({ default: m.MatrixCalculator }))),
  'discount-calculator': lazy(() => import('./tools/FinanceTools').then(m => ({ default: m.DiscountCalculator }))),
  'loan-calculator': lazy(() => import('./tools/FinanceTools').then(m => ({ default: m.LoanCalculator }))),
  'bkash-calculator': lazy(() => import('./tools/FinanceTools').then(m => ({ default: m.BkashCalculator }))),
  'pomodoro': lazy(() => import('./tools/TimeTools').then(m => ({ default: m.PomodoroTimer }))),
  'timezone-converter': lazy(() => import('./tools/TimeTools').then(m => ({ default: m.TimezoneConverter }))),
  'date-calculator': lazy(() => import('./tools/TimeTools').then(m => ({ default: m.DateCalculator }))),
  'business-days': lazy(() => import('./tools/TimeTools').then(m => ({ default: m.BusinessDays }))),
  'days-between': lazy(() => import('./tools/TimeTools').then(m => ({ default: m.DaysBetween }))),
  'calendar-generator': lazy(() => import('./tools/TimeTools').then(m => ({ default: m.CalendarGenerator }))),
  'bmi-calculator': lazy(() => import('./tools/CalculatorTools').then(m => ({ default: m.BmiCalculator }))),
  'age-calculator': lazy(() => import('./tools/CalculatorTools').then(m => ({ default: m.AgeCalculator }))),
  'unit-converter': lazy(() => import('./tools/CalculatorTools').then(m => ({ default: m.UnitConverter }))),
  'storage-converter': lazy(() => import('./tools/CalculatorTools').then(m => ({ default: m.StorageConverter }))),
  'speed-converter': lazy(() => import('./tools/CalculatorTools').then(m => ({ default: m.SpeedConverter }))),
  'wifi-qr': lazy(() => import('./tools/SecurityTools').then(m => ({ default: m.WifiQr }))),
  'password-generator': lazy(() => import('./tools/SecurityTools').then(m => ({ default: m.PasswordGenerator }))),
  'password-checker': lazy(() => import('./tools/SecurityTools').then(m => ({ default: m.PasswordChecker }))),
  'bulk-renamer': lazy(() => import('./tools/SecurityTools').then(m => ({ default: m.BulkRenamer }))),
  'extension-changer': lazy(() => import('./tools/SecurityTools').then(m => ({ default: m.ExtensionChanger }))),
  'random-number': lazy(() => import('./tools/SecurityTools').then(m => ({ default: m.RandomNumber }))),
  'random-choice': lazy(() => import('./tools/SecurityTools').then(m => ({ default: m.RandomChoice }))),
  'dice-roller': lazy(() => import('./tools/SecurityTools').then(m => ({ default: m.DiceRoller }))),
  'coin-flip': lazy(() => import('./tools/SecurityTools').then(m => ({ default: m.CoinFlip }))),

  // ── NEW: Image & Media Tools ──
  'meme-generator': lazy(() => import('./tools/ImageMediaTools').then(m => ({ default: m.MemeGenerator }))),
  'batch-watermarker': lazy(() => import('./tools/ImageMediaTools').then(m => ({ default: m.BatchWatermarker }))),
  'target-compressor': lazy(() => import('./tools/ImageMediaTools').then(m => ({ default: m.TargetCompressor }))),
  'image-anonymizer': lazy(() => import('./tools/ImageMediaTools').then(m => ({ default: m.ImageAnonymizer }))),

  // ── NEW: Audio & Hardware Tools ──
  'audio-trimmer': lazy(() => import('./tools/AudioHardwareTools').then(m => ({ default: m.AudioTrimmer }))),
  'webcam-mic-inspector': lazy(() => import('./tools/AudioHardwareTools').then(m => ({ default: m.WebcamMicInspector }))),
  'keyboard-tester': lazy(() => import('./tools/AudioHardwareTools').then(m => ({ default: m.KeyboardTester }))),

  // ── NEW: Security & Privacy ──
  'aes-cipher': lazy(() => import('./tools/SecurityPrivacyTools').then(m => ({ default: m.AesCipher }))),
  'steganography': lazy(() => import('./tools/SecurityPrivacyTools').then(m => ({ default: m.Steganography }))),

  // ── NEW: Analysis Tools ──
  'unit-price-compare': lazy(() => import('./tools/AnalysisTools').then(m => ({ default: m.UnitPriceCompare }))),
  'aspect-ratio-calc': lazy(() => import('./tools/AnalysisTools').then(m => ({ default: m.AspectRatioCalc }))),
  'readability-analyzer': lazy(() => import('./tools/AnalysisTools').then(m => ({ default: m.ReadabilityAnalyzer }))),
  'paper-generator': lazy(() => import('./tools/AnalysisTools').then(m => ({ default: m.PaperGenerator }))),
};

const VALID_TOOL_IDS = TOOLS.map(t => t.id);

function parseHash(): { tool: string | null; category: string | null } {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!hash || hash === 'dashboard') return { tool: null, category: null };
  if (VALID_TOOL_IDS.includes(hash)) return { tool: hash, category: null };
  const decoded = decodeURIComponent(hash);
  const cat = CATEGORIES.find(c => c.name === decoded);
  if (cat) return { tool: null, category: cat.name };
  return { tool: null, category: null };
}

function buildHash(tool: string | null, category: string | null): string {
  if (tool) return `#/${tool}`;
  if (category) return `#/${encodeURIComponent(category)}`;
  return '#/dashboard';
}

const ToolLoading = () => (
  <div className="tool-container flex items-center justify-center py-20">
    <div className="text-center">
      <i className="fas fa-spinner fa-spin text-3xl mb-3" style={{ color: 'var(--accent)' }}></i>
      <p style={{ color: 'var(--text-muted)' }}>Loading tool...</p>
    </div>
  </div>
);

function App() {
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

  useEffect(() => {
    const newHash = buildHash(activeTool, activeCategory);
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
  }, [activeTool, activeCategory]);

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash();
      setActiveTool(parsed.tool);
      setActiveCategory(parsed.category);
      if (!parsed.tool) setSearchQuery('');
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('multitool-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
    if (isOledMode) document.body.classList.add('oled-black');
    else document.body.classList.remove('oled-black');
  }, [darkMode, isOledMode]);

  const filteredTools = useMemo(() => {
    let tools = TOOLS;
    if (activeCategory) tools = tools.filter(t => t.category === activeCategory);
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

  // Group tools by category for dashboard sections
  const toolsByCategory = useMemo(() => {
    const groups: Record<string, typeof TOOLS> = {};
    const source = searchQuery.trim() ? filteredTools : (activeCategory ? filteredTools : TOOLS);
    source.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTools, searchQuery, activeCategory]);

  const openTool = useCallback((id: string) => {
    setActiveTool(id);
    setActiveCategory(null);
    setSidebarOpen(false);
  }, []);

  const goBack = useCallback(() => {
    setActiveTool(null);
    setSearchQuery('');
  }, []);

  const goToDashboard = useCallback(() => {
    setActiveTool(null);
    setActiveCategory(null);
    setSearchQuery('');
    setSidebarOpen(false);
  }, []);

  const selectCategory = useCallback((catName: string) => {
    setActiveCategory(catName);
    setActiveTool(null);
    setSearchQuery('');
    setSidebarOpen(false);
  }, []);

  const activeToolMeta = TOOLS.find(t => t.id === activeTool);
  const ActiveToolComponent = activeTool ? ToolModules[activeTool] : null;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : 'light'}`} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Sidebar Overlay */}
      <div className={`sidebar-overlay lg:hidden ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${activeTool ? 'collapsed' : ''}`}>
        <div className="p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-toolbox text-white text-lg"></i>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>MultiTool</h1>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{TOOLS.length} Tools</p>
            </div>
          </div>
        </div>

        <nav className="p-3 sm:p-4">
          <button
            onClick={goToDashboard}
            className="w-full text-left px-3 sm:px-4 py-2.5 rounded-lg mb-2 font-medium transition-all flex items-center gap-3"
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

          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.name && !activeTool;
            const toolCount = TOOLS.filter(t => t.category === cat.name).length;
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.name)}
                className="w-full text-left px-3 sm:px-4 py-2 rounded-lg mb-1 text-sm transition-all flex items-center gap-3 group"
                style={{
                  background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                  color: isActive ? cat.color : 'var(--text-secondary)'
                }}
              >
                <i className={`fas ${cat.icon} w-5 text-center flex-shrink-0`} style={{ color: isActive ? cat.color : undefined }}></i>
                <span className="truncate flex-1">{cat.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{toolCount}</span>
              </button>
            );
          })}
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
              placeholder="Search all 49 tools..."
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
            {/* Hero section */}
            {!activeCategory && !searchQuery && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Welcome to MultiTool
                </h2>
                <p className="text-sm sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {TOOLS.length} browser-based tools across {CATEGORIES.length} categories. All processing happens locally in your browser.
                </p>
              </div>
            )}

            {activeCategory && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: CATEGORY_MAP[activeCategory]?.color || 'var(--accent)' }}>
                    <i className={`fas ${CATEGORY_MAP[activeCategory]?.icon} text-white`}></i>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeCategory}</h2>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {searchQuery && (
              <div className="mb-4">
                <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                  {filteredTools.length} result{filteredTools.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              </div>
            )}

            {/* Category Sections */}
            {CATEGORIES.filter(cat => toolsByCategory[cat.name]?.length).map(cat => (
              <section key={cat.id} className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center" style={{ background: cat.color }}>
                      <i className={`fas ${cat.icon} text-white text-xs sm:text-sm`}></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>{cat.name}</h3>
                      <p className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                        {toolsByCategory[cat.name].length} tools
                      </p>
                    </div>
                  </div>
                  {!activeCategory && !searchQuery && (
                    <button
                      onClick={() => selectCategory(cat.name)}
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1"
                      style={{ color: cat.color, background: 'var(--bg-tertiary)' }}
                    >
                      View all <i className="fas fa-chevron-right text-[8px] sm:text-[10px]"></i>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {toolsByCategory[cat.name].map(tool => (
                    <div
                      key={tool.id}
                      className="tool-card"
                      onClick={() => openTool(tool.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openTool(tool.id); }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                        >
                          <i className={`fas ${tool.icon} text-sm`} style={{ color: cat.color }}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{tool.name}</h4>
                          <p className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>{tool.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {filteredTools.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <i className="fas fa-search text-3xl sm:text-4xl mb-4" style={{ color: 'var(--text-muted)' }}></i>
                <p className="text-base sm:text-lg" style={{ color: 'var(--text-muted)' }}>No tools found matching your search.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            <Suspense fallback={<ToolLoading />}>
              {ActiveToolComponent && <ActiveToolComponent />}
            </Suspense>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
