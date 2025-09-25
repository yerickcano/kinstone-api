import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface UsersDocsProps {
  className?: string;
}

const UsersDocs: React.FC<UsersDocsProps> = ({ className = '' }) => {
  return (
    <div className={`users-docs ${className}`}>
      <MarkdownRenderer 
        markdownPath="/docs/api/users.md"
        className="users-documentation"
      />
    </div>
  );
};

export default UsersDocs;
