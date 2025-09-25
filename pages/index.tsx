import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Kinstone Fusion API</title>
        <meta name="description" content="Kinstone fusion mini-game backend API" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>🎮 Kinstone Fusion API</h1>
        <p>TypeScript + Next.js + Neon Database backend for Kinstone fusion mini-game</p>
        
        <h2>API Endpoints</h2>
        <ul>
          <li><code>GET /api/v1/users</code> - List users</li>
          <li><code>POST /api/v1/users</code> - Create user</li>
          <li><code>GET /api/v1/pieces</code> - List pieces</li>
          <li><code>GET /api/v1/inventory/:userId</code> - Get user inventory</li>
          <li><code>POST /api/v1/fusions</code> - Attempt fusion</li>
          <li><code>GET /api/v1/rewards/:userId</code> - Get user rewards</li>
        </ul>

        <h2>Database Setup</h2>
        <p>1. Create a <a href="https://console.neon.tech/" target="_blank" rel="noopener noreferrer">Neon Database</a> (free tier available)</p>
        <p>2. Copy your connection string to <code>.env</code></p>
        <p>3. Run these commands:</p>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
          {`yarn migrate  # Create database schema
yarn seed     # Add test data
yarn setup    # Run both migrate and seed`}
        </pre>
        
        <h2>Features</h2>
        <ul>
          <li>🚀 <strong>Serverless</strong> - Neon Database with connection pooling</li>
          <li>⚡ <strong>Fast</strong> - Optimized for Next.js API routes</li>
          <li>🔒 <strong>Type Safe</strong> - Full TypeScript coverage</li>
          <li>🎯 <strong>Atomic</strong> - Transactional fusion operations</li>
        </ul>
      </main>
    </>
  );
}
