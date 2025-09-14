/** @type {import("next").NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // biarkan yang ini kalau memang mau /dashboard diarahkan ke /projects
      { source: "/dashboard", destination: "/projects", permanent: false },

      // HAPUS redirect root -> /projects (ini yang bikin masalah)
      // { source: "/", destination: "/projects", permanent: false },
    ];
  },
};

export default nextConfig;
