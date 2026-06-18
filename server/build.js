// build.js - Simple copy script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');
const destDir = path.join(__dirname, 'dist');

// Create dist directory
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all .ts files to .js
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.name.endsWith('.ts')) {
      const destFile = destPath.replace(/\.ts$/, '.js');
      fs.copyFileSync(srcPath, destFile);
      console.log(Copied:  -> );
    }
  }
}

copyDir(srcDir, destDir);
console.log('Build complete!');
