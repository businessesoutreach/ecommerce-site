import Home from "@/views/Home";

export default async function Page() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const api = `${BACKEND_URL}/api`;

  let initialData = null;
  try {
    const res = await fetch(`${api}/homepage`, { next: { revalidate: 10 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        initialData = json.data;
      }
    }
  } catch (err) {
    console.error("SSR Fetch Error (/api/homepage):", err.message);
  }

  // Fallback in case of any network glitch
  if (!initialData) {
    try {
      const [s, c, nw, flash, best, feat, settings, cms] = await Promise.all([
        fetch(`${api}/hero-slides`, { next: { revalidate: 10 } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${api}/categories`, { next: { revalidate: 10 } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${api}/products?flag=new&limit=16`, { next: { revalidate: 10 } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${api}/products?flag=flash&limit=16`, { next: { revalidate: 10 } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${api}/products?flag=best&limit=16`, { next: { revalidate: 10 } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${api}/products?flag=featured&limit=16`, { next: { revalidate: 10 } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${api}/settings`, { next: { revalidate: 10 } }).then(r => r.json()).catch(() => ({ data: {} })),
        fetch(`${api}/admin/cms/homepage-sections`, { next: { revalidate: 10 } }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] }))
      ]);

      initialData = {
        slides: s?.data || [],
        cats: c?.data || [],
        data: {
          nw: nw?.data || [],
          flash: flash?.data || [],
          best: best?.data || [],
          feat: feat?.data || [],
          settings: settings?.data || {}
        },
        layout: (cms?.data || []).sort((a, b) => a.sort_order - b.sort_order)
      };
    } catch (e) {
      console.error("Fallback Fetch Error:", e.message);
    }
  }

  return <Home initialData={initialData} />;
}