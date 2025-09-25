import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true;

// Get the database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for Neon Database');
}

// Create Neon SQL client for direct queries
const sql = neon(databaseUrl);

// Create Neon Pool for transactions (when needed)
const pool = new Pool({ connectionString: databaseUrl });

// Test connection on startup (only in development)
if (process.env.NODE_ENV === 'development') {
  sql`SELECT 1 as test`
    .then(() => console.log('✅ Neon Database connected successfully'))
    .catch((err) => console.error('❌ Neon Database connection failed:', err));
}

// Define types for compatibility with existing code
interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

interface PoolClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  release(): void;
}

/**
 * Execute a query with optional parameters using Neon's serverless SQL
 */
const query = async <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    // Use Neon's serverless SQL client
    const rows = await sql(text, params || []) as T[];
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { 
        text: text.substring(0, 100), 
        duration, 
        rows: rows.length 
      });
    }
    
    return {
      rows,
      rowCount: rows.length
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Query error', { text: text.substring(0, 100), error: errorMessage });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return {
    query: async <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
      const result = await client.query(text, params) as any;
      return {
        rows: result.rows || result,
        rowCount: result.rowCount || result.length
      };
    },
    release: () => client.release()
  };
};

/**
 * Execute multiple queries in a transaction using Neon Pool
 */
const transaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const wrappedClient: PoolClient = {
      query: async <U = any>(text: string, params?: any[]): Promise<QueryResult<U>> => {
        const result = await client.query(text, params);
        return {
          rows: result.rows || result,
          rowCount: result.rowCount || (result as any).length || 0
        };
      },
      release: () => client.release()
    };
    
    const result = await callback(wrappedClient);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Close all connections in the pool
 */
const close = async (): Promise<void> => {
  await pool.end();
};

export {
  query,
  getClient,
  transaction,
  close,
  pool,
  sql
};