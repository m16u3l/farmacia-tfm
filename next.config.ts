import "./envConfig";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lee sus archivos .afm de fuentes con una ruta relativa a su propio
  // paquete en tiempo de ejecución; si Next lo empaqueta/traza como el resto
  // del código, esa ruta deja de resolver (ENOENT). Se excluye para que se
  // cargue vía require() normal de node_modules en las rutas de API.
  serverExternalPackages: ["pdfkit"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
