import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root,
  },
  // Amplitude Agent Analytics — keep Node-native deps out of the bundler.
  serverExternalPackages: ["@amplitude/ai"],
  // Allow the Emergent preview host to load Next dev resources (fonts/HMR).
  allowedDevOrigins: [
    "rebalance-engine.cluster-8.preview.emergentcf.cloud",
    "*.preview.emergentcf.cloud",
    "*.preview.emergentagent.com",
  ],
};

export default nextConfig;
