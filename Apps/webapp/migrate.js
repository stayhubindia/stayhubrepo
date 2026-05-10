const fs = require('fs');

const pageFile = 'c:\\\\Users\\\\KARAN\\\\OneDrive\\\\Desktop\\\\stayhubrepo\\\\Apps\\\\webapp\\\\app\\\\page.tsx';
const dashboardFile = 'c:\\\\Users\\\\KARAN\\\\OneDrive\\\\Desktop\\\\stayhubrepo\\\\Apps\\\\webapp\\\\app\\\\dashboard\\\\page.tsx';

let pageContent = fs.readFileSync(pageFile, 'utf8');
const dashboardContent = fs.readFileSync(dashboardFile, 'utf8');

// Extract the dashboard content
const dashMatch = dashboardContent.match(/export default function DashboardPage\(\) \{([\s\S]*?)^\}/m);
if (!dashMatch) {
  console.error("Could not find DashboardPage");
  process.exit(1);
}
let newHomeBody = dashMatch[1];

// We don't need `const { user, isAllowed } = useRequireAuth();` or `const { clearSession } = useAuthStore();`
newHomeBody = newHomeBody.replace(/const router = useRouter\(\);\n\s*const \{ user, isAllowed \} = useRequireAuth\(\);\n\s*const \{ clearSession \} = useAuthStore\(\);\n\s*const \[mobileMenuOpen, setMobileMenuOpen\] = useState\(false\);/, 'const router = useRouter();\n  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);');
newHomeBody = newHomeBody.replace(/if \(!isAllowed \|\| !user\) \{\n\s*return null;\n\s*\}/, '');
newHomeBody = newHomeBody.replace(/const handleLogout = \(\) => \{\n\s*broadcastLogout\(\);\n\s*clearSession\(\);\n\s*router\.push\("\/"\);\n\s*\};/g, 'const handleLogout = onSignOut;');

const newFunction = `function LoggedInHome({ user, onSignOut }: { user: AppUser; onSignOut: () => void }) {${newHomeBody}}\n`;

// Replace LoggedInHome in page.tsx
pageContent = pageContent.replace(/function LoggedInHome\(\{ user, onSignOut \}: \{ user: AppUser; onSignOut: \(\) => void \}\) \{[\s\S]*?\n\}\n\n\/\/ ─── Scroll-aware Navbar/m, newFunction + '\n// ─── Scroll-aware Navbar');

// Update imports
if (!pageContent.includes('useFavorites')) {
  pageContent = pageContent.replace(/import \{ useAuthStore \} from "@\/store\/auth-store";/, `import { useAuthStore } from "@/store/auth-store";\nimport { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";\nimport { getApiErrorMessage } from "@/lib/api-error";\nimport { useFavorites } from "@/modules/favorites/hooks";\nimport { useMyProperties } from "@/modules/properties/hooks";`);
}

// Add UserIcon, AlertCircle, Bookmark to lucide-react
pageContent = pageContent.replace(/import \{\s*([\s\S]*?)\s*\} from "lucide-react";/, (match, p1) => {
  const icons = new Set(p1.split(',').map(s => s.trim()).filter(Boolean));
  icons.add('AlertCircle');
  icons.add('Bookmark');
  icons.add('User as UserIcon');
  return `import {\n  ${Array.from(icons).join(', ')}\n} from "lucide-react";`;
});

const helpers = `
const formatCurrency = (value: string | number | null | undefined) =>
  \`Rs. \${Number(value ?? 0).toLocaleString("en-IN")}\`;

const formatMonthYear = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

const statusTone: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  PENDING: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  DRAFT: "bg-white/10 text-slate-300 border border-white/20",
  RENTED: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
  EXPIRED: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border border-red-500/30",
};
`;

if (!pageContent.includes('formatCurrency')) {
  pageContent = pageContent.replace(/function LoggedInHome/, helpers + '\\nfunction LoggedInHome');
}

fs.writeFileSync(pageFile, pageContent);
console.log("Migration complete!");
