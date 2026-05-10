"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart2,
  ChevronRight,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Menu,
  Plus,
  Search,
  Settings,
  User,
  UserCircle,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useProactiveTokenRefresh } from "@/hooks/use-proactive-refresh";
import { broadcastLogout, useSessionSync } from "@/hooks/use-session-sync";

/* ─── Bottom Nav item ─────────────────────────────────────────────────────── */
function NavItem({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center gap-0.5 px-3 py-1"
    >
      {active && (
        <span className="absolute -top-2 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-indigo-600" />
      )}
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-xl transition-colors [&>svg]:h-5 [&>svg]:w-5 ${
          active ? "text-indigo-600" : "text-slate-400"
        }`}
      >
        {children}
      </span>
      <span
        className={`text-[10px] font-semibold tracking-tight ${
          active ? "text-indigo-600" : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

/* ─── Sidebar link ────────────────────────────────────────────────────────── */
function SideLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-indigo-600" : "text-slate-500"}`} />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="h-4 w-4 text-indigo-400" />}
    </Link>
  );
}

/* ─── Main Layout ─────────────────────────────────────────────────────────── */
export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearSession } = useAuthStore();
  const [showSidebar, setShowSidebar] = useState(false);

  useSessionSync(
    () => router.push("/auth"),
    undefined,
    () => router.push("/auth"),
  );

  const userName = useMemo(() => {
    if (!user) return "User";
    return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email || user.phone || "User";
  }, [user]);

  const userInitials = useMemo(() => {
    const parts = userName.split(" ").filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : userName.slice(0, 2).toUpperCase();
  }, [userName]);

  const roleLabel = user?.role === "OWNER" ? "Property Owner" : user?.role === "TENANT" ? "Tenant" : user?.role ?? "";

  useProactiveTokenRefresh(
    useCallback(() => router.push("/auth"), [router]),
  );

  const PUBLIC_STANDALONE = ["/auth", "/signup", "/owner-signup"];
  const isStandalone = PUBLIC_STANDALONE.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!user || isStandalone) return <>{children}</>;

  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";

  const handleLogout = () => {
    broadcastLogout();
    clearSession();
    setShowSidebar(false);
    router.push("/");
  };

  return (
    <div className={`min-h-screen ${(isDashboard || isHome) ? "bg-black" : "bg-slate-50 pb-20"}`}>

      {/* ── Top Header (hidden on home/dashboard) ── */}
      {(!isHome && !isDashboard) && (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between gap-4 px-4">

            {/* Left: hamburger */}
            <button
              onClick={() => setShowSidebar(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            {/* Centre: logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
                <Home className="h-4 w-4" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                Stay<span className="text-indigo-600">hub</span>
              </span>
            </Link>

            {/* Right: user pill */}
            <button
              onClick={() => setShowSidebar(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm transition hover:border-indigo-300"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                {userInitials}
              </div>
              <span className="hidden max-w-[96px] truncate text-sm font-semibold text-slate-800 sm:block">
                {userName.split(" ")[0]}
              </span>
            </button>

          </div>
        </header>
      )}


      {/* ── Sidebar drawer ── */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setShowSidebar(false)}
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden bg-white shadow-2xl"
            >
              {/* ── Drawer header ── */}
              <div className="relative overflow-hidden bg-slate-950 px-5 pb-6 pt-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(99,102,241,0.3),_transparent_50%),radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.2),_transparent_40%)]" />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-lg font-bold text-indigo-300 ring-2 ring-indigo-500/20">
                      {userInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{userName}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{user.email || user.phone}</p>
                      {roleLabel && (
                        <span className="mt-1.5 inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                          {roleLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ── Nav links ── */}
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</p>
                <div className="space-y-1">
                  <SideLink href="/" icon={Home} label="Home" active={pathname === "/"} onClick={() => setShowSidebar(false)} />
                  <SideLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname.startsWith("/dashboard")} onClick={() => setShowSidebar(false)} />
                  <SideLink href="/properties" icon={Search} label="Search Properties" active={pathname.startsWith("/properties")} onClick={() => setShowSidebar(false)} />
                  <SideLink href="/chats" icon={MessageCircle} label="Chats" active={pathname.startsWith("/chats")} onClick={() => setShowSidebar(false)} />
                </div>

                {user.role === "OWNER" && (
                  <>
                    <p className="mb-2 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Owner tools</p>
                    <div className="space-y-1">
                      <SideLink href="/my-ads" icon={FileText} label="My Ads" active={pathname.startsWith("/my-ads")} onClick={() => setShowSidebar(false)} />
                      <SideLink href="/dashboard/properties" icon={Home} label="Properties" active={pathname === "/dashboard/properties"} onClick={() => setShowSidebar(false)} />
                      <SideLink href="/analytics" icon={BarChart2} label="Analytics" active={pathname.startsWith("/analytics")} onClick={() => setShowSidebar(false)} />
                    </div>
                  </>
                )}

                {user.role === "TENANT" && (
                  <>
                    <p className="mb-2 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Saved</p>
                    <div className="space-y-1">
                      <SideLink href="/favorites" icon={Heart} label="Saved Properties" active={pathname.startsWith("/favorites")} onClick={() => setShowSidebar(false)} />
                    </div>
                  </>
                )}

                <p className="mb-2 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Account</p>
                <div className="space-y-1">
                  <SideLink href="/account" icon={Settings} label="Account Settings" active={pathname.startsWith("/account")} onClick={() => setShowSidebar(false)} />
                  <SideLink href="/profile" icon={UserCircle} label="Edit Profile" active={pathname.startsWith("/profile")} onClick={() => setShowSidebar(false)} />
                </div>
              </div>

              {/* ── Logout footer ── */}
              <div className="border-t border-slate-100 px-3 py-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4.5 w-4.5 shrink-0" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main>{children}</main>

      {/* ── Bottom Navigation ── */}
      {(!isDashboard && !isHome) && (
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-sm items-end justify-around px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">

          {/* Home */}
          <NavItem href="/" label="Home" active={pathname === "/"}>
            <Home />
          </NavItem>

          {/* Chats */}
          <NavItem href="/chats" label="Chats" active={pathname.startsWith("/chats")}>
            <MessageCircle />
          </NavItem>

          {/* Centre FAB */}
          <Link
            href={user.role === "OWNER" ? "/my-ads/new" : "/properties"}
            className="flex flex-col items-center gap-1 -mt-5"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95 ${
                user.role === "OWNER"
                  ? "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-indigo-500/30"
                  : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30"
              }`}
            >
              {user.role === "OWNER" ? (
                <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
              ) : (
                <Search className="h-6 w-6 text-white" strokeWidth={2.5} />
              )}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              {user.role === "OWNER" ? "Post Ad" : "Search"}
            </span>
          </Link>

          {/* My Ads / Saved */}
          {user.role === "OWNER" ? (
            <NavItem href="/my-ads" label="My Ads" active={pathname.startsWith("/my-ads")}>
              <FileText />
            </NavItem>
          ) : (
            <NavItem href="/favorites" label="Saved" active={pathname.startsWith("/favorites")}>
              <Heart />
            </NavItem>
          )}

          {/* Account */}
          <NavItem href="/account" label="Account" active={pathname.startsWith("/account")}>
            <User />
          </NavItem>

        </div>
      </nav>
      )}
    </div>
  );
}
