const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

const oldSearchBar = `            {/* Advanced Search Bar matching image */}
            <div className="bg-white border border-slate-200 rounded-[2rem] sm:rounded-full flex flex-col sm:flex-row items-center p-2 sm:divide-x divide-white/10 shadow-2xl shadow-slate-200/50">
              <div className="px-6 py-4 flex-1 w-full hover:bg-slate-100 sm:rounded-l-full cursor-pointer transition-colors group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors">Where</p>
                    <p className="text-sm text-slate-900 font-medium truncate mt-0.5">Search location</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              
              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-slate-100 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors">Check in</p>
                  <p className="text-sm text-slate-900 font-medium truncate mt-0.5">Select date</p>
                </div>
              </div>

              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-slate-100 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors">Check out</p>
                  <p className="text-sm text-slate-900 font-medium truncate mt-0.5">Select date</p>
                </div>
              </div>

              <div className="px-6 py-4 flex-1 w-full hover:bg-slate-100 cursor-pointer transition-colors group">
                 <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors">Guests</p>
                    <p className="text-sm text-slate-900 font-medium truncate mt-0.5">Add guests</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="p-2 shrink-0 w-full sm:w-auto">
                <button className="bg-emerald-500 hover:bg-emerald-400 text-white w-full sm:w-auto rounded-full px-8 py-4 sm:py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </div>`;

const newSearchBar = `            {/* Advanced Search Bar matching image */}
            <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-[2rem] sm:rounded-full flex flex-col sm:flex-row items-center p-2 sm:divide-x divide-slate-200 shadow-2xl shadow-slate-200/50">
              <div className="px-6 py-4 flex-1 w-full hover:bg-slate-100 sm:rounded-l-full cursor-text transition-colors group">
                <div className="flex flex-col">
                  <label htmlFor="search-where" className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors cursor-text">Where</label>
                  <input
                    id="search-where"
                    type="text"
                    placeholder="Search location"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-slate-900 font-medium truncate mt-0.5 placeholder:text-slate-400 focus:ring-0 p-0"
                  />
                </div>
              </div>
              
              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-slate-100 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors">Check in</p>
                  <p className="text-sm text-slate-400 font-medium truncate mt-0.5">Select date</p>
                </div>
              </div>

              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-slate-100 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors">Check out</p>
                  <p className="text-sm text-slate-400 font-medium truncate mt-0.5">Select date</p>
                </div>
              </div>

              <div className="px-6 py-4 flex-1 w-full hover:bg-slate-100 cursor-pointer transition-colors group">
                 <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors">Guests</p>
                    <p className="text-sm text-slate-400 font-medium truncate mt-0.5">Add guests</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
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
