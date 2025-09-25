import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

// Import highlight.js CSS (you'll need to add this to your global CSS)
// import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  markdownPath: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  markdownPath, 
  className = '' 
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the markdown file
        const response = await fetch(markdownPath);
        
        if (!response.ok) {
          throw new Error(`Failed to load markdown: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error('Error loading markdown:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadMarkdown();
  }, [markdownPath]);

  if (loading) {
    return (
      <div className={`markdown-renderer ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`markdown-renderer error ${className}`}>
        <div className="error-message">
          <h3>⚠️ Error Loading Documentation</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`markdown-renderer ${className}`}
      style={{
        backgroundColor: '#c7f9cc',
        color: '#22577a',
        padding: '1rem',
        borderRadius: '8px'
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom component for code blocks
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isCodeBlock = match || (props.node && props.node.parent && props.node.parent.tagName === 'pre');
            
            if (isCodeBlock) {
              // This is a code block
              return (
                <code 
                  className={className} 
                  style={{ 
                    color: '#e2e8f0 !important',
                    background: 'transparent !important',
                    fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            } else {
              // This is inline code
              return (
                <code 
                  className={`inline-code ${className || ''}`} 
                  style={{
                    background: '#2d3748 !important',
                    color: '#e2e8f0 !important',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '3px',
                    fontSize: '0.9em',
                    fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
          },
          // Custom component for pre blocks
          pre: ({ children, ...props }: any) => (
              <pre 
                style={{
                  background: '#22577a !important',
                  color: '#c7f9cc !important',
                  padding: '1rem',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  margin: '1rem 0',
                  fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
                }}
                {...props}
              >
                {children}
              </pre>
          ),
          // Custom component for tables
          table: ({ children }: any) => (
            <div className="table-wrapper">
              <table className="markdown-table">{children}</table>
            </div>
          ),
          // Custom component for headings with anchor links
          h1: ({ children }: any) => {
            const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return <h1 id={id} className="heading-1" style={{ color: '#22577a' }}>{children}</h1>;
          },
          h2: ({ children }: any) => {
            const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return <h2 id={id} className="heading-2" style={{ color: '#22577a' }}>{children}</h2>;
          },
          h3: ({ children }: any) => {
            const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return <h3 id={id} className="heading-3" style={{ color: '#38a3a5' }}>{children}</h3>;
          },
          // Custom component for links
          a: ({ href, children }: any) => (
            <a 
              href={href} 
              className="markdown-link"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          // Custom component for blockquotes
          blockquote: ({ children }: any) => (
            <blockquote className="markdown-blockquote" style={{ color: '#22577a' }}>
              {children}
            </blockquote>
          ),
          // Custom component for paragraphs
          p: ({ children }: any) => (
            <p style={{ color: '#22577a', margin: '1rem 0', lineHeight: '1.7' }}>
              {children}
            </p>
          ),
          // Custom component for lists
          ul: ({ children }: any) => (
            <ul style={{ color: '#22577a' }}>
              {children}
            </ul>
          ),
          ol: ({ children }: any) => (
            <ol style={{ color: '#22577a' }}>
              {children}
            </ol>
          ),
          li: ({ children }: any) => (
            <li style={{ color: '#22577a', margin: '0.5rem 0', lineHeight: '1.6' }}>
              {children}
            </li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
