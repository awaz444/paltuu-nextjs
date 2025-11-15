const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/primary_icon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');

  // Read SVG file
  let svgBuffer;
  try {
    svgBuffer = fs.readFileSync(inputSvg);
  } catch (error) {
    console.error('❌ Error: Could not find primary_icon.svg');
    console.log('Please make sure primary_icon.svg exists in the public folder');
    process.exit(1);
  }

  // Generate icons for each size
  for (const size of sizes) {
    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));

      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size} icon:`, error.message);
    }
  }

  // Generate apple-touch-icon (180x180)
  try {
    await sharp(svgBuffer)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));

    console.log('✓ Generated apple-touch-icon.png');
  } catch (error) {
    console.error('❌ Error generating apple-touch-icon:', error.message);
  }

  console.log('✅ All PWA icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open your app in a browser');
  console.log('3. Look for the "Install" prompt or use browser menu to install');
}

generateIcons().catch(console.error);
