import type { NextConfig } from "next";

// Served at its own subdomain (organizador.gdoisfilmes.com.br), not a
// subpath of the G2 site — G2 is published directly by Lovable, which
// doesn't support proxying a subpath to a separate app, so basePath stays
// empty by default. Left configurable via NEXT_PUBLIC_BASE_PATH in case a
// subpath deploy behind a proxy (e.g. Cloudflare) is ever worth revisiting
// — see the "Integração com o painel admin da G2" section in README.md.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath,
  // Next.js auto-prefixes basePath for next/link and next/navigation, but
  // NOT for raw fetch() calls (e.g. the command palette hitting
  // /api/search). Exposing it here lets client code prefix those manually
  // — see src/lib/base-path.ts. A no-op while basePath is "".
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
