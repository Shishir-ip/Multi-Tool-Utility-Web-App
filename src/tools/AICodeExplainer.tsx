import React from 'react';
import { AIToolBase } from '../components/AIToolBase';

export const AICodeExplainer: React.FC = () => {
  return (
    <AIToolBase
      title="AI Code Explainer"
      description="Get clear explanations of code snippets and algorithms"
      icon="fa-code"
      color="#a855f7"
      systemPrompt="You are an expert programmer and teacher. Explain the given code clearly and concisely. Break down complex logic into understandable parts. Explain what the code does, how it works, and any important concepts. Use simple language and provide examples if helpful. Format your explanation with clear sections and code references."
      inputLabel="Code to Explain"
      outputLabel="Explanation"
      placeholder="Paste your code here (any programming language)..."
      maxTokens={1500}
    />
  );
};
