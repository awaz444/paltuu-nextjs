#!/usr/bin/env node

/**
 * PWA Test Helper
 * Run this script to check if your PWA setup is correct
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const requiredFiles = {
  'manifest.json': 'Web App Manifest',
  'sw.js': 'Service Worker',
  'icon-192x192.png': 'Icon 192x192',
  'icon-512x512.png': 'Icon 512x512',
};

const optionalFiles = {
  'icon-72x72.png': 'Icon 72x72',
  'icon-96x96.png': 'Icon 96x96',
  'icon-128x128.png': 'Icon 128x128',
  'icon-144x144.png': 'Icon 144x144',
  'icon-152x152.png': 'Icon 152x152',
  'icon-384x384.png': 'Icon 384x384',
  'apple-touch-icon.png': 'Apple Touch Icon',
};

console.log('🔍 Checking PWA setup...\n');

let allGood = true;

// Check required files
console.log('📋 Required Files:');
Object.entries(requiredFiles).forEach(([file, desc]) => {
  const filePath = path.join(publicDir, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${desc} (${file})`);
  if (!exists) allGood = false;
});

console.log('\n📋 Optional Files:');
Object.entries(optionalFiles).forEach(([file, desc]) => {
  const filePath = path.join(publicDir, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '⚠️'} ${desc} (${file})`);
});

// Check manifest.json content
console.log('\n📱 Manifest Configuration:');
try {
  const manifestPath = path.join(publicDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log(`✅ Name: ${manifest.name || manifest.short_name}`);
  console.log(`✅ Display: ${manifest.display}`);
  console.log(`✅ Theme Color: ${manifest.theme_color}`);
  console.log(`✅ Icons: ${manifest.icons?.length || 0} configured`);

  if (manifest.icons?.length < 2) {
    console.log('⚠️  Warning: At least 2 icons (192x192 and 512x512) recommended');
  }
} catch (error) {
  console.log('❌ Error reading manifest.json:', error.message);
  allGood = false;
}

// Check service worker
console.log('\n🔧 Service Worker:');
try {
  const swPath = path.join(publicDir, 'sw.js');
  const swContent = fs.readFileSync(swPath, 'utf8');

  const hasInstall = swContent.includes('install');
  const hasActivate = swContent.includes('activate');
  const hasFetch = swContent.includes('fetch');

  console.log(`${hasInstall ? '✅' : '❌'} Install event handler`);
  console.log(`${hasActivate ? '✅' : '❌'} Activate event handler`);
  console.log(`${hasFetch ? '✅' : '❌'} Fetch event handler`);

  if (!hasInstall || !hasActivate || !hasFetch) allGood = false;
} catch (error) {
  console.log('❌ Error reading sw.js:', error.message);
  allGood = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ PWA setup looks good!');
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open http://localhost:3000');
  console.log('3. Check DevTools → Application → Manifest');
  console.log('4. Check DevTools → Application → Service Workers');
  console.log('5. Deploy to production for full PWA features');
} else {
  console.log('❌ Some issues found. Please fix them and try again.');
  console.log('\n💡 Try running: npm run generate-icons');
}
console.log('='.repeat(50) + '\n');
