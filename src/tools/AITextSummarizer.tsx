import React from 'react';
import { AIToolBase } from '../components/AIToolBase';

export const AITextSummarizer: React.FC = () => {
  return (
    <AIToolBase
      title="AI Text Summarizer"
      description="Summarize long text into concise, key points using AI"
      icon="fa-compress-alt"
      color="#a855f7"
      systemPrompt="You are a helpful text summarizer. Summarize the given text concisely while preserving the key points and main ideas. Keep the summary clear, well-structured, and easy to understand. Use bullet points or short paragraphs as appropriate."
      inputLabel="Text to Summarize"
      outputLabel="Summary"
      placeholder="Paste your long text here (article, document, notes, etc.)..."
      maxTokens={500}
    />
  );
};
