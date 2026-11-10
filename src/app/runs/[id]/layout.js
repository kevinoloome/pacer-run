// Server-side layout: gives each shared run link a proper WhatsApp/Facebook preview
// ("Join me for a run at Karura Forest..."). Falls back to the general TwendeRun
// preview if the run can't be read.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const fallback = {
    title: "Join a run on TwendeRun",
    description: "Find runners to run with in Kenya. Swipe, join, and run together.",
  };
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || !/^\d+$/.test(id)) return fallback;
    const res = await fetch(
      `${url}/rest/v1/runs?id=eq.${id}&select=location,city,when_text,distance_km,host_name&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) return fallback;
    const [run] = await res.json();
    if (!run) return fallback;
    const title = `Join me for a run at ${run.location}`;
    const description = [run.when_text, run.distance_km ? `${run.distance_km} km` : null, run.city, `Hosted by ${run.host_name}`]
      .filter(Boolean)
      .join(" · ");
    return {
      title,
      description,
      openGraph: { title, description, siteName: "TwendeRun", images: ["/og.png"] },
      twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
    };
  } catch {
    return fallback;
  }
}

export default function RunLayout({ children }) {
  return children;
}
