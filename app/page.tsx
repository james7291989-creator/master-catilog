import { createClient } from '@supabase/supabase-js';
import CatalogPlayer from '@/components/CatalogPlayer';

// Initialize Secure Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 0; // Bypass Next.js cache to ensure real-time catalog syncing

export default async function RodneyUltimateCatalog() {
  const { data: tracks, error } = await supabase
    .from('tracks')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error("Database Fetch Exception:", error.message);
    return <div className="text-red-500 font-bold p-8">FATAL: DATABASE CONNECTION REFUSED.</div>;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-slate-100 p-8 md:p-16 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* EXECUTIVE HEADER ARCHITECTURE */}
        <header className="border-b border-slate-800 pb-8 mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">
            JAMES RODNEY ARMS JR.
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-4 text-sm font-medium tracking-widest text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              BMI WRITER IPI: 551288873
            </span>
            <span className="hidden md:inline">|</span>
            <span>ADMIN: RODNEY AND SONS FOUNDATION LLC</span>
            <span className="hidden md:inline">|</span>
            <span className="text-emerald-400 border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 rounded">
              100% ONE-STOP CLEARANCE
            </span>
          </div>
          <p className="mt-6 text-slate-400 leading-relaxed max-w-3xl">
            Official B2B sync licensing vault. All master recordings and underlying compositions are fully cleared for immediate institutional broadcast, television, and film synchronization. Track stems available upon verified request.
          </p>
        </header>

        {/* AUDIO PLAYER INJECTION - PATCHED TO TARGET vault-audio BUCKET */}
        <section className="bg-[#111111] border border-slate-800 rounded-xl shadow-2xl p-6">
          <CatalogPlayer tracks={tracks || []} bucketUrl={`${supabaseUrl}/storage/v1/object/public/vault-audio`} />
        </section>

      </div>
    </main>
  );
}
