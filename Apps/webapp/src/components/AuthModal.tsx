"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
  TENANT: { desktop: "/auth/User_Auth_Desktop.jpg", mobile: "/auth/User_Auth_Mobile.png" },
  OWNER: { desktop: "/auth/Owner_Auth_Desktop.jpeg", mobile: "/auth/Owner_Auth_Mobile.jpeg" },
} as const;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: "TENANT" | "OWNER";
  redirectTo?: string;
  onAuthenticated?: () => void;
}

const slideRight = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.28, ease: "easeIn" as const } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: "easeIn" as const } },
};

export default function AuthModal({ isOpen, onClose, initialRole = "TENANT", redirectTo, onAuthenticated }: AuthModalProps) {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [phase, setPhase] = useState<"request" | "verify">("request");
  const [formError, setFormError] = useState<string>("");
  const [targetEmail, setTargetEmail] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"TENANT" | "OWNER">(initialRole);

  const requestOtpMutation = useRequestEmailOtp();
  const verifyOtpMutation = useVerifyEmailOtp();
  const googleLoginMutation = useGoogleLogin();

  const getPostAuthPath = (role: "TENANT" | "OWNER", user: { phone?: string | null }) => {
    if (role === "OWNER" && !user.phone) return "/owner-onboarding";
    return redirectTo ?? "/dashboard";
  };

  const requestForm = useForm<RequestEmailOtpInput>({
    resolver: zodResolver(requestEmailOtpSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<VerifyEmailOtpInput>({
    resolver: zodResolver(verifyEmailOtpSchema),
    defaultValues: { email: "", otp: "", role: initialRole, remember_me: false },
  });

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
      onAuthenticated?.();
      router.push(getPostAuthPath(selectedRole, data.user));
      onClose(); // Close modal on successful auth
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
      onAuthenticated?.();
      router.push(getPostAuthPath(role, data.user));
      onClose(); // Close modal on successful auth
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string; firebase_token?: string[] } } };
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.firebase_token?.[0] || getApiErrorMessage(error);
      setFormError(errorMsg);
    }
  };

  // Reset state when closed
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setPhase("request");
      setFormError("");
      requestForm.reset();
      verifyForm.reset();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-4xl min-h-[500px] bg-[#090e0c] rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Image Section */}
            <div className="hidden md:block relative w-1/2 overflow-hidden bg-slate-900">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedRole}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0"
                >
                  <img src={BG[selectedRole].desktop} alt="" className="w-full h-full object-cover" />
                  <div
                    className={`absolute inset-0 transition-colors duration-700 ${
                      selectedRole === "OWNER"
                        ? "bg-gradient-to-tr from-[#090e0c] via-emerald-900/60 to-transparent"
                        : "bg-gradient-to-tr from-[#090e0c] via-teal-900/50 to-transparent"
                    }`}
                  />
                  {/* Text Overlay */}
                  <div className="absolute inset-0 p-10 flex flex-col justify-end pb-12">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h2 className="text-3xl font-bold text-white mb-3">
                        {selectedRole === "TENANT" ? "Find Your Next Home" : "List With Confidence"}
                      </h2>
                      <p className="text-white/70 text-sm leading-relaxed max-w-sm">
                        {selectedRole === "TENANT" 
                          ? "Zero brokerage. Verified properties. Connect directly with owners seamlessly." 
                          : "Join thousands of owners listing their properties. Manage everything in one place."}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Form Section */}
            <div className="w-full md:w-1/2 p-8 md:p-10 lg:p-12 relative flex items-center justify-center">
              {/* Ambient glows behind form */}
              <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
              
              <div className="w-full max-w-sm relative z-10">
                {/* Role toggle */}
                <div className="mb-8 flex justify-center">
                  <div className="relative inline-flex bg-white/5 rounded-full p-1 border border-white/10 backdrop-blur-sm">
                    {/* Sliding pill */}
                    <motion.div
                      layout
                      layoutId="modal-role-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      className={`absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg ${
                        selectedRole === "TENANT" ? "left-1 right-[50%]" : "left-[50%] right-1"
                      }`}
                    />
                    {(["TENANT", "OWNER"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => { setSelectedRole(role); setFormError(""); verifyForm.setValue("role", role); }}
                        className={`relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
                          selectedRole === role ? "text-white" : "text-white/50 hover:text-white/90"
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
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-center mb-8"
                >
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {selectedRole === "TENANT" ? "Welcome Back" : "Owner Portal"}
                  </h3>
                  <p className="text-sm text-white/50">Sign in with OTP — no password needed.</p>
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
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all font-medium"
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...requestForm.register("email")}
                        />
                        {requestForm.formState.errors.email && (
                          <p className="text-xs text-red-400 mt-1">{requestForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={requestOtpMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                      >
                        {requestOtpMutation.isPending && <LoaderCircle className="h-5 w-5 animate-spin" />}
                        Send OTP
                      </button>

                      {/* Divider */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-widest">
                          <span className="px-3 text-white/40 bg-[#090e0c]">Or continue with</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGoogleLogin(selectedRole)}
                        disabled={googleLoginMutation.isPending}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                        Sign in with Google
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="verify"
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      onSubmit={onVerifyOtp}
                      className="space-y-4"
                    >
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 text-center mb-6">
                        OTP sent to <span className="font-semibold text-white">{targetEmail}</span>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="otp" className="text-[11px] font-bold text-white/70 uppercase tracking-wider text-center block">
                          Verification Code
                        </label>
                        <input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-center text-3xl tracking-[0.5em] font-mono"
                          placeholder="000000"
                          maxLength={6}
                          {...verifyForm.register("otp")}
                        />
                        {verifyForm.formState.errors.otp && (
                          <p className="text-xs text-red-400 text-center mt-1">{verifyForm.formState.errors.otp.message}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <input
                          type="checkbox"
                          id="remember"
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                          {...verifyForm.register("remember_me")}
                        />
                        <label htmlFor="remember" className="text-sm text-white/60">Keep me signed in</label>
                      </div>

                      <button
                        type="submit"
                        disabled={verifyOtpMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 mt-4"
                      >
                        {verifyOtpMutation.isPending && <LoaderCircle className="h-5 w-5 animate-spin" />}
                        Verify & Continue
                      </button>

                      <button
                        type="button"
                        className="w-full px-4 py-3 text-sm text-white/50 hover:text-white transition-all text-center mt-2"
                        onClick={() => setPhase("request")}
                      >
                        ← Use another email
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
