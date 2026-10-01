import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // There's an unrelated package.json/lockfile in the home directory
    // (outside this repo) that Turbopack's upward lookup otherwise finds,
    // producing a harmless but noisy warning. Pin the root explicitly.
    root: path.join(__dirname),
  },
};

export default nextConfig;
