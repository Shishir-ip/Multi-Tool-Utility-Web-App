import React from 'react';
import { AIToolBase } from '../components/AIToolBase';

export const AIWritingAssistant: React.FC = () => {
  return (
    <AIToolBase
      title="AI Writing Assistant"
      description="Get AI help with writing, editing, and improving your text"
      icon="fa-pen-fancy"
      color="#a855f7"
      systemPrompt="You are a helpful writing assistant. Help the user improve their writing by providing suggestions, corrections, or rewrites as requested. Maintain the original tone and intent while improving clarity, grammar, and style. If the user asks for a rewrite, provide a polished version. If they ask for suggestions, provide actionable feedback."
      inputLabel="Your Text or Instructions"
      outputLabel="AI Response"
      placeholder="Enter your text to improve, or describe what you need help with (e.g., 'Make this more professional', 'Fix grammar', 'Rewrite this paragraph')..."
      maxTokens={1500}
    />
  );
};
