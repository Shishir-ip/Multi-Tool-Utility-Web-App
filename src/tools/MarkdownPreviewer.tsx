import React, { useState } from 'react';
import { ToolHeader } from '../components/Shared';

// Simple markdown parser (basic implementation)
function parseMarkdown(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
  html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%;" />');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr />');

  // Line breaks
  html = html.replace(/\n/gim, '<br />');

  return html;
}

export const MarkdownPreviewer: React.FC = () => {
  const [markdown, setMarkdown] = useState(`# Welcome to Markdown Previewer

This is a **live preview** of your markdown text.

## Features

- Real-time preview
- Support for common markdown syntax
- Easy to use

### Code Example

\`\`\`
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### Links and Images

[Visit GitHub](https://github.com)

> This is a blockquote

---

Start typing to see the preview!`);

  const html = parseMarkdown(markdown);

  return (
    <div className="tool-container">
      <ToolHeader
        icon="fa-markdown"
        title="Markdown Previewer"
        description="Write markdown and see live preview"
        color="#10b981"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
            <i className="fas fa-edit mr-2"></i>
            Markdown Editor
          </label>
          <textarea
            value={markdown}
            onChange={e => setMarkdown(e.target.value)}
            className="input-field font-mono text-sm"
            style={{ 
              minHeight: '500px', 
              resize: 'vertical',
              fontFamily: 'monospace'
            }}
            placeholder="Type your markdown here..."
          />
        </div>

        {/* Preview */}
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
            <i className="fas fa-eye mr-2"></i>
            Preview
          </label>
          <div
            className="p-4 rounded-lg overflow-auto"
            style={{ 
              background: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-color)',
              minHeight: '500px',
              maxHeight: '500px'
            }}
          >
            <div
              className="markdown-preview"
              style={{ color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>

      {/* Markdown Syntax Help */}
      <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-question-circle mr-2" style={{ color: 'var(--accent)' }}></i>
          Markdown Syntax Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Headers</p>
            <code># H1</code>, <code>## H2</code>, <code>### H3</code>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Emphasis</p>
            <code>*italic*</code>, <code>**bold**</code>, <code>***both***</code>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Lists</p>
            <code>- item</code> or <code>* item</code>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Links</p>
            <code>[text](url)</code>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Code</p>
            <code>`inline`</code> or <code>```block```</code>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Images</p>
            <code>![alt](url)</code>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Blockquotes</p>
            <code>&gt; quote</code>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Horizontal Rule</p>
            <code>---</code>
          </div>
        </div>
      </div>

      <style>{`
        .markdown-preview h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
        .markdown-preview h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
        .markdown-preview h3 { font-size: 1.2em; font-weight: bold; margin: 0.5em 0; }
        .markdown-preview strong { font-weight: bold; }
        .markdown-preview em { font-style: italic; }
        .markdown-preview code { 
          background: var(--card-bg); 
          padding: 2px 6px; 
          border-radius: 4px; 
          font-family: monospace;
          font-size: 0.9em;
        }
        .markdown-preview pre { 
          background: var(--card-bg); 
          padding: 12px; 
          border-radius: 6px; 
          overflow-x: auto;
          margin: 1em 0;
        }
        .markdown-preview pre code { 
          background: none; 
          padding: 0; 
        }
        .markdown-preview ul { 
          list-style-type: disc; 
          padding-left: 2em; 
          margin: 0.5em 0;
        }
        .markdown-preview li { 
          margin: 0.25em 0; 
        }
        .markdown-preview a { 
          color: var(--accent); 
          text-decoration: underline;
        }
        .markdown-preview blockquote { 
          border-left: 4px solid var(--accent); 
          padding-left: 1em; 
          margin: 1em 0;
          color: var(--text-secondary);
        }
        .markdown-preview hr { 
          border: none; 
          border-top: 2px solid var(--border-color); 
          margin: 1.5em 0;
        }
        .markdown-preview img { 
          max-width: 100%; 
          border-radius: 6px;
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
};
