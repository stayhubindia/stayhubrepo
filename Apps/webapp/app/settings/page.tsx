"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  Building2,
  ChevronRight,
  Eye,
  Globe,
  Heart,
  Key,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  User,
  Volume2,
} from "lucide-react";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { useAuthStore } from "@/store/auth-store";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useUnreadCount } from "@/hooks/use-unread-count";

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-emerald-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, subtitle, iconBg = "bg-slate-100 text-slate-600" }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconBg?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  right,
  border = true,
}: {
  label: string;
  description?: string;
  right: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 px-6 py-4 ${border ? "border-b border-slate-100" : ""}`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

function LinkRow({ label, description, href, border = true }: {
  label: string;
  description?: string;
  href: string;
  border?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group ${border ? "border-b border-slate-100" : ""}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, isAllowed } = useRequireAuth();
  const { clearSession } = useAuthStore();
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  // Notification toggles
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [newMessages, setNewMessages] = useState(true);
  const [propertyAlerts, setPropertyAlerts] = useState(true);
  const [promotions, setPromotions] = useState(false);

  // Privacy toggles
  const [profileVisible, setProfileVisible] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);

  // Appearance
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [language, setLanguage] = useState("English");

  if (!isAllowed || !user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 w-full pb-24 lg:pb-0">
      <DesktopSidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* ── Topbar ── */}
        <header className="h-[72px] border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 bg-white">
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
              className="text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="hidden lg:block flex-1 max-w-2xl relative mr-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              placeholder="Search by location, property or category"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘K</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            <Link href="/favorites" className="hidden sm:flex flex-col items-center gap-1.5 group">
              <Heart className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Wishlist</span>
            </Link>
            <Link href="/chats" className="hidden sm:flex flex-col items-center gap-1.5 group relative">
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
                {!unreadLoading && !unreadError && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Messages</span>
            </Link>
            <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
            <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
            <ProfileDropdown />
          </div>
        </header>

        {/* ── Page content ── */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 pb-28">
          <div className="mx-auto max-w-4xl">

            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage your notification preferences, privacy, and app settings.
              </p>
            </div>

            <div className="space-y-5">

              {/* ── Notifications ── */}
              <Card>
                <CardHeader
                  icon={Bell}
                  title="Notifications"
                  subtitle="Manage your notification preferences and alerts."
                  iconBg="bg-sky-50 text-sky-600"
                />
                <SettingRow
                  label="Push Notifications"
                  description="Receive push notifications on your device"
                  right={<Toggle checked={pushNotifs} onChange={setPushNotifs} />}
                />
                <SettingRow
                  label="Email Notifications"
                  description="Get updates and alerts via email"
                  right={<Toggle checked={emailNotifs} onChange={setEmailNotifs} />}
                />
                <SettingRow
                  label="SMS Notifications"
                  description="Receive important alerts via SMS"
                  right={<Toggle checked={smsNotifs} onChange={setSmsNotifs} />}
                />
                <SettingRow
                  label="New Messages"
                  description="Notify when you receive a new chat message"
                  right={<Toggle checked={newMessages} onChange={setNewMessages} />}
                />
                <SettingRow
                  label="Property Alerts"
                  description="Get notified about new matching properties"
                  right={<Toggle checked={propertyAlerts} onChange={setPropertyAlerts} />}
                />
                <SettingRow
                  label="Promotions & Offers"
                  description="Receive promotional content and special offers"
                  right={<Toggle checked={promotions} onChange={setPromotions} />}
                  border={false}
                />
              </Card>

              {/* ── Privacy ── */}
              <Card>
                <CardHeader
                  icon={Lock}
                  title="Privacy"
                  subtitle="Control your privacy and data sharing preferences."
                  iconBg="bg-violet-50 text-violet-600"
                />
                <SettingRow
                  label="Profile Visibility"
                  description="Allow others to view your profile"
                  right={<Toggle checked={profileVisible} onChange={setProfileVisible} />}
                />
                <SettingRow
                  label="Show Phone Number"
                  description="Display your phone number to property owners"
                  right={<Toggle checked={showPhone} onChange={setShowPhone} />}
                />
                <SettingRow
                  label="Activity Status"
                  description="Show when you were last active"
                  right={<Toggle checked={activityStatus} onChange={setActivityStatus} />}
                />
                <SettingRow
                  label="Data Collection"
                  description="Help improve StayHub with usage analytics"
                  right={<Toggle checked={dataCollection} onChange={setDataCollection} />}
                  border={false}
                />
              </Card>

              {/* ── Security ── */}
              <Card>
                <CardHeader
                  icon={Shield}
                  title="Security"
                  subtitle="Manage your account security settings."
                  iconBg="bg-emerald-50 text-emerald-600"
                />
                <LinkRow
                  label="Change Password"
                  description="Update your account password"
                  href="/account"
                />
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Enabled
                  </span>
                </div>
                <LinkRow
                  label="Active Sessions"
                  description="View and manage your active login sessions"
                  href="/account"
                  border={false}
                />
              </Card>

              {/* ── Appearance ── */}
              <Card>
                <CardHeader
                  icon={Sun}
                  title="Appearance"
                  subtitle="Customize how StayHub looks for you."
                  iconBg="bg-amber-50 text-amber-600"
                />
                <div className="px-6 py-4 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 mb-3">Theme</p>
                  <div className="flex gap-3">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all text-xs font-semibold capitalize ${
                          theme === t
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {t === "light" && <Sun className="w-4 h-4" />}
                        {t === "dark" && <Moon className="w-4 h-4" />}
                        {t === "system" && <Monitor className="w-4 h-4" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-800 mb-2">Language</p>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                    <option>Marathi</option>
                    <option>Bengali</option>
                  </select>
                </div>
              </Card>

              {/* ── Account ── */}
              <Card>
                <CardHeader
                  icon={User}
                  title="Account"
                  subtitle="Manage your account details and preferences."
                  iconBg="bg-slate-100 text-slate-600"
                />
                <LinkRow
                  label="Edit Profile"
                  description="Update your personal information"
                  href="/account"
                />
                <LinkRow
                  label="Linked Accounts"
                  description="Manage Google and other connected accounts"
                  href="/profile"
                />
                <LinkRow
                  label="Privacy Policy"
                  description="Read our privacy policy"
                  href="/privacy"
                />
                <LinkRow
                  label="Terms of Service"
                  description="Read our terms of service"
                  href="/terms"
                  border={false}
                />
              </Card>

              {/* ── Danger zone ── */}
              <Card className="border-red-200">
                <CardHeader
                  icon={Trash2}
                  title="Danger Zone"
                  subtitle="Irreversible actions for your account."
                  iconBg="bg-red-50 text-red-500"
                />
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Delete Account</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Permanently delete your account and all data. Cannot be undone.
                      </p>
                    </div>
                    <Link
                      href="/account"
                      className="shrink-0 px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors"
                    >
                      Delete
                    </Link>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


const sections = [
  {
    title: "Notifications",
    body: "Open the notifications center to review updates, message activity, and listing alerts in one place.",
    href: "/notifications",
    cta: "Open notifications",
    icon: Bell,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    title: "Privacy",
    body: "Review how StayHub handles account data, platform activity, and support requests.",
    href: "/privacy",
    cta: "Review privacy",
    icon: ShieldCheck,
    tone: "bg-emerald-50 text-emerald-700",
  },
];
