import Home from "@/views/Home";

export default async function Page() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const api = `${BACKEND_URL}/api`;

  let initialData = null;
  try {
    const [s, c, nw, flash, best, feat, settings, cms] = await Promise.all([
      fetch(`${api}/hero-slides`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${api}/categories`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${api}/products?flag=new&limit=8`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${api}/products?flag=flash&limit=8`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${api}/products?flag=best&limit=4`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${api}/products?flag=featured&limit=8`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${api}/settings`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${api}/admin/cms/homepage-sections`, { next: { revalidate: 60 } }).then(r => r.ok ? r.json() : { data: [] })
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
  } catch (err) {
    console.error("SSR Fetch Error:", err.message);
  }

  return <Home initialData={initialData} />;
}