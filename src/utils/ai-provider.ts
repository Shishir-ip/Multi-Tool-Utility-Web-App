// AI Provider Configuration
export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
}

export interface AIConfig {
  providers: AIProvider[];
  selectedProvider: string;
}

// Load AI config from localStorage
export function loadAIConfig(): AIConfig {
  const saved = localStorage.getItem('ai-config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Invalid config, return default
    }
  }
  
  return {
    providers: [
      {
        id: 'openrouter',
        name: 'OpenRouter',
        apiKey: '',
        baseUrl: 'https://openrouter.ai/api/v1',
        models: ['openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku', 'meta-llama/llama-3-8b-instruct:free']
      },
      {
        id: 'gemini',
        name: 'Google AI Studio (Gemini)',
        apiKey: '',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        models: ['gemini-1.5-flash', 'gemini-1.5-pro']
      }
    ],
    selectedProvider: 'openrouter'
  };
}

// Save AI config to localStorage
export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem('ai-config', JSON.stringify(config));
}

// Get current provider
export function getCurrentProvider(config: AIConfig): AIProvider | null {
  return config.providers.find(p => p.id === config.selectedProvider) || null;
}

// Check if AI is configured
export function isAIConfigured(config: AIConfig): boolean {
  const provider = getCurrentProvider(config);
  return provider !== null && provider.apiKey.trim() !== '';
}

// Make AI API call
export async function callAI(
  config: AIConfig,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const provider = getCurrentProvider(config);
  if (!provider) {
    throw new Error('No AI provider configured');
  }

  if (!provider.apiKey) {
    throw new Error('API key not set. Please configure your API key in AI API Setup.');
  }

  const { maxTokens = 1000, temperature = 0.7 } = options;

  if (provider.id === 'openrouter') {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'MultiTool AI'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  if (provider.id === 'gemini') {
    // Convert messages to Gemini format
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `${provider.baseUrl}/models/${model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  throw new Error('Unsupported provider');
}

// Free models for OpenRouter
export const FREE_MODELS = [
  { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B (Free)' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)' },
  { id: 'google/gemma-7b-it:free', name: 'Gemma 7B (Free)' }
];

// Gemini models
export const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Powerful)' }
];
