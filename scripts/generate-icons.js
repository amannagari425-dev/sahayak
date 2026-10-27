import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generateIconBuffer(size) {
  const width = size;
  const height = size;
  
  // Raw RGBA scanlines (height * (1 filter byte + width * 4 bytes RGBA))
  const rawScanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rawScanlineLength);
  
  const center = size / 2;
  const radius = (size / 2) - 1;
  const innerRadius = radius * 0.72;
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rawScanlineLength;
    rawData[rowOffset] = 0; // Filter byte 0 = None
    
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - center + 0.5;
      const dy = y - center + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= radius) {
        // Anti-aliased edge
        const edgeAlpha = dist > radius - 1 ? Math.max(0, Math.min(1, radius - dist)) : 1.0;
        
        if (dist <= innerRadius) {
          // Inner icon: Stylized 'S' or Hand/Shield glow
          // Brand colors: Indigo/Purple to Saffron/Amber gradient
          const gradient = y / height;
          const r = Math.round(245 * (1 - gradient) + 249 * gradient); // #F59E0B -> #FBBF24
          const g = Math.round(158 * (1 - gradient) + 115 * gradient);
          const b = Math.round(11 * (1 - gradient) + 22 * gradient);
          
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = Math.round(255 * edgeAlpha);
        } else {
          // Outer Ring: Modern Deep Blue / Indigo (#4F46E5)
          rawData[pixelOffset] = 79;
          rawData[pixelOffset + 1] = 70;
          rawData[pixelOffset + 2] = 229;
          rawData[pixelOffset + 3] = Math.round(255 * edgeAlpha);
        }
      } else {
        // Transparent background
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8 bits/channel
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression method: 0 (deflate)
  ihdrData[11] = 0; // Filter method: 0
  ihdrData[12] = 0; // Interlace method: 0 (no interlace)
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const assetsDir = path.resolve(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const iconBuffer = generateIconBuffer(size);
  const filePath = path.join(assetsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, iconBuffer);
  console.log(`Generated: ${filePath} (${iconBuffer.length} bytes)`);
});

