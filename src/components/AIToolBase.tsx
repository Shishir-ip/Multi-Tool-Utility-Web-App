import React, { useState, useEffect } from 'react';
import { loadAIConfig, isAIConfigured, callAI, AIConfig } from '../utils/ai-provider';

interface AIToolBaseProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
  placeholder: string;
  inputLabel: string;
  outputLabel: string;
  maxTokens?: number;
  children?: React.ReactNode;
}

export const AIToolBase: React.FC<AIToolBaseProps> = ({
  title,
  description,
  icon,
  color,
  systemPrompt,
  placeholder,
  inputLabel,
  outputLabel,
  maxTokens = 1000,
  children
}) => {
  const [config, setConfig] = useState<AIConfig>(loadAIConfig());
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reload config when component mounts (in case it was updated in AI Setup)
  useEffect(() => {
    setConfig(loadAIConfig());
  }, []);

  const handleProcess = async () => {
    if (!input.trim()) {
      setError('Please enter some text');
      return;
    }

    if (!isAIConfigured(config)) {
      setError('Please configure your AI API key in AI API Setup first');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');

    try {
      const provider = config.providers.find(p => p.id === config.selectedProvider);
      if (!provider) throw new Error('No provider selected');

      const model = provider.models[0]; // Use first model
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: input }
      ];

      const result = await callAI(config, model, messages, { maxTokens });
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="tool-container">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <i className={`fas ${icon}`} style={{ color }}></i>
          {title}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>

      {!isAIConfigured(config) && (
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b' }}>
          <p className="text-sm flex items-start gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-exclamation-triangle mt-0.5" style={{ color: '#f59e0b' }}></i>
            <span>
              AI API key not configured. Please go to{' '}
              <a href="#/ai-setup" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                AI API Setup
              </a>{' '}
              to add your API key.
            </span>
          </p>
        </div>
      )}

      {children}

      <div className="space-y-4">
        {/* Input Section */}
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
            {inputLabel}
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={placeholder}
            className="input-field"
            style={{ minHeight: '150px', resize: 'vertical' }}
            disabled={loading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleProcess}
            disabled={loading || !input.trim() || !isAIConfigured(config)}
            className="btn-primary"
            style={{ opacity: (loading || !input.trim() || !isAIConfigured(config)) ? 0.5 : 1 }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-magic mr-2"></i>
                Generate
              </>
            )}
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="btn-secondary"
          >
            <i className="fas fa-trash mr-2"></i>
            Clear
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
            <p className="text-sm flex items-start gap-2" style={{ color: '#ef4444' }}>
              <i className="fas fa-exclamation-circle mt-0.5"></i>
              {error}
            </p>
          </div>
        )}

        {/* Output Section */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {outputLabel}
              </label>
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1 rounded"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              >
                <i className="fas fa-copy mr-1"></i>
                Copy
              </button>
            </div>
            <div 
              className="p-4 rounded-lg whitespace-pre-wrap"
              style={{ 
                background: 'var(--bg-tertiary)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                minHeight: '150px'
              }}
            >
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
