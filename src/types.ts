export interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  keywords: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'pdf-document', name: 'PDF & Document Tools', icon: 'fa-file-pdf', color: '#ef4444' },
  { id: 'image-design', name: 'Image & Design Suite', icon: 'fa-images', color: '#8b5cf6' },
  { id: 'developer', name: 'Developer & Coding', icon: 'fa-code', color: '#10b981' },
  { id: 'student', name: 'Student & Academic', icon: 'fa-graduation-cap', color: '#f59e0b' },
  { id: 'finance', name: 'Finance & Business', icon: 'fa-coins', color: '#06b6d4' },
  { id: 'time', name: 'Time & Productivity', icon: 'fa-clock', color: '#ec4899' },
  { id: 'calculators', name: 'Calculators & Converters', icon: 'fa-calculator', color: '#3b82f6' },
  { id: 'security', name: 'Security & Utilities', icon: 'fa-shield-alt', color: '#6366f1' },
];

export const TOOLS: Tool[] = [
  // ── PDF & Document Tools ──
  { id: 'photo-to-pdf', name: 'Photo to PDF', category: 'PDF & Document Tools', description: 'Convert images to PDF documents', icon: 'fa-image', keywords: ['photo','pdf','convert','image'] },
  { id: 'pdf-to-image', name: 'PDF to Image', category: 'PDF & Document Tools', description: 'Extract pages from PDF as images', icon: 'fa-file-image', keywords: ['pdf','image','extract','convert'] },
  { id: 'pdf-merger', name: 'PDF Merger', category: 'PDF & Document Tools', description: 'Merge multiple PDFs into one', icon: 'fa-object-group', keywords: ['pdf','merge','combine','join'] },
  { id: 'pdf-compressor', name: 'PDF Compressor', category: 'PDF & Document Tools', description: 'Reduce PDF file size', icon: 'fa-compress', keywords: ['pdf','compress','reduce','size'] },
  { id: 'pdf-extractor', name: 'PDF Page Extractor', category: 'PDF & Document Tools', description: 'Extract specific pages from PDF', icon: 'fa-scissors', keywords: ['pdf','extract','pages','split'] },
  { id: 'pdf-reorderer', name: 'PDF Page Reorderer', category: 'PDF & Document Tools', description: 'Rearrange pages in a PDF', icon: 'fa-arrows-alt', keywords: ['pdf','reorder','rearrange','pages'] },

  // ── Image & Design Suite ──
  { id: 'image-resizer', name: 'Image Resizer', category: 'Image & Design Suite', description: 'Resize images with aspect ratio lock', icon: 'fa-expand', keywords: ['image','resize','scale','dimensions'] },
  { id: 'image-converter', name: 'Image Converter', category: 'Image & Design Suite', description: 'Convert between JPG, PNG, WEBP', icon: 'fa-exchange-alt', keywords: ['image','convert','jpg','png','webp'] },
  { id: 'image-cropper', name: 'Advanced Image Cropper', category: 'Image & Design Suite', description: 'Freehand, circle, square, ratio cropping', icon: 'fa-crop-alt', keywords: ['image','crop','freehand','circle','square'] },
  { id: 'exif-viewer', name: 'EXIF/Metadata Viewer', category: 'Image & Design Suite', description: 'View image metadata and EXIF data', icon: 'fa-info-circle', keywords: ['exif','metadata','image','info'] },
  { id: 'collage-maker', name: 'Photo Collage Maker', category: 'Image & Design Suite', description: 'Create photo collages from images', icon: 'fa-th', keywords: ['collage','photo','grid','layout'] },
  { id: 'favicon-generator', name: 'Favicon Generator', category: 'Image & Design Suite', description: 'Generate favicons from images or text', icon: 'fa-star', keywords: ['favicon','icon','generate','website'] },

  // ── Developer & Coding ──
  { id: 'code-runner', name: 'HTML/CSS/JS Runner', category: 'Developer & Coding', description: 'Write and run code in real-time', icon: 'fa-code', keywords: ['code','html','css','javascript','run'] },
  { id: 'color-picker', name: 'Color Picker', category: 'Developer & Coding', description: 'Pick colors in HEX, RGB, HSL', icon: 'fa-eye-dropper', keywords: ['color','hex','rgb','hsl','picker'] },

  // ── Student & Academic ──
  { id: 'word-counter', name: 'Word Counter', category: 'Student & Academic', description: 'Count words, characters, reading time', icon: 'fa-font', keywords: ['word','count','character','reading'] },
  { id: 'gpa-calculator', name: 'GPA/CGPA Calculator', category: 'Student & Academic', description: 'Calculate GPA and CGPA', icon: 'fa-chart-line', keywords: ['gpa','cgpa','grade','calculator'] },
  { id: 'marks-calculator', name: 'Exam Marks Calculator', category: 'Student & Academic', description: 'Calculate exam marks and percentages', icon: 'fa-clipboard-check', keywords: ['marks','exam','percentage','score'] },
  { id: 'attendance-calculator', name: 'Attendance Calculator', category: 'Student & Academic', description: 'Track and calculate attendance', icon: 'fa-calendar-check', keywords: ['attendance','tracker','percentage','target'] },
  { id: 'citation-generator', name: 'Citation Generator', category: 'Student & Academic', description: 'Generate APA/MLA/Chicago citations', icon: 'fa-quote-left', keywords: ['citation','apa','mla','chicago','reference'] },
  { id: 'matrix-calculator', name: 'Matrix Calculator', category: 'Student & Academic', description: 'Matrix operations: add, multiply, determinant', icon: 'fa-th', keywords: ['matrix','determinant','multiply','add'] },

  // ── Finance & Business ──
  { id: 'discount-calculator', name: 'Discount Calculator', category: 'Finance & Business', description: 'Calculate discounts and savings', icon: 'fa-percent', keywords: ['discount','sale','price','savings'] },
  { id: 'loan-calculator', name: 'Loan/EMI Calculator', category: 'Finance & Business', description: 'Calculate EMI and loan payments', icon: 'fa-money-bill-wave', keywords: ['loan','emi','interest','payment'] },
  { id: 'bkash-calculator', name: 'bKash/Nagad Cash-Out Calculator', category: 'Finance & Business', description: 'Calculate mobile banking fees', icon: 'fa-mobile-alt', keywords: ['bkash','nagad','cashout','fee','mobile'] },

  // ── Time & Productivity ──
  { id: 'digital-clock', name: 'Big Digital Clock', category: 'Time & Productivity', description: 'Full-screen digital clock', icon: 'fa-clock', keywords: ['clock','digital','time','display'] },
  { id: 'analog-clock', name: 'Big Analog Clock', category: 'Time & Productivity', description: 'Smooth analog clock face', icon: 'fa-stopwatch', keywords: ['clock','analog','time','watch'] },
  { id: 'stopwatch', name: 'Stopwatch', category: 'Time & Productivity', description: 'High-precision stopwatch with laps', icon: 'fa-hourglass-half', keywords: ['stopwatch','timer','lap','split'] },
  { id: 'timer', name: 'Countdown Timer', category: 'Time & Productivity', description: 'Countdown with progress ring', icon: 'fa-hourglass-end', keywords: ['timer','countdown','alarm'] },
  { id: 'pomodoro', name: 'Pomodoro Timer', category: 'Time & Productivity', description: 'Focus timer with work/break cycles', icon: 'fa-tomato', keywords: ['pomodoro','focus','work','break','productivity'] },
  { id: 'timezone-converter', name: 'Time Zone Converter', category: 'Time & Productivity', description: 'Convert time between zones', icon: 'fa-globe', keywords: ['timezone','convert','utc','gmt'] },
  { id: 'date-calculator', name: 'Date Calculator', category: 'Time & Productivity', description: 'Add/subtract days from a date', icon: 'fa-calendar-plus', keywords: ['date','add','subtract','days'] },
  { id: 'business-days', name: 'Business Days Calculator', category: 'Time & Productivity', description: 'Count business days between dates', icon: 'fa-briefcase', keywords: ['business','days','workdays','weekday'] },
  { id: 'days-between', name: 'Days Between Calculator', category: 'Time & Productivity', description: 'Count days between two dates', icon: 'fa-calendar-minus', keywords: ['days','between','difference','dates'] },
  { id: 'calendar-generator', name: 'Calendar Generator', category: 'Time & Productivity', description: 'Generate printable calendars', icon: 'fa-calendar-alt', keywords: ['calendar','generate','print','monthly'] },

  // ── Calculators & Converters ──
  { id: 'bmi-calculator', name: 'BMI Calculator', category: 'Calculators & Converters', description: 'Calculate Body Mass Index', icon: 'fa-weight', keywords: ['bmi','body','mass','health','weight'] },
  { id: 'age-calculator', name: 'Age Calculator', category: 'Calculators & Converters', description: 'Calculate exact age from birthdate', icon: 'fa-birthday-cake', keywords: ['age','birthday','years','calculator'] },
  { id: 'unit-converter', name: 'General Unit Converter', category: 'Calculators & Converters', description: 'Convert length, weight, temperature', icon: 'fa-balance-scale', keywords: ['unit','convert','length','weight','temperature'] },
  { id: 'storage-converter', name: 'Data Storage Converter', category: 'Calculators & Converters', description: 'Convert KB, MB, GB, TB', icon: 'fa-hdd', keywords: ['storage','data','kb','mb','gb','tb'] },
  { id: 'speed-converter', name: 'Speed Converter', category: 'Calculators & Converters', description: 'Convert Mbps to MB/s and more', icon: 'fa-tachometer-alt', keywords: ['speed','mbps','mbs','bandwidth'] },

  // ── Security & Utilities ──
  { id: 'qr-generator', name: 'QR Code Generator', category: 'Security & Utilities', description: 'Generate customizable QR codes', icon: 'fa-qrcode', keywords: ['qr','code','generate','barcode'] },
  { id: 'wifi-qr', name: 'Wi-Fi QR Generator', category: 'Security & Utilities', description: 'Generate Wi-Fi QR codes', icon: 'fa-wifi', keywords: ['wifi','qr','network','password'] },
  { id: 'password-generator', name: 'Strong Password Generator', category: 'Security & Utilities', description: 'Generate secure passwords', icon: 'fa-key', keywords: ['password','generate','secure','strong'] },
  { id: 'password-checker', name: 'Password Strength Checker', category: 'Security & Utilities', description: 'Check password strength', icon: 'fa-shield-alt', keywords: ['password','strength','check','security'] },
  { id: 'bulk-renamer', name: 'Bulk File Renamer', category: 'Security & Utilities', description: 'Rename multiple files at once', icon: 'fa-edit', keywords: ['bulk','rename','files','batch'] },
  { id: 'extension-changer', name: 'File Extension Changer', category: 'Security & Utilities', description: 'Change file extensions in bulk', icon: 'fa-file-signature', keywords: ['extension','change','file','rename'] },
  { id: 'random-number', name: 'Random Number Generator', category: 'Security & Utilities', description: 'Generate random numbers', icon: 'fa-dice', keywords: ['random','number','generate'] },
  { id: 'random-choice', name: 'Random Choice Picker', category: 'Security & Utilities', description: 'Pick random items from a list', icon: 'fa-list', keywords: ['random','choice','pick','list'] },
  { id: 'dice-roller', name: 'Dice Roller', category: 'Security & Utilities', description: 'Roll virtual dice', icon: 'fa-dice-d6', keywords: ['dice','roll','random','game'] },
  { id: 'coin-flip', name: 'Coin Flip', category: 'Security & Utilities', description: 'Flip a virtual coin', icon: 'fa-coins', keywords: ['coin','flip','heads','tails','random'] },
  { id: 'whatsapp-chat', name: 'WhatsApp Direct Chat', category: 'Security & Utilities', description: 'Chat with unsaved numbers instantly', icon: 'fa-whatsapp', keywords: ['whatsapp','chat','message','phone','contact'] },

  // ── Image & Media Tools (NEW) ──
  { id: 'meme-generator', name: 'Meme Generator', category: 'Image & Design Suite', description: 'Create memes with custom text', icon: 'fa-face-laugh', keywords: ['meme','text','image','funny','caption'] },
  { id: 'batch-watermarker', name: 'Batch Photo Watermarker', category: 'Image & Design Suite', description: 'Add watermarks to multiple images', icon: 'fa-stamp', keywords: ['watermark','batch','logo','text','protect'] },
  { id: 'target-compressor', name: 'Target File Size Compressor', category: 'Image & Design Suite', description: 'Compress images to target file size', icon: 'fa-bullseye', keywords: ['compress','target','size','kb','mb','optimize'] },
  { id: 'image-anonymizer', name: 'Image Anonymizer', category: 'Image & Design Suite', description: 'Blur or pixelate sensitive areas', icon: 'fa-user-secret', keywords: ['blur','pixelate','anonymize','face','privacy'] },

  // ── Audio & Hardware Tools (NEW) ──
  { id: 'audio-trimmer', name: 'Audio Trimmer', category: 'Developer & Coding', description: 'Trim and cut audio files', icon: 'fa-scissors', keywords: ['audio','trim','cut','mp3','wav','edit'] },
  { id: 'webcam-mic-inspector', name: 'Webcam & Mic Inspector', category: 'Developer & Coding', description: 'Test camera and microphone', icon: 'fa-video', keywords: ['webcam','camera','microphone','mic','test','device'] },
  { id: 'keyboard-tester', name: 'Keyboard Tester', category: 'Developer & Coding', description: 'Test keyboard keys and rollover', icon: 'fa-keyboard', keywords: ['keyboard','test','key','rollover','nkro'] },

  // ── Security & Privacy (NEW) ──
  { id: 'aes-cipher', name: 'AES Encrypter/Decrypter', category: 'Security & Utilities', description: 'Encrypt text and files with AES-256', icon: 'fa-lock', keywords: ['aes','encrypt','decrypt','cipher','security','password'] },
  { id: 'steganography', name: 'Image Steganography', category: 'Security & Utilities', description: 'Hide text inside images', icon: 'fa-eye-slash', keywords: ['steganography','hide','secret','image','message','lsb'] },

  // ── Practical Calculators & Analysis (NEW) ──
  { id: 'unit-price-compare', name: 'Unit Price Compare', category: 'Calculators & Converters', description: 'Compare best value per unit', icon: 'fa-tags', keywords: ['unit','price','compare','value','best','cheap'] },
  { id: 'aspect-ratio-calc', name: 'Aspect Ratio Calculator', category: 'Calculators & Converters', description: 'Calculate screen dimensions', icon: 'fa-desktop', keywords: ['aspect','ratio','screen','resolution','width','height'] },
  { id: 'readability-analyzer', name: 'Readability Analyzer', category: 'Student & Academic', description: 'Analyze text readability scores', icon: 'fa-book-open', keywords: ['readability','flesch','grade','level','analyze','text'] },
  { id: 'paper-generator', name: 'Printable Paper Generator', category: 'Student & Academic', description: 'Generate lined, grid, or dot paper', icon: 'fa-file-lines', keywords: ['paper','print','lined','grid','dot','notebook'] },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map(c => [c.name, c])
);

export const TIME_FOCUS_IDS = ['digital-clock', 'analog-clock', 'stopwatch', 'timer', 'pomodoro'];
