import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Los shaders GLSL se importan como strings crudos.
  turbopack: {
    rules: {
      "*.glsl": { loaders: ["raw-loader"], as: "*.js" },
    },
  },

  // three y sus satélites son ESM pesados: dejamos que Next los optimice.
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei", "motion"],
  },
};

export default nextConfig;
