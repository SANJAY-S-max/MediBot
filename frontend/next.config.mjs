/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.FASTAPI_BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/facilities/:path*",
        destination: `${backendUrl}/api/facilities/:path*`,
      },
      {
        source: "/api/triage",
        destination: `${backendUrl}/api/triage`,
      },
    ];
  },
};

export default nextConfig;
