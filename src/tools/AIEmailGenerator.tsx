import React from 'react';
import { AIToolBase } from '../components/AIToolBase';

export const AIEmailGenerator: React.FC = () => {
  return (
    <AIToolBase
      title="AI Email Generator"
      description="Generate professional emails for any purpose"
      icon="fa-envelope"
      color="#a855f7"
      systemPrompt="You are a professional email writer. Generate a well-structured, professional email based on the user's requirements. Include appropriate greeting, body, and closing. Match the tone (formal, semi-formal, or casual) as specified. Keep the email concise but complete. Format it ready to copy and send."
      inputLabel="Email Requirements"
      outputLabel="Generated Email"
      placeholder="Describe what you need (e.g., 'Write a formal email to my professor requesting an extension on assignment due to illness', 'Write a follow-up email after a job interview', 'Write a thank you email to a client')..."
      maxTokens={800}
    />
  );
};
