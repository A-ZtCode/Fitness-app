import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSchema, validate } from 'graphql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'schema.graphql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

try {
  // Build the schema to validate it
  const schema = buildSchema(schemaContent);
  console.log('✅ Schema is valid!');
  console.log('📝 Schema contains:');
  console.log(`   - Types: ${Object.keys(schema.getTypeMap()).length}`);
  console.log(`   - Queries: ${schema.getQueryType() ? Object.keys(schema.getQueryType().getFields()).length : 0}`);
  console.log(`   - Mutations: ${schema.getMutationType() ? Object.keys(schema.getMutationType().getFields()).length : 0}`);
} catch (error) {
  console.error('❌ Schema validation failed:');
  console.error(error.message);
  process.exit(1);
}
