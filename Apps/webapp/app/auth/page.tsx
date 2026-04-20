"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Building2, ArrowLeft, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { usePublicOnlyRoute } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { useRequestEmailOtp, useVerifyEmailOtp, useGoogleLogin } from "@/modules/auth/hooks";
import {
  requestEmailOtpSchema,
  type RequestEmailOtpInput,
  verifyEmailOtpSchema,
  type VerifyEmailOtpInput,
} from "@/modules/auth/schemas";
import { useAuthStore } from "@/store/auth-store";
import { auth, googleProvider } from "@/config/firebase";
import { signInWithPopup } from "firebase/auth";

// ─── Background images per role ─────────────────────────────────────────────

const BG = {
  TENANT: { desktop: "/auth/User_Auth_Desktop.jpg",   mobile: "/auth/User_Auth_Mobile.png" },
  OWNER:  { desktop: "/auth/Owner_Auth_Desktop.jpeg",  mobile: "/auth/Owner_Auth_Mobile.jpeg" },
} as const;

// ─── Scroll-aware Navbar (matches home page exactly) ─────────────────────────

function AuthNavbar() {
  const { scrollY } = useScroll();
  const navBg         = useTransform(scrollY, [0, 80], ["rgba(2,6,23,0)",      "rgba(255,255,255,0.97)"]);
  const navBorder     = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0)", "rgba(226,232,240,0.8)"]);
  const navShadow     = useTransform(scrollY, [0, 80], ["0 0 0 0 transparent", "0 1px 20px 0 rgba(0,0,0,0.08)"]);
  const logoTextColor = useTransform(scrollY, [0, 80], ["#ffffff",             "#0f172a"]);
  const navLinkColor  = useTransform(scrollY, [0, 80], ["#94a3b8",             "#475569"]);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      style={{ backgroundColor: navBg, borderBottomColor: navBorder, boxShadow: navShadow }}
      className="fixed top-0 inset-x-0 z-50 border-b backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <motion.div
            whileHover={{ rotate: -8, scale: 1.12 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-emerald-500/40 shadow-lg"
          >
            <Building2 className="w-5 h-5 text-white" />
          </motion.div>
          <motion.span style={{ color: logoTextColor }} className="text-xl font-bold tracking-tight">
            StayHub
          </motion.span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {([["Browse", "/properties"], ["How it Works", "/#how-it-works"], ["For Owners", "/#for-owners"]] as [string, string][]).map(
            ([label, href]) => (
              <motion.a
                key={label}
                href={href}
                style={{ color: navLinkColor }}
                whileHover={{ y: -1 }}
                className="px-4 py-2 text-sm font-medium hover:text-emerald-500 rounded-lg transition-colors relative group"
              >
                {label}
                <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
              </motion.a>
            ),
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-emerald-500 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-white hover:text-emerald-400 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-slate-950/95 backdrop-blur-md border-t border-white/10"
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {([["Browse Properties", "/properties"], ["How it Works", "/#how-it-works"], ["For Owners", "/#for-owners"], ["Back to Home", "/"]] as [string, string][]).map(
                ([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium text-slate-300 hover:text-white py-2.5 border-b border-white/5 transition-colors"
                  >
                    {label}
                  </a>
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

// ─── 3-D tilt card ───────────────────────────────────────────────────────────

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Variants ────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  show:    { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.3,  ease: "easeIn"  as const } },
};

const slideRight = {
  hidden:  { opacity: 0, x: 30 },
  show:    { opacity: 1, x: 0,  transition: { duration: 0.4,  ease: "easeOut" as const } },
  exit:    { opacity: 0, x: -30, transition: { duration: 0.28, ease: "easeIn"  as const } },
};

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuthStore();
  usePublicOnlyRoute("/dashboard");
  const [phase, setPhase] = useState<"request" | "verify">("request");
  const [formError, setFormError] = useState<string>("");
  const [targetEmail, setTargetEmail] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"TENANT" | "OWNER">("TENANT");

  const requestOtpMutation = useRequestEmailOtp();
  const verifyOtpMutation = useVerifyEmailOtp();
  const googleLoginMutation = useGoogleLogin();

  const requestForm = useForm<RequestEmailOtpInput>({
    resolver: zodResolver(requestEmailOtpSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<VerifyEmailOtpInput>({
    resolver: zodResolver(verifyEmailOtpSchema),
    defaultValues: { email: "", otp: "", role: "TENANT", remember_me: false },
  });

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "OWNER" || role === "TENANT") {
      setSelectedRole(role);
      verifyForm.setValue("role", role);
      setFormError("");
    }
  }, [searchParams, verifyForm]);

  const onRequestOtp = requestForm.handleSubmit(async (payload) => {
    setFormError("");
    try {
      await requestOtpMutation.mutateAsync(payload);
      setTargetEmail(payload.email);
      verifyForm.setValue("email", payload.email);
      setPhase("verify");
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  });

  const onVerifyOtp = verifyForm.handleSubmit(async (payload) => {
    setFormError("");
    try {
      const data = await verifyOtpMutation.mutateAsync({
        ...payload,
        role: selectedRole,
        remember_me: payload.remember_me ?? false,
      });
      setSession(data.user, data.tokens);
      if (selectedRole === "OWNER" && !data.user.phone) {
        router.push("/owner-onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  });

  const handleGoogleLogin = async (role: "TENANT" | "OWNER") => {
    if (!auth) {
      setFormError("Google sign-in is not configured. Add Firebase keys to .env.local and restart.");
      return;
    }
    setFormError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const data = await googleLoginMutation.mutateAsync({ idToken, role });
      setSession(data.user, data.tokens);
      if (role === "OWNER" && !data.user.phone) {
        router.push("/owner-onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string; firebase_token?: string[] } } };
      setFormError(err?.response?.data?.detail || err?.response?.data?.firebase_token?.[0] || getApiErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="relative flex-1 flex items-center justify-center px-4 pt-24 pb-16 overflow-hidden">

        {/* Dynamic background with crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" as const }}
            className="absolute inset-0 z-0"
          >
            <picture>
              <source media="(max-width: 768px)" srcSet={BG[selectedRole].mobile} />
              <img src={BG[selectedRole].desktop} alt="" className="w-full h-full object-cover" />
            </picture>
            {/* Gradient overlay — shifts hue per role */}
            <div
              className={`absolute inset-0 transition-colors duration-700 ${
                selectedRole === "OWNER"
                  ? "bg-gradient-to-br from-slate-900/70 via-emerald-900/55 to-slate-900/70"
                  : "bg-gradient-to-br from-slate-900/65 via-teal-900/50 to-slate-900/65"
              }`}
            />
            {/* Ambient glow */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-teal-400/8 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" as const }}
          className="relative z-10 w-full max-w-md"
        >
          <TiltCard>
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-black/40 p-8 md:p-10">

              {/* Role toggle */}
              <div className="mb-8 flex justify-center">
                <div className="relative inline-flex bg-black/30 rounded-full p-1.5 border border-white/15 backdrop-blur-sm">
                  {/* Sliding pill */}
                  <motion.div
                    layout
                    layoutId="role-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    className={`absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 shadow-lg ${
                      selectedRole === "TENANT" ? "left-1.5 right-[50%]" : "left-[50%] right-1.5"
                    }`}
                  />
                  {(["TENANT", "OWNER"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => { setSelectedRole(role); setFormError(""); }}
                      className={`relative z-10 px-8 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                        selectedRole === role ? "text-white" : "text-white/60 hover:text-white/90"
                      }`}
                    >
                      {role === "TENANT" ? "Tenant" : "Owner"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heading */}
              <motion.div
                key={`heading-${selectedRole}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" as const }}
                className="text-center mb-8"
              >
                <h1 className="text-3xl font-bold text-white mb-2">
                  {selectedRole === "TENANT" ? "Find Your Home" : "List Your Property"}
                </h1>
                <p className="text-sm text-white/70">Sign in with OTP — no password needed.</p>
              </motion.div>

              {/* Error banner */}
              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="rounded-xl border border-red-400/30 bg-red-500/20 backdrop-blur-sm px-4 py-3 text-sm text-white">
                      {formError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forms – animated phase transition */}
              <AnimatePresence mode="wait">
                {phase === "request" ? (
                  <motion.form
                    key="request"
                    variants={slideRight}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    onSubmit={onRequestOtp}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-sm font-medium text-white/90">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/50 transition-all backdrop-blur-sm"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...requestForm.register("email")}
                      />
                      {requestForm.formState.errors.email && (
                        <p className="text-xs text-red-300">{requestForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(16,185,129,0.45)" }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={requestOtpMutation.isPending}
                      className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-lime-400 to-emerald-500 text-white rounded-xl font-semibold hover:from-lime-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {requestOtpMutation.isPending && <LoaderCircle className="h-5 w-5 animate-spin" />}
                      Send OTP
                    </motion.button>

                    {/* Divider */}
                    <div className="relative my-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/15" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 text-white/50 bg-transparent">Or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => handleGoogleLogin(selectedRole)}
                        disabled={googleLoginMutation.isPending}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 hover:border-white/35 transition-all disabled:opacity-60 disabled:cursor-not-allowed backdrop-blur-sm"
                      >
                        {googleLoginMutation.isPending ? (
                          <LoaderCircle className="w-5 h-5 animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )}
                        Google
                      </motion.button>
                      <button
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 text-white/35 rounded-xl cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="verify"
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    onSubmit={onVerifyOtp}
                    className="space-y-5"
                  >
                    <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white/90">
                      OTP sent to <span className="font-semibold text-white">{targetEmail}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="otp" className="text-sm font-medium text-white/90">
                        Verification Code
                      </label>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/50 transition-all text-center text-lg tracking-widest backdrop-blur-sm"
                        placeholder="000000"
                        maxLength={6}
                        {...verifyForm.register("otp")}
                      />
                      {verifyForm.formState.errors.otp && (
                        <p className="text-xs text-red-300">{verifyForm.formState.errors.otp.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="remember"
                        className="w-4 h-4 rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-400/50"
                        {...verifyForm.register("remember_me")}
                      />
                      <label htmlFor="remember" className="text-sm text-white/80">Keep me signed in</label>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(16,185,129,0.45)" }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={verifyOtpMutation.isPending}
                      className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-lime-400 to-emerald-500 text-white rounded-xl font-semibold hover:from-lime-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {verifyOtpMutation.isPending && <LoaderCircle className="h-5 w-5 animate-spin" />}
                      Verify & Continue
                    </motion.button>

                    <motion.button
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                      type="button"
                      className="w-full px-4 py-2.5 text-sm text-white/75 hover:text-white border border-white/20 rounded-xl transition-all"
                      onClick={() => setPhase("request")}
                    >
                      ← Use another email
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>

            </div>
          </TiltCard>
        </motion.div>
      </main>

      {/* ── Footer (matches home page) ───────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: -8 }}
                className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/30"
              >
                <Building2 className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">StayHub</span>
            </Link>

            <p className="text-sm text-slate-500 text-center">
              India&apos;s zero-brokerage rental platform. Connect directly with property owners.
            </p>

            <div className="flex items-center gap-4 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
              <span className="text-slate-700">·</span>
              <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
              <span className="text-slate-700">·</span>
              <Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link>
            </div>
          </div>
          <p className="text-center text-xs text-slate-700 mt-5">
            © {new Date().getFullYear()} StayHub Technologies Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
