import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    const esmPath = path.resolve(__dirname, '../../node_modules/@clerk/nextjs/dist/esm/app-router/server-actions.js');
    const cjsPath = path.resolve(__dirname, '../../node_modules/@clerk/nextjs/dist/cjs/app-router/server-actions.js');
    
    config.resolve.alias[esmPath] = false;
    config.resolve.alias[cjsPath] = false;
    
    return config;
  }
};

export default nextConfig;
