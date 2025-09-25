import React, { useState } from 'react';
import Head from 'next/head';
import HealthDocs from '../components/docs/HealthDocs';
import UsersDocs from '../components/docs/UsersDocs';
import PiecesDocs from '../components/docs/PiecesDocs';
import InventoryDocs from '../components/docs/InventoryDocs';
import FusionsDocs from '../components/docs/FusionsDocs';

type DocSection = 'health' | 'users' | 'pieces' | 'inventory' | 'fusions';

export default function Home() {
  const [activeSection, setActiveSection] = useState<DocSection>('health');

  const sections = [
    { id: 'health' as DocSection, title: 'Health Check', icon: '🏥' },
    { id: 'users' as DocSection, title: 'Users', icon: '👥' },
    { id: 'pieces' as DocSection, title: 'Pieces', icon: '💎' },
    { id: 'inventory' as DocSection, title: 'Inventory', icon: '🎒' },
    { id: 'fusions' as DocSection, title: 'Fusions', icon: '⚡' },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'health':
        return <HealthDocs />;
      case 'users':
        return <UsersDocs />;
      case 'pieces':
        return <PiecesDocs />;
      case 'inventory':
        return <InventoryDocs />;
      case 'fusions':
        return <FusionsDocs />;
      default:
        return <HealthDocs />;
    }
  };

  return (
    <>
      <Head>
        <title>Kinstone API Documentation</title>
        <meta name="description" content="Complete API documentation for the Kinstone fusion mini-game backend" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="docs-page">
        <div className="docs-sidebar">
          <div className="sidebar-header">
            <h2>🎮 Kinstone API</h2>
            <p>Interactive Documentation</p>
          </div>
          
          <nav className="sidebar-nav">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="nav-icon">{section.icon}</span>
                <span className="nav-title">{section.title}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="tech-stack">
              <h4>Tech Stack</h4>
              <ul>
                <li>🚀 Next.js + TypeScript</li>
                <li>🐘 Neon PostgreSQL</li>
                <li>⚡ Serverless Architecture</li>
                <li>🔒 Type-Safe APIs</li>
              </ul>
            </div>
          </div>
        </div>

        <main className="docs-content">
          {renderActiveSection()}
        </main>
      </div>

      <style jsx>{`
        .docs-page {
          display: flex;
          min-height: 100vh;
          background: #80ed99;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        }

        .docs-sidebar {
          width: 280px;
          background: #57cc99;
          border-right: 1px solid #38a3a5;
          padding: 2rem 0;
          position: fixed;
          height: 100vh;
          overflow-y: auto;
        }

        .sidebar-header {
          padding: 0 2rem 2rem 2rem;
          border-bottom: 1px solid #38a3a5;
          margin-bottom: 1rem;
        }

        .sidebar-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: #22577a;
        }

        .sidebar-header p {
          margin: 0;
          color: #22577a;
          font-size: 0.9rem;
        }

        .sidebar-nav {
          padding: 0 1rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.75rem 1rem;
          margin: 0.25rem 0;
          border: none;
          background: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          font-size: 0.95rem;
        }

        .nav-item:hover {
          background: #80ed99;
        }

        .nav-item.active {
          background: #38a3a5;
          color: #c7f9cc;
        }

        .nav-icon {
          margin-right: 0.75rem;
          font-size: 1.1rem;
        }

        .nav-title {
          font-weight: 500;
        }

        .docs-content {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          max-width: calc(100vw - 280px);
          overflow-x: hidden;
          background: #c7f9cc;
          border-radius: 8px;
          margin: 1rem;
          margin-left: 300px;
          box-shadow: 0 1px 3px rgba(34, 87, 122, 0.2);
        }

        .sidebar-footer {
          padding: 2rem;
          border-top: 1px solid #38a3a5;
          margin-top: 2rem;
        }

        .tech-stack h4 {
          margin: 0 0 1rem 0;
          color: #22577a;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .tech-stack ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .tech-stack li {
          padding: 0.25rem 0;
          font-size: 0.8rem;
          color: #22577a;
        }

        @media (max-width: 768px) {
          .docs-sidebar {
            position: relative;
            width: 100%;
            height: auto;
          }

          .docs-content {
            margin-left: 0;
            max-width: 100%;
            padding: 1rem;
          }

          .docs-page {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
