import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface PiecesDocsProps {
  className?: string;
}

const PiecesDocs: React.FC<PiecesDocsProps> = ({ className = '' }) => {
  return (
    <div className={`pieces-docs ${className}`}>
      <MarkdownRenderer 
        markdownPath="/docs/api/pieces.md"
        className="pieces-documentation"
      />
    </div>
  );
};

export default PiecesDocs;
