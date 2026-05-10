const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the bottom info widgets:
// It starts at "{/* ── Bottom Info Widgets ── */}" and ends right before "</main>"
content = content.replace(/\{\/\* ── Bottom Info Widgets ── \*\/\}[\s\S]*?(?=<\/main>)/, '');

// 2. Replace PremiumPropertyCard with a no-dummy-data version
const newCard = `function PremiumPropertyCard({ p, index }: { p: PropertyListItem; index: number }) {
  const rent = Number(p.rent);
  
  // Real stats from the backend instead of dummy data
  const views = p.total_views || 0;
  const favorites = p.total_favorites || 0;
  const contacts = p.total_contacts || 0;
  
  // Create a nice gradient placeholder since backend doesn't return \`images\` yet
  const TYPE_GRADIENTS: Record<string, string> = {
    PG: "from-blue-500 to-indigo-600",
    "1RK": "from-violet-500 to-purple-600",
    "1BHK": "from-rose-500 to-pink-600",
    "2BHK": "from-emerald-500 to-teal-600",
    "3BHK": "from-amber-500 to-orange-600",
    HOUSE: "from-cyan-500 to-blue-600",
    COMMERCIAL: "from-slate-500 to-slate-700",
  };
  const grad = TYPE_GRADIENTS[p.property_type] ?? "from-slate-600 to-slate-800";

  return (
    <Link href={\`/properties/\${p.id}\`} className="group block">
      <div className="bg-[#15191C] rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 h-full flex flex-col">
        
        {/* Image / Gradient Half */}
        <div className={\`relative h-48 w-full overflow-hidden shrink-0 bg-gradient-to-br \${grad}\`}>
          <div className="absolute inset-0 flex items-center justify-center opacity-20 transition-transform duration-700 group-hover:scale-110">
             <Building2 className="w-16 h-16 text-white" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#15191C] via-transparent to-transparent opacity-80" />
          
          {p.is_featured && (
            <div className="absolute top-4 left-4">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-lg uppercase tracking-wide bg-amber-500">
                Featured
              </span>
            </div>
          )}

          <button onClick={(e) => e.preventDefault()} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-emerald-500/80 transition-colors border border-white/10 shadow-lg">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Content Half */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-white text-[15px] line-clamp-1 group-hover:text-emerald-400 transition-colors mb-1.5">
            {p.title}
          </h3>
          <p className="text-white/40 text-xs flex items-center gap-1.5 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{p.locality}, {p.city}</span>
          </p>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-400">₹{rent.toLocaleString("en-IN")}</span>
            <span className="text-white/40 text-[11px] font-medium uppercase tracking-wider">/ month</span>
          </div>

          <div className="flex items-center gap-3 text-white/50 text-[11px] mb-4 mt-auto font-medium">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md text-emerald-400/80"><Building2 className="w-3 h-3" /> {p.property_type}</div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md text-emerald-400/80"><Home className="w-3 h-3" /> {p.furnishing}</div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-white/30 text-xs font-medium">
             <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {views}</span>
             <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {favorites}</span>
             <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {contacts}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
`;

content = content.replace(/function PremiumPropertyCard\([\s\S]*?(?=\/\/ ─── Scroll-aware Navbar)/, newCard);

fs.writeFileSync(file, content);
