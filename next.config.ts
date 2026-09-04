import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Un package-lock.json parasite existe dans un dossier parent hors du
  // projet ; on fixe explicitement la racine pour éviter que Next.js ne la
  // détecte comme workspace root.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
