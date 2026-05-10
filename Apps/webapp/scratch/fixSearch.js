const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for searchCity and handleSearch inside LoggedInHome
content = content.replace(
  `function LoggedInHome({ user, onSignOut }: { user: AppUser; onSignOut: () => void }) {`,
  `function LoggedInHome({ user, onSignOut }: { user: AppUser; onSignOut: () => void }) {\n  const router = useRouter();\n  const [searchCity, setSearchCity] = useState("");\n\n  const handleSearch = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (searchCity.trim()) {\n      router.push(\`/properties?city=\${encodeURIComponent(searchCity.trim())}\`);\n    } else {\n      router.push(\`/properties\`);\n    }\n  };`
);

// 2. Replace the static search bar with a form
const oldSearchBar = `{/* Advanced Search Bar matching image */}
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
            </div>`;

const newSearchBar = `{/* Advanced Search Bar matching image */}
            <form onSubmit={handleSearch} className="bg-[#15191C] border border-white/5 rounded-[2rem] sm:rounded-full flex flex-col sm:flex-row items-center p-2 sm:divide-x divide-white/10 shadow-2xl shadow-black/50">
              <div className="px-6 py-4 flex-1 w-full hover:bg-white/5 sm:rounded-l-full cursor-text transition-colors group">
                <div className="flex flex-col">
                  <label htmlFor="search-where" className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors cursor-text">Where</label>
                  <input
                    id="search-where"
                    type="text"
                    placeholder="Search location"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white font-medium truncate mt-0.5 placeholder:text-white/30 focus:ring-0 p-0"
                  />
                </div>
              </div>
              
              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-white/5 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Check in</p>
                  <p className="text-sm text-white/50 font-medium truncate mt-0.5">Any week</p>
                </div>
              </div>

              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-white/5 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Check out</p>
                  <p className="text-sm text-white/50 font-medium truncate mt-0.5">Any week</p>
                </div>
              </div>

              <div className="px-6 py-4 flex-1 w-full hover:bg-white/5 cursor-pointer transition-colors group">
                 <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Guests</p>
                    <p className="text-sm text-white/50 font-medium truncate mt-0.5">Add guests</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/30" />
                </div>
              </div>

              <div className="p-2 shrink-0 w-full sm:w-auto">
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-white w-full sm:w-auto rounded-full px-8 py-4 sm:py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </form>`;

content = content.replace(oldSearchBar, newSearchBar);
fs.writeFileSync(file, content);
console.log('Search functionality added successfully');
