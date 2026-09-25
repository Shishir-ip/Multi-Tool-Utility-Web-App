import React from 'react';
import { AIToolBase } from '../components/AIToolBase';

export const AIResumeBuilder: React.FC = () => {
  return (
    <AIToolBase
      title="AI Resume Builder"
      description="Generate professional resume content with AI assistance"
      icon="fa-file-alt"
      color="#a855f7"
      systemPrompt="You are a professional resume writer and career coach. Help the user create compelling resume content. Provide well-structured, action-oriented bullet points that highlight achievements and skills. Use strong action verbs and quantify achievements where possible. Format the content professionally and make it ATS-friendly (Applicant Tracking System). Tailor the content to the specific job or industry if mentioned."
      inputLabel="Your Information or Request"
      outputLabel="Resume Content"
      placeholder="Describe what you need (e.g., 'Write bullet points for my software developer experience', 'Create a professional summary for a marketing manager', 'Help me describe my project management skills')..."
      maxTokens={1200}
    />
  );
};
