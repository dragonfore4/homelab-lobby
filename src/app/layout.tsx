import type { Metadata } from "next";
import "./globals.css";

// ★ ถอด next/font/google ออก — มันดาวน์โหลดฟอนต์ตอน build
//   → build พังหลัง corporate proxy / ในคลัสเตอร์ที่ไม่มีเน็ตออกนอก
//   เราใช้ system monospace stack ใน globals.css แทน ซึ่งเป็นภาษาของ subject อยู่แล้ว
export const metadata: Metadata = {
  title: "homelab · rack",
  description: "Services discovered from Kubernetes Ingress resources",
};

// ⚠️ ★ ไม่ใส่ class `antialiased` ของ Tailwind บน <html>
//    มันคือ -webkit-font-smoothing: antialiased → ทำให้เส้นอักษร "บางลง" บน macOS
//    พื้นมืด + อักษรสว่าง เส้นบางอยู่แล้วโดยธรรมชาติ (halation) → ใส่แล้วยิ่งอ่านยาก
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
