import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import your schema components
import { activityTypeDefs } from '../src/services/activity/schema/index.js';
import { analyticsTypeDefs } from '../src/services/analytics/schema/index.js';

// Generate the merged schema
const mergedSchema = `#graphql
  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
  
  ${activityTypeDefs}
  ${analyticsTypeDefs}
`;

// Write to schema.graphql file
const schemaPath = path.join(__dirname, '..', 'schema.graphql');
fs.writeFileSync(schemaPath, mergedSchema);

console.log('✅ Schema generated successfully at:', schemaPath);
console.log('📝 You can now run: npm run validate-schema');
