import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface InventoryDocsProps {
  className?: string;
}

const InventoryDocs: React.FC<InventoryDocsProps> = ({ className = '' }) => {
  return (
    <div className={`inventory-docs ${className}`}>
      <MarkdownRenderer 
        markdownPath="/docs/api/inventory.md"
        className="inventory-documentation"
      />
    </div>
  );
};

export default InventoryDocs;
