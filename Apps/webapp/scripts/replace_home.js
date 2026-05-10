const fs = require('fs');
const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const newContent = `    <div className="min-h-screen bg-[#090e0c] font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar showSignInMenu={showSignInMenu} setShowSignInMenu={setShowSignInMenu} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden" id="top">
        {/* Background Layers */}
        <div className="absolute inset-0 z-0">
           {/* Dark overlay base */}
           <div className="absolute inset-0 bg-[#090e0c]" />
           {/* Ambient glowing orbs */}
           <div className="absolute top-0 right-[10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
           {/* Background Image */}
           <div className="absolute inset-x-0 top-0 h-[85vh] opacity-30 mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)">
             <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80" alt="Luxury home interior" className="w-full h-full object-cover object-center" />
             <div className="absolute inset-0 bg-gradient-to-b from-[#090e0c]/50 via-[#090e0c]/80 to-[#090e0c]" />
           </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-3xl mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[3rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] font-bold text-white tracking-tight mb-6"
            >
              Find your perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">stay anywhere</span> <Sparkles className="inline-block w-10 h-10 sm:w-12 sm:h-12 text-emerald-400/80 -mt-6" />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
              className="text-lg sm:text-xl text-white/60 max-w-xl font-medium leading-relaxed"
            >
              Discover handpicked properties for rent that match your lifestyle. Zero brokerage, verified listings, seamless experience.
            </motion.p>
          </div>

          {/* Search Floating Glass Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <form
              onSubmit={handleSearch}
              className="relative rounded-3xl sm:rounded-full bg-[#151c19]/60 backdrop-blur-2xl border border-white/10 p-2 sm:p-3 shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-center gap-2 max-w-5xl"
            >
              {/* Where */}
              <div className="flex-1 w-full sm:w-auto px-5 py-3 sm:py-2 hover:bg-white/5 rounded-2xl sm:rounded-full transition-colors cursor-text group relative after:hidden sm:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:bg-white/10">
                <label htmlFor="hero-search" className="block text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1 cursor-text">Where</label>
                <div className="flex items-center gap-2">
                  <input
                    id="hero-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by city, locality..."
                    className="w-full bg-transparent text-sm sm:text-base text-white placeholder-white/40 outline-none font-medium"
                  />
                  <ChevronDown className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Property Type */}
              <div className="flex-1 w-full sm:w-auto px-5 py-3 sm:py-2 hover:bg-white/5 rounded-2xl sm:rounded-full transition-colors relative after:hidden sm:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:bg-white/10">
                <label className="block text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1">Property Type</label>
                <div className="flex items-center gap-2">
                  <select
                    value={publicPropertyType}
                    onChange={(e) => setPublicPropertyType(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base text-white outline-none font-medium appearance-none cursor-pointer [&>option]:bg-[#111614] [&>option]:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="PG">PG / Hostel</option>
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Budget */}
              <div className="flex-1 w-full sm:w-auto px-5 py-3 sm:py-2 hover:bg-white/5 rounded-2xl sm:rounded-full transition-colors relative">
                <label className="block text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1">Max Budget</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={publicMaxRent}
                    onChange={(e) => setPublicMaxRent(e.target.value)}
                    placeholder="Any budget"
                    className="w-full bg-transparent text-sm sm:text-base text-white placeholder-white/40 outline-none font-medium"
                  />
                  <ChevronDown className="w-4 h-4 text-white/40 opacity-0 transition-opacity" />
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full sm:w-auto mt-2 sm:mt-0 px-8 py-4 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl sm:rounded-full font-bold text-base transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 shrink-0"
              >
                <Search size={18} />
                <span>Search</span>
              </button>
            </form>

            {/* Popular Searches Pills */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-white/50 mr-2">Popular searches:</span>
              {[
                { label: "Mumbai", params: { city: "Mumbai" } },
                { label: "Bangalore", params: { city: "Bengaluru" } },
                { label: "Delhi", params: { city: "Delhi NCR" } },
                { label: "Hyderabad", params: { city: "Hyderabad" } },
                { label: "Noida", params: { city: "Noida" } },
                { label: "PG / Hostel", params: { property_type: "PG" } },
                { label: "Under ₹20K", params: { max_rent: "20000" } },
                { label: "Fully Furnished", params: {} },
              ].map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => {
                    const params = new URLSearchParams();
                    Object.entries(filter.params).forEach(([key, value]) => {
                      params.set(key, value);
                    });
                    router.push(\`/properties?\${params.toString()}\`);
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-all hover:text-white"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Properties ───────────────────────────────────────────── */}
      <section className="py-20 relative z-10" id="featured">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/10 pb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">Featured Properties <Sparkles className="w-6 h-6 text-emerald-400" /></h2>
              <p className="mt-2 text-white/50 font-medium">Handpicked stays for you</p>
            </div>
            <Link
              href="/properties"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
            >
              View all properties
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {isPublicPropertiesLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 rounded-3xl border border-white/5 bg-[#111614] animate-pulse relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
              ))}
            </div>
          ) : isPublicPropertiesError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm font-medium text-red-400">
              Could not load properties right now.
            </div>
          ) : (publicProperties?.length ?? 0) > 0 ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {publicProperties?.map((property, idx) => (
                <motion.div key={property.id} variants={fadeUp}>
                  <PublicPropertyCard p={property} index={idx} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
             <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
              <Building2 className="mx-auto mb-4 h-10 w-10 text-white/20" />
              <p className="font-semibold text-white">No properties are listed yet</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Trust / Features ───────────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/10 bg-[#111614]/50">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Shield, title: "Verified & Trusted", desc: "All properties are verified" },
                { icon: CheckCircle2, title: "Best Price Guarantee", desc: "Get the best deals" },
                { icon: Headphones, title: "24/7 Support", desc: "We're here to help" },
                { icon: LockKeyhole, title: "Secure & Easy", desc: "Hassle-free experience" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                     <item.icon className="w-5 h-5" />
                   </div>
                   <div>
                     <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                     <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>
      
      {/* ── Browse by type ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 py-20 sm:px-8" id="categories">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Browse by property type</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
            Find exactly what you are looking for.
          </p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {CATEGORIES.map((cat) => {
            return (
              <motion.div key={cat.type} variants={fadeUp}>
                <Link
                  href={\`/properties?property_type=\${cat.type}\`}
                  className={\`group block rounded-3xl border border-white/10 bg-[#111614] p-5 text-center transition-all hover:bg-white/5 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-1\`}
                >
                  <div className={\`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-3xl bg-white/5 group-hover:scale-110 transition-transform\`}>{cat.emoji}</div>
                  <p className={\`mt-4 text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors\`}>{cat.label}</p>
                  <p className="mt-1 text-[11px] text-white/40">{cat.sub}</p>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#111614] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">What Our Users Say</h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                rating: 5,
                text: "Found my perfect apartment in just 3 days. The direct contact with the owner made everything so easy. Highly recommend!",
                name: "Priya Sharma",
                role: "Student",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
              },
              {
                rating: 5,
                text: "Zero brokerage is a game changer. Saved so much money compared to traditional portals. The verification process gave me peace of mind.",
                name: "Rajesh Kumar",
                role: "Young Professional",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh",
              },
              {
                rating: 5,
                text: "The support team was incredibly helpful. They answered all my questions and even helped me negotiate with the owner. Great experience!",
                name: "Ananya Patel",
                role: "Working Mom",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya",
              },
            ].map((testimonial, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="rounded-3xl p-6 transition-all hover:bg-white/[0.04] bg-[#090e0c] border border-white/10 hover:border-emerald-500/20 group hover:-translate-y-1 h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array(testimonial.rating).fill(0).map((_, j) => (
                      <Star key={j} size={14} className="fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>

                 <p className="text-sm leading-relaxed mb-6 text-white/70 italic flex-1">
                  "{testimonial.text}"
                </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 bg-white/5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                      <p className="text-[11px] text-white/40">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>`;

const startIdx = content.indexOf('  return (\n    <div className="min-h-screen bg-[#f5f8f6] font-sans text-slate-900">');
const endMarker = '    </div>\n  );\n}';
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newContent + '\n' + content.substring(endIdx + '    </div>'.length);
  fs.writeFileSync(file, content);
  console.log('Replaced successfully');
} else {
  console.log('Could not find start or end index', startIdx, endIdx);
}
