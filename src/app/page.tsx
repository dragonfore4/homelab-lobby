import { listLinks, type Link } from "@/lib/ingresses";

// ★ Server Component — โค้ดนี้รันบน server เท่านั้น
//   browser ไม่เคยเห็น token ไม่เคยเห็น API ของคลัสเตอร์
//
// ⚠️ ห้ามใช้ `revalidate` ที่นี่ — มันทำให้ Next prerender ตอน build
//    → `docker build` จะพยายามเรียก k8s API ตอน build (ไม่มีคลัสเตอร์)
//    → หน้า error ถูก bake ลง image
//
// ★ force-dynamic = render ทุก request จาก server จริง
//   ตรวจสอบ: `npm run build` ต้องขึ้น  ƒ (Dynamic)  ไม่ใช่  ○ (Static)
//
// 📌 Next 16: ถ้าเปิดแฟล็ก `cacheComponents` แล้ว ทุกหน้าจะ dynamic เป็น default
//    → บรรทัดนี้ "ไม่จำเป็น" (docs: migrating-to-cache-components.md §dynamic)
//    แต่โปรเจกต์นี้ยังไม่เปิด → ยังต้องใส่
export const dynamic = "force-dynamic";

export default async function Page() {
  let links: Link[] = [];
  let err: string | null = null;

  try {
    links = await listLinks();
  } catch (e: unknown) {
    // ★ 403 = RBAC ยังไม่ให้สิทธิ์ → โชว์ตรง ๆ ไม่ซ่อนเป็นลิสต์ว่าง
    const m = e as { body?: { message?: string }; message?: string };
    err = m?.body?.message ?? m?.message ?? String(e);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10 sm:py-24">
      {/* ── หัวเรื่อง: serif คู่กับเลขนับแบบ mono ── */}
      <header className="flex items-baseline justify-between border-b border-hair pb-4">
        <h1 className="font-display text-2xl text-ink">Services</h1>
        <span className="font-meta text-xs tabular-nums text-ink-soft">
          {links.length}
        </span>
      </header>

      {err && (
        <p className="mt-6 border-l-2 border-moss pl-4 text-xs leading-relaxed text-ink-soft">
          <span className="mb-1 block font-meta uppercase tracking-[0.18em] text-moss">
            cannot list ingresses
          </span>
          {err}
        </p>
      )}

      {/* ★ ไม่มีกรอบ ไม่มีการ์ด — มีแค่ช่องไฟกับเส้นบาง */}
      <ul className="mt-2">
        {links.map((l, i) => (
          <li key={l.url}>
            {i > 0 && <div aria-hidden className="hairline-dotted" />}
            <Row link={l} />
          </li>
        ))}
      </ul>

      {!links.length && !err && (
        <p className="mt-10 text-xs text-ink-faint">No ingress found.</p>
      )}

      <p className="mt-16 font-meta text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        discovered from kubernetes ingress
      </p>
    </main>
  );
}

function Row({ link }: { link: Link }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="group block py-5 no-underline outline-none
                 focus-visible:bg-moss/[0.08]"
    >
      <span className="flex items-baseline justify-between gap-4">
        {/* ★ ชื่อ = พระเอก · serif · hover เปลี่ยนเป็นสี moss */}
        {/* ★ 22px + tracking ปกติ — serif เส้นบางบนพื้นมืดต้องตัวใหญ่กว่าปกติ
            (tracking ติดลบทำให้เส้นชนกัน อ่านยากขึ้นบนพื้นมืด) */}
        <span
          className="font-display text-[22px] leading-snug text-ink
                     transition-colors duration-200
                     group-hover:text-moss group-focus-visible:text-moss
                     motion-reduce:transition-none"
        >
          {link.name}
        </span>

        {/* ★ ↑ จาก text-ink-faint · เส้นหนาขึ้น 1.3 → 1.6 — icon เส้นบางจมพื้นมืด */}
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="mt-1.5 size-4 shrink-0 text-ink-soft transition-all duration-200
                     group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-moss
                     motion-reduce:transition-none"
        >
          <path
            d="M5 11 11 5M11 5H6.5M11 5v4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {/* ★ underline กวาดเข้าจากซ้าย — อยู่ที่ host ไม่ใช่ที่ชื่อ
            เพราะ host คือสิ่งที่จะถูกเปิด */}
        {/* ★ 12px (จาก 11) · underline moss/70 (จาก /40 ซึ่งจมพื้นมืด) */}
        <span className="relative font-meta text-xs text-ink-soft">
          {link.host}
          <span
            aria-hidden
            className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0
                       bg-moss/70 transition-transform duration-200 ease-out
                       group-hover:scale-x-100 group-focus-visible:scale-x-100
                       motion-reduce:transition-none"
          />
        </span>

        {/* ★ 11px (จาก 10) · tracking 0.1em (จาก 0.14 — กว้างเกินตอนตัวเล็กยิ่งอ่านยาก) */}
        <span className="font-meta text-[11px] uppercase tracking-[0.1em] text-ink-faint">
          {link.namespace}
        </span>

        {/* ★ เตือนเฉพาะตอนผิดจริง — ไม่ใช่ไฟสถานะที่ติดตลอด */}
        {!link.tls && (
          <span className="font-meta text-[11px] uppercase tracking-[0.1em] text-moss">
            http only
          </span>
        )}
      </span>
    </a>
  );
}
