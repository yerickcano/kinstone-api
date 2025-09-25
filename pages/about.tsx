import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function About() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Head>
        <title>About - Kinstone API</title>
        <meta name="description" content="About the Kinstone fusion mini-game backend API" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ 
        padding: '2rem', 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮 Kinstone Fusion API</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px' }}>
          A TypeScript + Next.js + Neon Database backend for the Kinstone fusion mini-game. 
          Features atomic fusion operations, inventory management, and comprehensive API documentation.
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '2rem', 
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>🚀 Features</h2>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <li>🚀 Serverless Architecture</li>
            <li>⚡ Fast API Routes</li>
            <li>🔒 Type-Safe TypeScript</li>
            <li>🎯 Atomic Transactions</li>
            <li>📚 Interactive Docs</li>
            <li>🐘 PostgreSQL Database</li>
          </ul>
        </div>

        <p style={{ fontSize: '1rem', opacity: '0.8' }}>
          Redirecting to API documentation in 3 seconds...
        </p>
        
        <button 
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            marginTop: '1rem'
          }}
        >
          View API Documentation Now →
        </button>
      </main>
    </>
  );
}
