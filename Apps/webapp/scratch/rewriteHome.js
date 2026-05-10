const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

const newLoggedInHome = `function LoggedInHome({ user, onSignOut }: { user: AppUser; onSignOut: () => void }) {
  const [activeType, setActiveType] = useState("ALL");
  const [currentLocationLabel, setCurrentLocationLabel] = useState<string>("");

  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: async () => {
      const res = await http.get("/properties/?limit=9");
      return (res.data.results ?? res.data) as PropertyListItem[];
    },
    retry: 1,
    staleTime: 60_000,
  });

  const isOwner = user.role === "OWNER";
  const firstName = user.first_name ?? user.email?.split("@")[0] ?? "there";

  const SIDEBAR_ITEMS = [
    { icon: Home, label: "Home", href: "/", active: true },
    { icon: Search, label: "Browse Properties", href: "/properties" },
    { icon: Calendar, label: "My Bookings", href: "/bookings" },
    { icon: Heart, label: "Wishlist", href: "/favorites" },
    { icon: Bookmark, label: "Saved Searches", href: "/saved" },
    { icon: MessageSquare, label: "Messages", href: "/messages", badge: 3 },
    { icon: Star, label: "Reviews", href: "/reviews" },
    { icon: DollarSign, label: "Payments", href: "/payments" },
    { icon: Users, label: "Refer & Earn", href: "/refer" },
  ];

  return (
    <div className="flex min-h-screen bg-[#090e0c]">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-white/5 bg-[#090e0c] hidden lg:flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-white text-xl tracking-tight">Stay<span className="text-emerald-400">Hub</span></span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1.5">
          {SIDEBAR_ITEMS.map((item, i) => (
            <Link key={i} href={item.href} className={\`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 \${item.active ? "bg-white/5 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}\`}>
              <div className="flex items-center gap-3">
                <item.icon className={\`w-4.5 h-4.5 \${item.active ? "text-emerald-400" : ""}\`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          {isOwner && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <Link href="/dashboard" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-4.5 h-4.5" />
                  <span className="text-sm font-medium">Host Dashboard</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">New</span>
              </Link>
            </div>
          )}
        </nav>

        {/* List Property Ad */}
        <div className="p-5 mt-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-5">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80')] opacity-20 mix-blend-overlay object-cover" />
            <div className="relative z-10">
              <h4 className="text-white font-bold text-sm mb-1">List your property</h4>
              <p className="text-white/50 text-xs mb-4 leading-relaxed">Earn more by listing your space on StayHub.</p>
              <Link href="/my-ads" className="inline-flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/5 w-full justify-center">
                Become a Host <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Topbar */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 bg-[#090e0c]/80 backdrop-blur-xl">
          {/* Mobile menu button & logo */}
          <div className="flex items-center gap-4 lg:hidden">
            <button className="text-white/70 hover:text-white p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="hidden lg:block w-full max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
            <input 
              placeholder="Search by location, property or category" 
              className="w-full bg-[#15191C] border border-white/5 rounded-xl py-2.5 pl-11 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono border border-white/10 rounded px-1.5 py-0.5 bg-white/5">⌘K</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 ml-auto">
            <Link href="/favorites" className="hidden sm:flex flex-col items-center gap-1 group">
              <Heart className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
              <span className="text-[10px] font-medium text-white/50 group-hover:text-white">Wishlist</span>
            </Link>
            <Link href="/messages" className="hidden sm:flex flex-col items-center gap-1 group relative">
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#090e0c] flex items-center justify-center text-[8px] font-bold text-white">3</span>
              </div>
              <span className="text-[10px] font-medium text-white/50 group-hover:text-white mt-1">Messages</span>
            </Link>
            <Link href="/notifications" className="hidden sm:flex flex-col items-center gap-1 group relative">
              <div className="relative">
                <Bell className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#090e0c] flex items-center justify-center text-[8px] font-bold text-white">6</span>
              </div>
              <span className="text-[10px] font-medium text-white/50 group-hover:text-white mt-1">Notifications</span>
            </Link>
            
            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-white/10 mx-2" />

            {/* Profile Dropdown Trigger */}
            <div className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-xl hover:bg-white/5 transition-colors" onClick={onSignOut}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center overflow-hidden border border-white/10">
                <span className="text-sm font-bold text-white">
                  {user.first_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white leading-tight group-hover:text-emerald-400 transition-colors">{firstName}</p>
                <p className="text-[10px] text-white/50 leading-tight">View profile</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 pb-32 max-w-7xl mx-auto w-full space-y-12">
          
          {/* ── Hero Section ── */}
          <section className="relative z-10">
            <p className="text-emerald-400 text-sm font-semibold mb-3 flex items-center gap-2">
              Welcome back, {firstName} <span className="text-lg">👋</span>
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white mb-4 tracking-tight leading-[1.1]">
              Find your perfect <br className="hidden sm:block" />stay, <span className="text-emerald-400">your way</span>
            </h1>
            <p className="text-white/50 mb-10 max-w-md text-base leading-relaxed">
              Explore handpicked properties that match your lifestyle and comfort.
            </p>

            {/* Advanced Search Bar matching image */}
            <div className="bg-[#15191C] border border-white/5 rounded-[2rem] sm:rounded-full flex flex-col sm:flex-row items-center p-2 sm:divide-x divide-white/10 shadow-2xl shadow-black/50">
              <div className="px-6 py-4 flex-1 w-full hover:bg-white/5 sm:rounded-l-full cursor-pointer transition-colors group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Where</p>
                    <p className="text-sm text-white font-medium truncate mt-0.5">Search location</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/30" />
                </div>
              </div>
              
              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-white/5 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Check in</p>
                  <p className="text-sm text-white font-medium truncate mt-0.5">Select date</p>
                </div>
              </div>

              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-white/5 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Check out</p>
                  <p className="text-sm text-white font-medium truncate mt-0.5">Select date</p>
                </div>
              </div>

              <div className="px-6 py-4 flex-1 w-full hover:bg-white/5 cursor-pointer transition-colors group">
                 <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Guests</p>
                    <p className="text-sm text-white font-medium truncate mt-0.5">Add guests</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/30" />
                </div>
              </div>

              <div className="p-2 shrink-0 w-full sm:w-auto">
                <button className="bg-emerald-500 hover:bg-emerald-400 text-white w-full sm:w-auto rounded-full px-8 py-4 sm:py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </div>
          </section>

          {/* ── Featured Properties Grid ── */}
          <section>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1.5">Featured for you</h2>
                <p className="text-white/40 text-sm">Handpicked properties based on your preferences</p>
              </div>
              <Link href="/properties" className="hidden sm:flex text-white/60 hover:text-white text-sm items-center gap-1 transition-colors group">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-[#15191C] border border-white/5 rounded-3xl h-[400px] animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 text-sm text-center">
                Failed to load featured properties.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {(properties || []).slice(0, 4).map((p, i) => (
                  <PremiumPropertyCard p={p} index={i} key={p.id} />
                ))}
              </div>
            )}
          </section>
          
          {/* ── Bottom Info Widgets ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
             <div className="bg-[#15191C] border border-white/5 rounded-2xl p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-white font-bold">Recommendations for you</h3>
                 <span className="text-emerald-400 text-xs font-semibold">View all</span>
               </div>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                       <Building2 className="w-4 h-4 text-emerald-400" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-white mb-0.5">Properties near workplace</p>
                       <p className="text-xs text-white/40">12 available</p>
                     </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-white/20" />
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                       <CalendarIcon className="w-4 h-4 text-amber-400" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-white mb-0.5">Similar to last booking</p>
                       <p className="text-xs text-white/40">8 available</p>
                     </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-white/20" />
                 </div>
               </div>
             </div>

             <div className="bg-[#15191C] border border-white/5 rounded-2xl p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-white font-bold">Your saved searches</h3>
                 <span className="text-emerald-400 text-xs font-semibold">View all</span>
               </div>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center">
                       <UserIcon className="w-4 h-4 text-white/50" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-white mb-0.5">2 BHK in Bangalore</p>
                       <p className="text-xs text-white/40">Whitefield • 2 Guests</p>
                     </div>
                   </div>
                   <Bell className="w-4 h-4 text-emerald-400" />
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center">
                       <MessageSquare className="w-4 h-4 text-white/50" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-white mb-0.5">Apartments in Noida</p>
                       <p className="text-xs text-white/40">Sector 62 • Budget: ₹20K - ₹30K</p>
                     </div>
                   </div>
                   <Bell className="w-4 h-4 text-emerald-400" />
                 </div>
               </div>
             </div>

             <div className="bg-[#15191C] border border-white/5 rounded-2xl p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-white font-bold">Continue browsing</h3>
                 <span className="text-emerald-400 text-xs font-semibold">View all</span>
               </div>
               <div className="space-y-4">
                 {[0, 1].map((i) => (
                   <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                     <div className="flex items-center gap-4">
                       <img src={\`https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=100&q=80\`} alt="Thumb" className="w-14 h-14 rounded-lg object-cover" />
                       <div>
                         <p className="text-sm font-medium text-white mb-0.5">Luxury 3 BHK Apartment</p>
                         <p className="text-xs text-white/40 mb-1">Sector 62, Noida</p>
                         <p className="text-[10px] text-emerald-400/80">Last viewed {2 + i * 3} days ago</p>
                       </div>
                     </div>
                     <ArrowRight className="w-4 h-4 text-white/20" />
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PremiumPropertyCard({ p, index }: { p: PropertyListItem; index: number }) {
  const images = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1612637968894-660373e23b03?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  ];
  const image = images[index % images.length];
  const badges = ["New", "Popular", "Trending", "Premium"];
  const badgeColors = ["bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-purple-500"];
  const badge = badges[index % badges.length];
  const badgeColor = badgeColors[index % badges.length];
  
  const beds = p.property_type === "PG" ? 1 : p.property_type === "3BHK" ? 3 : p.property_type === "2BHK" ? 2 : 1;
  const rent = Number(p.rent);

  return (
    <Link href={\`/properties/\${p.id}\`} className="group block">
      <div className="bg-[#15191C] rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 h-full flex flex-col">
        
        {/* Image Half */}
        <div className="relative h-48 w-full overflow-hidden shrink-0">
          <img src={image} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#15191C] via-transparent to-transparent opacity-80" />
          
          <div className="absolute top-4 left-4">
            <span className={\`px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-lg uppercase tracking-wide \${badgeColor}\`}>
              {badge}
            </span>
          </div>

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

          <div className="mb-4">
            <span className="text-lg font-bold text-emerald-400">₹{rent.toLocaleString("en-IN")}</span>
            <span className="text-white/40 text-[11px] ml-1 font-medium uppercase tracking-wider">/ month</span>
          </div>

          <div className="flex items-center gap-3 text-white/50 text-[11px] mb-4 mt-auto font-medium">
            <div className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5 text-emerald-500/70" /> {beds} Beds</div>
            <div className="flex items-center gap-1.5"><Bath className="w-3.5 h-3.5 text-emerald-500/70" /> {beds > 1 ? 2 : 1} Baths</div>
            <div className="flex items-center gap-1.5"><Maximize2 className="w-3.5 h-3.5 text-emerald-500/70" /> {beds * 400 + 200} sqft</div>
            <div className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-emerald-500/70" /> Free WiFi</div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 mr-1.5" />
            <span className="text-white font-medium text-xs">4.{8 - (index % 3)}</span>
            <span className="text-white/30 text-[11px] ml-1.5 font-medium">({120 - index * 15} reviews)</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
`;

// Extract everything before function LoggedInHome
const beforeMatch = content.match(/([\s\S]*?)(const formatCurrency|function LoggedInHome)/);
let beforeText = beforeMatch[1];

// Extract everything after function LoggedInHome up to Scroll-aware Navbar
const afterMatch = content.match(/(\/\/ ─── Scroll-aware Navbar[\s\S]*)/);
let afterText = afterMatch[1];

// Write it back
fs.writeFileSync(file, beforeText + newLoggedInHome + '\\n\\n' + afterText);
