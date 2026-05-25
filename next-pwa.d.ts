declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    [key: string]: any;
  }

  export default function withPWAInit(
    pwaConfig: PWAConfig,
  ): (nextConfig: NextConfig) => NextConfig;
}
