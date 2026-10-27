import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const zipOutput = path.resolve(rootDir, 'sahayak-extension-v1.0.0.zip');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

try {
  if (fs.existsSync(zipOutput)) {
    fs.unlinkSync(zipOutput);
  }
  
  // Use .NET ZipFile to avoid PowerShell Write-Progress console buffer issues in non-interactive sessions
  const escapedDist = distDir.replace(/'/g, "''");
  const escapedZip = zipOutput.replace(/'/g, "''");
  const cmd = `powershell -NoProfile -Command "Add-Type -AssemblyName 'System.IO.Compression.FileSystem'; [System.IO.Compression.ZipFile]::CreateFromDirectory('${escapedDist}', '${escapedZip}')"`;
  
  execSync(cmd, { stdio: 'inherit' });
  
  const stats = fs.statSync(zipOutput);
  console.log(`Successfully created release package: ${zipOutput} (${(stats.size / 1024).toFixed(1)} KB)`);
} catch (error) {
  console.error('Failed to create zip package:', error.message);
  process.exit(1);
}
