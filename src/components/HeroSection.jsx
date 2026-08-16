import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { getCatalogAll, getArtistsLedger } from '../services/catalogService';

export default function HeroSection() {
  const [catalogCount, setCatalogCount] = useState(0);
  const [activeNav, setActiveNav] = useState('Vault');
  // ⚡ V24 RESPONSIVE HERO: mobile paints the ultra-light 32KB variant instantly;
  // desktop/tablet upgrades to full-res hero-bg.webp. Filters are baked in.
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  // ⚡ MULTI-TENANT DYNAMIC ROUTING: extract the active artistId from the URL.
  const { artistId } = useParams();
  const navigate = useNavigate();
  // ⚡ MULTI-TENANT ARTISTS LEDGER: the global roster for the dropdown.
  const [artists, setArtists] = useState([]);
  // ⚡ MULTI-TENANT ACTIVE ARTIST: the resolved artist record for hero hydration.
  const [activeArtist, setActiveArtist] = useState(null);

  // ⚡ V24 MEDIA QUERY DRIVER: react to viewport width changes so the correct
  // background asset is always served without runtime filter cost.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // ⚡ MULTI-TENANT ARTISTS LEDGER HYDRATION: fetch the full roster on mount
  // so the global navigation dropdown can render every guest catalog.
  useEffect(() => {
    let cancelled = false;
    getArtistsLedger()
      .then((rows) => {
        if (!cancelled) setArtists(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setArtists([]);
      });
    return () => { cancelled = true; };
  }, []);

  // ⚡ MULTI-TENANT ACTIVE ARTIST RESOLUTION: when an artistId is present in
  // the URL, resolve it against the ledger for hero background + name hydration.
  useEffect(() => {
    if (!artistId) {
      setActiveArtist(null);
      return;
    }
    const match = artists.find((a) => a.id === artistId);
    setActiveArtist(match || null);
  }, [artistId, artists]);

  // ⚡ DYNAMIC DATA HYDRAULICS: the Broadcast Masters counter is bound directly
  // to the live Supabase sync_catalog payload length — zero hardcoded metrics,
  // zero data distrust. The repository layer caches this for 60s, so the
  // Vault grid and hero stay perfectly in sync on every mount.
  useEffect(() => {
    let cancelled = false;
    getCatalogAll(artistId)
      .then((rows) => {
        if (!cancelled) setCatalogCount(Array.isArray(rows) ? rows.length : 0);
      })
      .catch(() => {
        if (!cancelled) setCatalogCount(0);
      });
    return () => { cancelled = true; };
  }, [artistId]);

  const scrollToVault = () => {
    document.getElementById('vault')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ⚡ MULTI-TENANT DROPDOWN HANDLER: navigate to the selected guest vault.
  const handleArtistChange = (e) => {
    const value = e.target.value;
    if (!value) {
      navigate('/');
      return;
    }
    navigate(`/vault/${value}`);
  };

  // ⚡ APEX CTO OVERRIDE: ZERO DEAD LINKS — every nav item carries a live destination.
  // ⚡ V15 QA STRIKE: Mission uses React Router <Link> (never a raw <a>) so the
  // SPA never hard-reloads — the global PlayerBar keeps playing across routes.
  const NAV_ITEMS = [
    { label: 'Vault', href: '#vault', onClick: () => { setActiveNav('Vault'); scrollToVault(); } },
    { label: 'Software Dev', href: '#vault', onClick: () => { setActiveNav('Software Dev'); scrollToVault(); } },
    { label: 'Mission', to: '/mission', onClick: () => setActiveNav('Mission') },
    {
      label: 'Contact',
      href: '#',
      onClick: (e) => {
        if (e) e.preventDefault();
        setActiveNav('Contact');
        navigator.clipboard.writeText('rodneyandsonsfoundation@gmail.com');
        window.location.href = 'mailto:rodneyandsonsfoundation@gmail.com';
        alert('Contact Email: rodneyandsonsfoundation@gmail.com\n\n(Copied to your clipboard!)');
      }
    },
  ];

  // ⚡ INSTITUTIONAL POLISH: sync active nav state with the current route
  // so the Mission link stays highlighted when the user navigates to /mission.
  useEffect(() => {
    if (location.pathname === '/mission') {
      setActiveNav('Mission');
    }
  }, [location.pathname]);

  // ⚡ MULTI-TENANT HERO HYDRATION: resolve the hero background + artist name.
  // Root route defaults to the master tenant (James Rodney Arms Jr.).
  const heroBg = activeArtist?.hero_bg_image
    ? activeArtist.hero_bg_image
    : isDesktop
      ? '/hero-bg.webp'
      : '/hero-bg-mobile.webp';
  const heroName = activeArtist?.artist_name || 'James Rodney Arms Jr.';

  return (
    <>
      {/* Background layers — hero-bg.webp + dark overlay for readability
          ⚡ V25 COLOR RESTORATION: full color restored to all hero assets.
          ultra-light hero-bg-mobile.webp is served on mobile for INSTANT 4G
          rendering; desktop/tablet (>=768px) upgrades to full-res hero-bg.webp.
          The dark overlay stack (bg-black/70 + gradients) guarantees the white
          and emerald text stays readable over the restored color.
          ⚡ MULTI-TENANT: when a guest artist is active, their hero_bg_image
          hydrates the background dynamically. */}
      <div className="fixed inset-0 -z-10 w-full h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${heroBg}')`,
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
      </div>

      {/* Minimal nav — stripped of all color */}
      <nav className="relative z-20 flex items-center justify-between p-6 lg:p-8">
        {/* Wordmark — demoted from h1: the sync tagline is now the single page h1 */}
        <p className="text-2xl font-black tracking-tighter text-white">
          RodneyA
        </p>
        <ul className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-500">
          {NAV_ITEMS.map(({ label, href, to, onClick }) => {
            const isActive = activeNav === label;
            const linkClass = `transition-colors pb-1 ${
              isActive
                ? 'text-emerald-400 border-b border-emerald-400'
                : 'hover:text-white'
            }`;
            // ⚡ V15 QA STRIKE: internal routes must render as React Router <Link>
            // to preserve the SPA shell and keep audio streaming between views.
            const content = to ? (
              <Link
                to={to}
                onClick={onClick}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={linkClass}
              >
                {label}
              </Link>
            ) : (
              <a
                href={href}
                onClick={(e) => {
                  if (href === '#') e.preventDefault();
                  if (onClick) onClick(e);
                }}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={linkClass}
              >
                {label}
              </a>
            );
            return <li key={label}>{content}</li>;
          })}
        </ul>
        <div className="flex items-center gap-3">
          {/* ⚡ MULTI-TENANT GLOBAL NAVIGATION DROPDOWN — GUEST CATALOGS */}
          <select
            value={artistId || ''}
            onChange={handleArtistChange}
            aria-label="Guest Catalogs"
            className="bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-bold tracking-widest uppercase px-3 py-2 rounded outline-none hover:border-emerald-500/50 focus:border-emerald-500/60 transition-colors cursor-pointer"
          >
            <option value="">Master Vault</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.artist_name} Vault
              </option>
            ))}
          </select>
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-400">
            R
          </div>
        </div>
      </nav>

      {/* Hero Content — sync-focused, zero engineering copy */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-8 lg:px-16 max-w-7xl">
          <div className="max-w-2xl">
            {/* PRIMARY TAGLINE — H1: visually dominant, display-block */}
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none mb-4">
              Premium Sync-Ready Master Recordings for Film & Television
            </h1>

            {/* ARTIST NAME — H2: highly styled, emerald accent
                ⚡ MULTI-TENANT: hydrates to the active artist's name. */}
            <h2 className="text-emerald-400 uppercase tracking-[0.2em] text-xl md:text-2xl font-black mb-6">
              {heroName}
            </h2>

            {/* MISSION STATEMENT — 100% sync focus, zero legal friction */}
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-8">
              One-stop, 100% independent master sync catalog with zero legal friction. Every placement directly funds trade schools for at-risk youth. We aren't just making media here. We are changing realities.
            </p>

            {/* Call-to-Action — Browse The Vault */}
            <button
              onClick={scrollToVault}
              className="group inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-8 text-sm tracking-widest uppercase transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] mb-12"
            >
              Browse The Vault
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>

            {/* Stats Grid — floating in empty space, no boxes, no borders, no colors
                ⚡ APEX DATA HYDRAULICS: Broadcast Masters is bound to the live
                Supabase sync_catalog payload length — never a hardcoded number. */}
            <div className="grid grid-cols-4 gap-12 mb-12">
              {[
                { label: 'Broadcast Masters', value: catalogCount || '–' },
                { label: 'Wav 24-Bit Stems', value: '7' },
                { label: 'Lufs Mastered', value: '-14' },
                { label: 'Turnaround', value: '24HR' },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-6xl md:text-7xl font-black text-white leading-none mb-2">
                    {stat.value}
                  </span>
                  <span className="text-xs md:text-sm text-zinc-200 tracking-widest uppercase font-semibold">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}