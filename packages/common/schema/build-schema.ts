/**
 * GraphQL Schema Build Script
 *
 * Concatenates domain-split schema files into single output files
 * for Dgraph and Apollo consumption.
 *
 * Features:
 * - Processes #DGRAPH_ONLY and #APOLLO_ONLY markers
 * - Handles scalar differences (DateTime vs Date)
 * - Strips Dgraph directives for Apollo output
 * - Validates output with graphql-js parser
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'graphql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMA_DIR = __dirname;
const BUILD_DIR = join(SCHEMA_DIR, 'build');

type SchemaTarget = 'dgraph' | 'apollo';

interface BuildConfig {
  target: SchemaTarget;
  outputFile: string;
  scalarName: string;
  stripDirectives: boolean;
  transformDateTime: boolean;
}

const CONFIGS: BuildConfig[] = [
  {
    target: 'dgraph',
    outputFile: 'dgraph.schema.graphql',
    scalarName: 'DateTime',
    stripDirectives: false,
    transformDateTime: false,
  },
  {
    target: 'apollo',
    outputFile: 'apollo.schema.graphql',
    scalarName: 'Date',
    stripDirectives: true,
    transformDateTime: true,
  },
];

// Markers for conditional content
const DGRAPH_ONLY_START = '#DGRAPH_ONLY_START';
const DGRAPH_ONLY_END = '#DGRAPH_ONLY_END';
const APOLLO_ONLY_START = '#APOLLO_ONLY_START';
const APOLLO_ONLY_END = '#APOLLO_ONLY_END';

function processConditionalContent(content: string, target: SchemaTarget): string {
  let result = content;

  if (target === 'apollo') {
    // Remove Dgraph-only blocks
    result = result.replace(new RegExp(`${DGRAPH_ONLY_START}[\\s\\S]*?${DGRAPH_ONLY_END}`, 'g'), '');
    // Keep Apollo-only content (remove markers)
    result = result.replace(new RegExp(APOLLO_ONLY_START, 'g'), '');
    result = result.replace(new RegExp(APOLLO_ONLY_END, 'g'), '');
  } else {
    // Remove Apollo-only blocks
    result = result.replace(new RegExp(`${APOLLO_ONLY_START}[\\s\\S]*?${APOLLO_ONLY_END}`, 'g'), '');
    // Keep Dgraph-only content (remove markers)
    result = result.replace(new RegExp(DGRAPH_ONLY_START, 'g'), '');
    result = result.replace(new RegExp(DGRAPH_ONLY_END, 'g'), '');
  }

  return result;
}

function stripDgraphDirectives(content: string): string {
  // Remove @withSubscription, @hasInverse, @search, @id directives
  return content
    .replace(/@withSubscription\s*/g, '')
    .replace(/@hasInverse\(field:\s*\w+\)\s*/g, '')
    .replace(/@search(\(by:\s*\[[^\]]*\]\))?\s*/g, '')
    .replace(/@id\s*/g, '');
}

function transformDateTimeToDate(content: string): string {
  // Transform DateTime to Date in field type declarations
  // Match patterns like: fieldName: DateTime!, fieldName: DateTime, [DateTime!], [DateTime]
  return content.replace(/:\s*DateTime(!)?/g, ': Date$1').replace(/\[DateTime(!)?]/g, '[Date$1]');
}

function collectFiles(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    if (!existsSync(currentDir)) return;

    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files.sort();
}

function buildSchema(config: BuildConfig): string {
  const parts: string[] = [];

  // 1. Add scalar
  parts.push(`scalar ${config.scalarName}`);

  // 2. Read enums.graphql
  const enumsFile = join(SCHEMA_DIR, 'enums.graphql');
  if (existsSync(enumsFile)) {
    let content = readFileSync(enumsFile, 'utf-8');
    content = processConditionalContent(content, config.target);
    if (content.trim()) {
      parts.push(content.trim());
    }
  }

  // 3. Read all domain/*.graphql files
  const domainDir = join(SCHEMA_DIR, 'domain');
  if (existsSync(domainDir)) {
    const domainFiles = readdirSync(domainDir)
      .filter((f) => f.endsWith('.graphql'))
      .sort();

    for (const file of domainFiles) {
      let content = readFileSync(join(domainDir, file), 'utf-8');
      content = processConditionalContent(content, config.target);
      if (config.stripDirectives) {
        content = stripDgraphDirectives(content);
      }
      if (config.transformDateTime) {
        content = transformDateTimeToDate(content);
      }
      if (content.trim()) {
        parts.push(content.trim());
      }
    }
  }

  return parts.join('\n\n');
}

function validateSchema(schema: string, target: SchemaTarget): void {
  try {
    parse(schema);
    console.log(`  [OK] ${target} schema is valid GraphQL`);
  } catch (error) {
    console.error(`  [ERROR] ${target} schema validation failed:`);
    throw error;
  }
}

function main() {
  console.log('Building GraphQL schemas...\n');

  // Ensure build directory exists
  if (!existsSync(BUILD_DIR)) {
    mkdirSync(BUILD_DIR, { recursive: true });
  }

  for (const config of CONFIGS) {
    console.log(`Building ${config.target} schema...`);

    const schema = buildSchema(config);
    const outputPath = join(BUILD_DIR, config.outputFile);

    validateSchema(schema, config.target);
    writeFileSync(outputPath, schema);

    const lines = schema.split('\n').length;
    console.log(`  Written to: ${basename(outputPath)}`);
    console.log(`  Lines: ${lines}\n`);
  }

  console.log('Schema build complete!');
}

main();
