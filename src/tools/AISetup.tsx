import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../components/Shared';
import { loadAIConfig, saveAIConfig, AIConfig } from '../utils/ai-provider';

export const AISetup: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>(loadAIConfig());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateProvider = (providerId: string, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      providers: prev.providers.map(p => 
        p.id === providerId ? { ...p, [field]: value } : p
      )
    }));
  };

  const selectProvider = (providerId: string) => {
    setConfig(prev => ({ ...prev, selectedProvider: providerId }));
  };

  return (
    <div className="tool-container">
      <ToolHeader 
        icon="fa-key" 
        title="AI API Setup" 
        description="Configure your AI provider API keys to use AI-powered tools" 
        color="#a855f7" 
      />

      <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <i className="fas fa-info-circle mr-2" style={{ color: 'var(--accent)' }}></i>
          Your API keys are stored locally in your browser and never sent to our servers. 
          They are only used to make requests directly to the AI providers.
        </p>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <label className="text-sm font-medium block mb-3" style={{ color: 'var(--text-primary)' }}>
          Select AI Provider
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {config.providers.map(provider => (
            <button
              key={provider.id}
              onClick={() => selectProvider(provider.id)}
              className="p-4 rounded-lg text-left transition-all"
              style={{
                background: config.selectedProvider === provider.id ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: config.selectedProvider === provider.id ? 'white' : 'var(--text-primary)',
                border: `2px solid ${config.selectedProvider === provider.id ? 'var(--accent)' : 'var(--border-color)'}`
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <i className={`fas ${provider.id === 'openrouter' ? 'fa-route' : 'fa-google'}`}></i>
                <span className="font-medium">{provider.name}</span>
              </div>
              <p className="text-xs opacity-80">
                {provider.id === 'openrouter' 
                  ? 'Access multiple AI models through one API' 
                  : 'Google Gemini AI models'}
              </p>
              {provider.apiKey && (
                <p className="text-xs mt-2 opacity-80">
                  <i className="fas fa-check-circle mr-1"></i>
                  API key configured
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* API Key Configuration */}
      {config.providers.map(provider => (
        config.selectedProvider === provider.id && (
          <div key={provider.id} className="mb-6 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {provider.name} Configuration
            </h3>

            <div className="mb-4">
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                API Key
              </label>
              <input
                type="password"
                value={provider.apiKey}
                onChange={e => updateProvider(provider.id, 'apiKey', e.target.value)}
                placeholder={`Enter your ${provider.name} API key`}
                className="input-field"
              />
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                {provider.id === 'openrouter' && (
                  <>
                    Get your API key from{' '}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" 
                       style={{ color: 'var(--accent)' }}>
                      openrouter.ai/keys
                    </a>
                    {' '}(free models available)
                  </>
                )}
                {provider.id === 'gemini' && (
                  <>
                    Get your API key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" 
                       style={{ color: 'var(--accent)' }}>
                      Google AI Studio
                    </a>
                    {' '}(free tier available)
                  </>
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Available Models
              </label>
              <div className="space-y-1">
                {provider.models.map(model => (
                  <div key={model} className="text-xs p-2 rounded" style={{ background: 'var(--card-bg)', color: 'var(--text-muted)' }}>
                    <code>{model}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ))}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="btn-primary"
          style={{ background: saved ? '#10b981' : 'var(--accent)' }}
        >
          <i className={`fas ${saved ? 'fa-check' : 'fa-save'} mr-2`}></i>
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: '#10b981' }}>
            <i className="fas fa-check-circle mr-1"></i>
            Configuration saved successfully
          </span>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <h3 className="font-semibold mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-question-circle mr-2" style={{ color: 'var(--accent)' }}></i>
          How to get API keys
        </h3>
        <div className="space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>OpenRouter (Recommended)</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Visit <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>openrouter.ai</a></li>
              <li>Sign up for a free account</li>
              <li>Go to Keys section</li>
              <li>Create a new API key</li>
              <li>Copy and paste it above</li>
            </ol>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
              OpenRouter offers free models like Llama 3, Mistral, and Gemma.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Google AI Studio (Gemini)</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Visit <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>aistudio.google.com</a></li>
              <li>Sign in with your Google account</li>
              <li>Go to "Get API key"</li>
              <li>Create a new API key</li>
              <li>Copy and paste it above</li>
            </ol>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
              Gemini offers a generous free tier with fast models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
