export interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  keywords: string[];
}

export const TOOLS: Tool[] = [
  {
    id: 'photo-to-pdf',
    name: 'Photo to PDF',
    category: 'Photo & PDF',
    description: 'Convert images to PDF documents with orientation controls',
    icon: 'fa-file-pdf',
    keywords: ['photo', 'pdf', 'image', 'convert', 'document']
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    category: 'Photo & PDF',
    description: 'Resize images with aspect ratio lock and live preview',
    icon: 'fa-expand',
    keywords: ['image', 'resize', 'scale', 'dimensions', 'pixels']
  },
  {
    id: 'pdf-editor',
    name: 'Mini PDF Editor',
    category: 'Photo & PDF',
    description: 'Add text and drawings to existing PDF documents',
    icon: 'fa-edit',
    keywords: ['pdf', 'edit', 'text', 'draw', 'annotate']
  },
  {
    id: 'code-runner',
    name: 'Live Code Runner',
    category: 'Developer Tools',
    description: 'Write and run HTML, CSS, and JavaScript in real-time',
    icon: 'fa-code',
    keywords: ['code', 'html', 'css', 'javascript', 'run', 'editor']
  },
  {
    id: 'digital-clock',
    name: 'Digital Clock',
    category: 'Time & Focus',
    description: 'Full-screen digital clock with customizable display',
    icon: 'fa-clock',
    keywords: ['clock', 'digital', 'time', 'display', 'fullscreen']
  },
  {
    id: 'analog-clock',
    name: 'Analog Clock',
    category: 'Time & Focus',
    description: 'Smooth analog clock with hour, minute, and second hands',
    icon: 'fa-stopwatch',
    keywords: ['clock', 'analog', 'time', 'watch', 'hands']
  },
  {
    id: 'stopwatch',
    name: 'Stopwatch',
    category: 'Time & Focus',
    description: 'High-precision stopwatch with lap tracking',
    icon: 'fa-hourglass-half',
    keywords: ['stopwatch', 'timer', 'lap', 'split', 'precision']
  },
  {
    id: 'timer',
    name: 'Countdown Timer',
    category: 'Time & Focus',
    description: 'Countdown timer with progress ring and audio alert',
    icon: 'fa-hourglass-end',
    keywords: ['timer', 'countdown', 'alarm', 'alert', 'progress']
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    category: 'Student & Writing',
    description: 'Count words, characters, and estimate reading time',
    icon: 'fa-font',
    keywords: ['word', 'count', 'character', 'reading', 'writing', 'text']
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    category: 'General Utilities',
    description: 'Generate customizable QR codes from text or URLs',
    icon: 'fa-qrcode',
    keywords: ['qr', 'code', 'generate', 'barcode', 'scan']
  }
];

export const CATEGORIES = [...new Set(TOOLS.map(t => t.category))];
