#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Packages to update
const PACKAGES = [
  'packages/backend/package.json',
  'packages/frontend/package.json',
  'packages/runtime/package.json',
  'packages/common/package.json',
  'packages/doc/package.json',
];

// Valid bump types
const VALID_BUMP_TYPES = ['major', 'minor', 'patch'];

/**
 * Parse semantic version string into components
 * @param {string} version - Version string (e.g., "0.1.0")
 * @returns {{major: number, minor: number, patch: number}}
 */
function parseVersion(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${version}. Expected format: major.minor.patch`);
  }
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };
}

/**
 * Bump version according to semver rules
 * @param {string} currentVersion - Current version string
 * @param {'major' | 'minor' | 'patch'} bumpType - Type of version bump
 * @returns {string} New version string
 */
function bumpVersion(currentVersion, bumpType) {
  const version = parseVersion(currentVersion);

  switch (bumpType) {
    case 'major':
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor += 1;
      version.patch = 0;
      break;
    case 'patch':
      version.patch += 1;
      break;
    default:
      throw new Error(`Invalid bump type: ${bumpType}`);
  }

  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Read and parse package.json file
 * @param {string} packagePath - Path to package.json
 * @returns {object} Parsed package.json
 */
function readPackageJson(packagePath) {
  const fullPath = path.join(process.cwd(), packagePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write package.json file with updated version
 * @param {string} packagePath - Path to package.json
 * @param {object} packageData - Package.json data
 */
function writePackageJson(packagePath, packageData) {
  const fullPath = path.join(process.cwd(), packagePath);
  const content = JSON.stringify(packageData, null, 2) + '\n';
  fs.writeFileSync(fullPath, content, 'utf-8');
}

/**
 * Main function
 */
function main() {
  const bumpType = process.argv[2];

  // Validate arguments
  if (!bumpType) {
    console.error('❌ Error: Bump type is required');
    console.error('');
    console.error('Usage: npm run bump-version <major|minor|patch>');
    console.error('');
    console.error('Examples:');
    console.error('  npm run bump-version patch   # 0.1.0 → 0.1.1');
    console.error('  npm run bump-version minor   # 0.1.0 → 0.2.0');
    console.error('  npm run bump-version major   # 0.1.0 → 1.0.0');
    process.exit(1);
  }

  if (!VALID_BUMP_TYPES.includes(bumpType)) {
    console.error(`❌ Error: Invalid bump type "${bumpType}"`);
    console.error(`Valid types: ${VALID_BUMP_TYPES.join(', ')}`);
    process.exit(1);
  }

  try {
    // Read current version from the first package
    const firstPackage = readPackageJson(PACKAGES[0]);
    const currentVersion = firstPackage.version;

    console.log('');
    console.log(`📦 Current version: ${currentVersion}`);

    // Verify all packages have the same version
    const versions = PACKAGES.map((pkg) => {
      const data = readPackageJson(pkg);
      return { package: pkg, version: data.version };
    });

    const mismatch = versions.find((v) => v.version !== currentVersion);
    if (mismatch) {
      console.error('');
      console.error('❌ Error: Package versions are not synchronized!');
      console.error('');
      versions.forEach((v) => {
        const status = v.version === currentVersion ? '✓' : '✗';
        console.error(`  ${status} ${v.package}: ${v.version}`);
      });
      console.error('');
      console.error('Please ensure all package versions match before bumping.');
      process.exit(1);
    }

    // Calculate new version
    const newVersion = bumpVersion(currentVersion, bumpType);

    console.log(`📦 New version:     ${newVersion}`);
    console.log('');
    console.log(`Bumping ${bumpType} version in ${PACKAGES.length} packages...`);
    console.log('');

    // Update all packages
    let updateCount = 0;
    for (const packagePath of PACKAGES) {
      const packageData = readPackageJson(packagePath);
      packageData.version = newVersion;
      writePackageJson(packagePath, packageData);
      console.log(`  ✓ ${packagePath}`);
      updateCount++;
    }

    console.log('');
    console.log(`✅ Successfully bumped ${updateCount} packages to version ${newVersion}`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review the changes: git diff');
    console.log('  2. Commit the changes: git add . && git commit -m "chore: bump version to ' + newVersion + '"');
    console.log('  3. Create a PR to main branch');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

main();
