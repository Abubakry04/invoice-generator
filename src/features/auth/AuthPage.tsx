import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  Layers,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import logoImg from '../../assets/logo3.png';

export const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  const navigate = useNavigate();
  const toast = useToast();
  const { login, register } = useAuthStore();

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (mode === 'register') {
        if (!name.trim() || !email.trim() || !businessName.trim()) {
          toast.error('Please fill in all registration fields.');
          setIsLoading(false);
          return;
        }

        register({
          name: name.trim(),
          email: email.trim(),
          businessName: businessName.trim(),
          password,
        });

        toast.success(`Welcome to EgolePay, ${name.trim()}! Your workspace has been initialized.`);
      } else {
        if (!email.trim()) {
          toast.error('Please enter your email address.');
          setIsLoading(false);
          return;
        }

        login(email.trim(), password);
        toast.success('Signed in successfully.');
      }

      setIsLoading(false);
      navigate('/');
    }, 600);
  };

  const handleQuickDemoLogin = (demoEmail: string, demoName: string) => {
    setIsLoading(true);
    setTimeout(() => {
      login(demoEmail);
      setIsLoading(false);
      toast.success(`Signed in as ${demoName}`);
      navigate('/');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Left Side: SaaS Value Proposition & Brand Banner */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950 text-white p-10 flex-col justify-between relative overflow-hidden">
          {/* Background Decorative Rings */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#FF7916]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 mb-10">
              <img src={logoImg} alt="EgolePay" className="h-9 w-auto object-contain brightness-110" />
              <span className="text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-[#FF7916] text-white">
                SaaS
              </span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-white leading-snug">
              Smart billing, instant payments, and automated accounting.
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              The modern billing software for high-performing freelancers, agencies, and fast-growing businesses.
            </p>

            {/* Feature bullets */}
            <div className="mt-8 space-y-4 text-xs text-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#FF7916]/20 border border-[#FF7916]/40 text-[#FF7916] flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>Generate and dispatch PDF invoices in under 60 seconds</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#FF7916]/20 border border-[#FF7916]/40 text-[#FF7916] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Public payment links with card and online bank settlement</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#FF7916]/20 border border-[#FF7916]/40 text-[#FF7916] flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span>Real-time cloud sync with automatic offline-first backup</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-xs text-slate-400">
            <span>© 2026 EgolePay Inc. All rights reserved.</span>
          </div>
        </div>

        {/* Right Side: Authentication / Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Mobile Logo Header */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <img src={logoImg} alt="EgolePay" className="h-7 w-auto object-contain" />
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-orange-100 text-[#FF7916]">
              SaaS
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => handleToggleMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Heading */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {mode === 'register' ? 'Set up your workspace' : 'Welcome back'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'register'
                ? 'Create your free EgolePay account and start sending invoices today.'
                : 'Enter your credentials to access your billing dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Business Name (Register only) */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white pl-9 focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Workspace Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Apex Design Studio"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white pl-9 focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white pl-9 focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => toast.info('Password reset instructions sent to your email.')}
                    className="text-[11px] text-[#FF7916] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white pl-9 pr-10 focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#FF7916] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-bold text-xs shadow-md shadow-[#FF7916]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{mode === 'register' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'register' ? 'Create Free Workspace' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sign-Ins */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              Instant Demo Access
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('alex@egolepay.io', 'Alex Morgan (Pro)')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] flex items-center justify-center font-bold text-[10px]">
                  P
                </div>
                <div className="truncate min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">Alex Morgan</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Pro Plan Account</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sarah@freelance.dev', 'Sarah Jenkins (Starter)')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                  S
                </div>
                <div className="truncate min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">Sarah Jenkins</p>
                  <p className="text-[10px] text-slate-500 font-medium">Starter Plan</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

