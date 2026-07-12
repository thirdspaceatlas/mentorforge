/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: ".",
  },
  // Allow the Emergent preview host to load Next dev resources (fonts/HMR).
  allowedDevOrigins: [
    "rebalance-engine.cluster-8.preview.emergentcf.cloud",
    "*.preview.emergentcf.cloud",
    "*.preview.emergentagent.com",
  ],
};

export default nextConfig;
