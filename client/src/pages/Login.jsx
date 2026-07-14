import React, { useMemo, useState } from 'react';
import api from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import AviationSidePanel from '../components/AviationSidePanel';
import PublicSupportChat from '../components/PublicSupportChat';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const activeRole = useMemo(() => {
    const value = email.toLowerCase();
    if (value.includes('admin')) return 'Admin';
    if (value.includes('manager')) return 'Manager';
    if (value.includes('instructor')) return 'Instructor';
    if (value.includes('student')) return 'Student';
    return 'Dashboard';
  }, [email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/login', { email, password });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);

      if (res.data.user.role.toLowerCase() === 'student') {
        navigate('/student-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7fbff_0%,#eef5fb_48%,#f7fafc_100%)] text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AviationSidePanel
          asideClassName="lg:block lg:w-[42%]"
          contentClassName="relative flex h-full flex-col justify-between p-10 xl:p-14"
        >
          <div className="w-full space-y-6 text-white">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-sm">
                <img
                  src="/aeroconsult_logo.jpg"
                  alt="Aeroconsult logo"
                  className="h-10 w-10 rounded-full border border-white/30 object-cover shadow-sm"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                    Aeroconsult Ltd.
                  </p>
                  <p className="text-sm font-bold tracking-tight text-white">Dashboard Access</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/20 bg-black/15 p-6 text-white backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  Login
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                     Access your Aerconsult Ltd. Dashboard
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
                      You are just one step away! Continue into your portal with your Aeroconsult account credentials.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AviationSidePanel>

        <main className="flex w-full flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:w-[58%] lg:px-10 xl:px-14">
          <div className="w-full max-w-xl">
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[#2095D3]"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <div className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8 xl:p-10">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Dashboard Login</p>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 text-slate-800 outline-none transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 pr-12 text-slate-800 outline-none transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2095D3] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(32,149,211,0.28)] transition-all hover:bg-[#167CB3] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[180px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Signing in
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                Having trouble signing in? Contact the Aeroconsult admin office.
              </p>
            </div>
          </div>
        </main>
      </div>
      <PublicSupportChat />
    </div>
  );
};

export default Login;
