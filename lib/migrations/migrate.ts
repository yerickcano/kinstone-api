import fs from 'fs';
import path from 'path';
import { query, close } from '../database/connection';

async function runMigrations(): Promise<void> {
  try {
    console.log('Starting database migration...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
          console.log('✓ Executed statement successfully');
        } catch (error: any) {
          // Some statements might fail if they already exist (like CREATE EXTENSION)
          if (!error.message.includes('already exists')) {
            console.error('✗ Error executing statement:', error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          } else {
            console.log('✓ Statement already exists, skipping');
          }
        }
      }
    }
    
    console.log('✅ Database migration completed successfully');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await close();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

export { runMigrations };
