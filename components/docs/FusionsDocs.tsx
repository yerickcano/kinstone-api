import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface FusionsDocsProps {
  className?: string;
}

const FusionsDocs: React.FC<FusionsDocsProps> = ({ className = '' }) => {
  return (
    <div className={`fusions-docs ${className}`}>
      <MarkdownRenderer 
        markdownPath="/docs/api/fusions.md"
        className="fusions-documentation"
      />
    </div>
  );
};

export default FusionsDocs;
