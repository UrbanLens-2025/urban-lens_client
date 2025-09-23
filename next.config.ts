import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**', 
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**', 
      },
      {
        protocol: 'https',
        hostname: 'pub-b91feee7907d49899f2cec9f22e90f69.r2.dev',
        port: '',
        pathname: '/**', 
      },
    ],
  },
};

export default nextConfig;
