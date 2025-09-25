import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface HealthDocsProps {
  className?: string;
}

const HealthDocs: React.FC<HealthDocsProps> = ({ className = '' }) => {
  return (
    <div className={`health-docs ${className}`}>
      <MarkdownRenderer 
        markdownPath="/docs/api/health.md"
        className="health-documentation"
      />
    </div>
  );
};

export default HealthDocs;
