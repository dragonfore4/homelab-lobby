import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ★ standalone = Node server จริง (SSR + Route Handler + Server Action)
  //   ไม่ใช่ static export → เรียก k8s API ตอน request ได้
  //   และ trace เฉพาะไฟล์ที่ import จริง → image ~40 MB แทน ~150 MB
  output: "standalone",
};

export default nextConfig;
