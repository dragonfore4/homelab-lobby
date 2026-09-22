import * as k8s from "@kubernetes/client-node";

/** หนึ่ง tile บน dashboard */
export type Link = {
  name: string;        // ชื่อที่โชว์
  url: string;         // https://host/path
  namespace: string;
  host: string;
  tls: boolean;        // ★ มาจาก spec.tls หรือ annotation entrypoint
};

const HIDE = "dashboard.home/hidekub";        // = "true" → ไม่โชว์
const NAME = "dashboard.home/name";        // override ชื่อ
const ENTRYPOINTS = "traefik.ingress.kubernetes.io/router.entrypoints";

// ★ loadFromCluster() อ่าน token + CA ที่ kubelet mount ให้ทุก pod ที่
//   /var/run/secrets/kubernetes.io/serviceaccount/  และ env KUBERNETES_SERVICE_HOST
//   → ในเครื่องเราเองใช้ loadFromDefault() (~/.kube/config) แทน
const kc = new k8s.KubeConfig();
if (process.env.KUBERNETES_SERVICE_HOST) {
  kc.loadFromCluster();
} else {
  kc.loadFromDefault();
}

const net = kc.makeApiClient(k8s.NetworkingV1Api);

export async function listLinks(): Promise<Link[]> {
  // ⚠️ client-node เปลี่ยน shape ที่ v1.0:
  //    v0.x   → Promise<{ body: V1IngressList }>   ต้องใช้ res.body.items
  //    v1/v2  → Promise<V1IngressList>             ★ ใช้ res.items ตรง ๆ
  //    ตรวจแล้วกับ 2.0.0: PromiseAPI.d.ts:14024 คืน Promise<V1IngressList>
  //    เขียนรับทั้งสองแบบ เพื่อไม่พังถ้าย้อน version
  const res: any = await net.listIngressForAllNamespaces();
  // console.log("Res", res);
  const items: k8s.V1Ingress[] = res.items ?? res.body?.items ?? [];

  const links: Link[] = [];

  for (const ing of items) {
    const ann = ing.metadata?.annotations ?? {};
    if (ann[HIDE] === "true") continue;                 // ★ opt-out

    const ns = ing.metadata?.namespace ?? "default";
    const tlsHosts = new Set(
      (ing.spec?.tls ?? []).flatMap((t) => t.hosts ?? [])
    );

    // ★ บ้านเราไม่ใส่ spec.tls (ใช้ TLSStore default) → ต้องดู entrypoint
    //
    // ⚠️ กับดัก: "ไม่มี annotation" ≠ "ไม่มี TLS"
    //    ไม่ใส่ annotation  →  Traefik ลง router ที่ ★ ทุก entrypoint (web + websecure)
    //    ใส่ `websecure`    →  websecure เท่านั้น
    //    ใส่ `web`          →  ★ web เท่านั้น = เข้าผ่าน https ไม่ได้
    //    (longhorn-ing / grafana ing ไม่มี annotation แต่เข้าผ่าน https ได้จริง)
    const ep = ann[ENTRYPOINTS];
    const viaWebsecure = ep === undefined || ep === "" || ep.includes("websecure");

    for (const rule of ing.spec?.rules ?? []) {
      const host = rule.host;
      if (!host) continue;                              // ★ ไม่มี host = ไม่มี URL ให้กด

      for (const p of rule.http?.paths ?? []) {
        const path = p.path && p.path !== "/" ? p.path : "";
        const tls = tlsHosts.has(host) || viaWebsecure;
        links.push({
          name: ann[NAME] ?? ing.metadata?.name ?? host,
          url: `${tls ? "https" : "http"}://${host}${path}`,
          namespace: ns,
          host,
          tls,
        });
      }
    }
  }

  // ลบ URL ซ้ำ (Ingress หลายตัวชี้ host เดียวกันได้)
  const seen = new Set<string>();
  return links
    .filter((l) => (seen.has(l.url) ? false : seen.add(l.url)))
    .sort((a, b) => a.name.localeCompare(b.name));
}
