/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Habilitar Pages Router para las APIs
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Configuración para producción
  poweredByHeader: false,
}

module.exports = nextConfig
