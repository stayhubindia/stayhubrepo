const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

const startStr = 'function LoggedInHome({ user, onSignOut }';
const endStr = '// ─── Scroll-aware Navbar ──';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries");
  process.exit(1);
}

let block = content.slice(startIndex, endIndex);

// Replace colors
block = block.replace(/bg-\[#090e0c\]/g, 'bg-slate-50');
block = block.replace(/bg-\[#15191C\]/g, 'bg-white');
block = block.replace(/text-white\/30/g, 'text-slate-400');
block = block.replace(/text-white\/40/g, 'text-slate-400');
block = block.replace(/text-white\/50/g, 'text-slate-500');
block = block.replace(/text-white\/60/g, 'text-slate-500');
block = block.replace(/text-white\/70/g, 'text-slate-600');
block = block.replace(/text-white/g, 'text-slate-900');
block = block.replace(/border-white\/5/g, 'border-slate-200');
block = block.replace(/border-white\/10/g, 'border-slate-200');
block = block.replace(/bg-white\/5/g, 'bg-slate-100');
block = block.replace(/bg-white\/10/g, 'bg-slate-100');
block = block.replace(/hover:bg-white\/5/g, 'hover:bg-slate-200');
block = block.replace(/hover:bg-white\/20/g, 'hover:bg-slate-200');
block = block.replace(/hover:text-white/g, 'hover:text-slate-900');
block = block.replace(/group-hover:text-white/g, 'group-hover:text-slate-900');
block = block.replace(/shadow-black\/50/g, 'shadow-slate-200/50');
block = block.replace(/from-white\/10/g, 'from-slate-100');

// Fix specific things that look weird with simple replacements
block = block.replace(/bg-black\/40/g, 'bg-white/80'); // the heart button on the card
block = block.replace(/text-slate-900 shadow-lg uppercase tracking-wide bg-amber-500/g, 'text-white shadow-lg uppercase tracking-wide bg-amber-500'); // Keep "Featured" badge text white
block = block.replace(/text-slate-900 w-full sm:w-auto/g, 'text-white w-full sm:w-auto'); // the search button text
block = block.replace(/border-2 border-\[#090e0c\]/g, 'border-2 border-slate-50'); // the notification badges border
block = block.replace(/text-slate-900 px-4 py-3/g, 'text-white px-4 py-3'); // some random buttons

content = content.slice(0, startIndex) + block + content.slice(endIndex);

fs.writeFileSync(file, content);
console.log('Successfully switched LoggedInHome to light theme');
