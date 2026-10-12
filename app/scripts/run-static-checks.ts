import fs from 'node:fs';
import path from 'node:path';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition: boolean, checkName: string, details?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  PASS: ${checkName}`);
  } else {
    failedChecks++;
    console.error(`  FAIL: ${checkName} - ${details || 'Check failed'}`);
  }
}

console.log('\n--- 5. STATIC COMPLIANCE CHECKS ---');

const srcDir = path.resolve('src');
const appDir = path.resolve('app');

function getAllFiles(dir: string, ext = ['.ts', '.tsx']): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.expo') {
        files = files.concat(getAllFiles(fullPath, ext));
      }
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allSourceFiles = [...getAllFiles(srcDir), ...getAllFiles(appDir)];

// 1. Emoji Detection Regex
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

let emojiViolations: string[] = [];
for (const file of allSourceFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  if (emojiRegex.test(content)) {
    emojiViolations.push(path.relative(process.cwd(), file));
  }
}
assert(
  emojiViolations.length === 0,
  'Zero emojis present in any UI, copy, or source files',
  `Found in: ${emojiViolations.join(', ')}`
);

// 2. Purple / Violet Hex Detection
const purpleHexRegex = /#(?:800080|8a2be2|9932cc|9400d3|4b0082|6a0dad|7b1fa2|8e24aa|9c27b0|ba68c8|ab47bc|6200ee|7c4dff|651fff|bb86fc)/i;
let purpleViolations: string[] = [];
for (const file of allSourceFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  if (purpleHexRegex.test(content)) {
    purpleViolations.push(path.relative(process.cwd(), file));
  }
}
assert(
  purpleViolations.length === 0,
  'Zero purple or violet colors in codebase',
  `Found in: ${purpleViolations.join(', ')}`
);

// 3. Hardcoded Hex Colors Outside tokens.ts
// Tokens file, custom map style arrays, and test files are permitted.
const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
let hardcodedHexViolations: { file: string; hex: string }[] = [];

for (const file of allSourceFiles) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  // Allowed token declarations:
  if (
    rel.includes('tokens.ts') ||
    rel.includes('ThemeContext.tsx') ||
    rel.includes('NIGHTWATCH_DARK_MAP_STYLE') ||
    rel.includes('gallery.tsx')
  ) {
    continue;
  }

  const content = fs.readFileSync(file, 'utf-8');
  const matches = content.match(hexColorRegex);
  if (matches) {
    for (const m of matches) {
      hardcodedHexViolations.push({ file: rel, hex: m });
    }
  }
}

assert(
  hardcodedHexViolations.length === 0,
  'Zero hardcoded hex values outside tokens.ts / ThemeContext',
  `Found violations: ${hardcodedHexViolations.map((v) => `${v.file} (${v.hex})`).join(', ')}`
);

// 4. Leaked Secrets and API Keys
const secretPatterns = [
  /AIza[0-9A-Za-z-_]{35}/, // Google API Key pattern
  /ghp_[0-9A-Za-z]{36}/, // GitHub personal access token
  /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/, // JWT
];

let secretViolations: string[] = [];
for (const file of allSourceFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      secretViolations.push(path.relative(process.cwd(), file));
    }
  }
}

assert(
  secretViolations.length === 0,
  'Zero leaked API keys or credentials in source code',
  `Found in: ${secretViolations.join(', ')}`
);

console.log('\n=======================================');
console.log(`STATIC CHECKS SUMMARY: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`);
console.log('=======================================\n');

if (failedChecks > 0) {
  process.exit(1);
}
