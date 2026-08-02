export default function HeroSection() {
  const scrollToVault = () => {
    document.getElementById('vault')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ⚡ APEX CTO OVERRIDE: ZERO DEAD LINKS — every nav item carries a live href.
  // Vault / Software Dev -> in-page vault anchor (the engineering showcase)
  // Mission -> the mission page; Contact -> the admin inbox via mailto.
  const NAV_ITEMS = [
    { label: 'Vault', href: '#vault', onClick: scrollToVault },
    { label: 'Software Dev', href: '#vault', onClick: scrollToVault },
    { label: 'Mission', href: '/mission', onClick: null },
    { label: 'Contact', href: 'mailto:james72919879@gmail.com', onClick: null },
  ];

  return (
    <>
      {/* Background layers — hero-bg.webp + dark overlay for readability */}
      <div className="fixed inset-0 -z-10 w-full h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.webp')" }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
      </div>

      {/* Minimal nav — stripped of all color */}
      <nav className="relative z-20 flex items-center justify-between p-6 lg:p-8">
        <h1 className="text-2xl font-black tracking-tighter text-white">
          RodneyA
        </h1>
        <ul className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-500">
          {NAV_ITEMS.map(({ label, href, onClick }) => (
            <li key={label}>
              <a
                href={href}
                {...(onClick ? { onClick } : {})}
                aria-label={label}
                className="hover:text-white transition-colors"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-400">
          R
        </div>
      </nav>

      {/* Hero Content — static, monolithic, no 3D tricks */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-8 lg:px-16 max-w-7xl">
          <div className="max-w-2xl">
            {/* Utility Subheadline — high contrast, above the name */}
            <p className="text-emerald-400 uppercase tracking-widest text-xs md:text-sm font-bold mb-4">
              Premium Sync-Ready Master Recordings for Film & Television
            </p>

            {/* Name — MASSIVE, dominating, pure white */}
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-4 leading-none">
              James Rodney Arms Jr.
            </h2>

            {/* Mission Statement — no colored tags, clean and authoritative */}
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-8">
              I don't just write code or compose music—I build escape routes. Every piece of digital architecture I engineer and every cinematic track I produce is designed to fund a revolution for the next generation. I offer a 100% independent, one-stop licensing vault with zero legal friction. But the real bottom line? Every placement builds trade schools for at-risk youth. We aren't just making media here. We are changing realities.
            </p>

            {/* Call-to-Action — Browse The Vault */}
            <button
              onClick={scrollToVault}
              className="group inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-8 text-sm tracking-widest uppercase transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] mb-12"
            >
              Browse The Vault
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>

            {/* Stats Grid — floating in empty space, no boxes, no borders, no colors */}
            <div className="grid grid-cols-4 gap-12 mb-12">
              {[
                { label: 'Broadcast Masters', value: '27' },
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