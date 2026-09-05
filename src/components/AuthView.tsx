import { useState, type FormEvent } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { ShieldCheck, Users, CheckCircle2, Lock, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

export function AuthView() {
  const { login, register, demoSwitch } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await register(name, email, password, confirmPassword);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (userEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await demoSwitch(userEmail);
    } catch (err: any) {
      setError(err.message || 'Failed to switch demo user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shadow-xl shadow-indigo-500/20 mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">CollabBoard</h1>
        <p className="text-sm text-white/60 mt-1.5">Multi-Tenant Team Task Management Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="backdrop-blur-2xl bg-white/10 border border-white/15 py-8 px-6 sm:px-8 shadow-2xl rounded-3xl">
          <div className="flex border-b border-white/15 mb-6">
            <button
              id="tab-login"
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors border-b-2 ${
                mode === 'login'
                  ? 'border-indigo-400 text-white'
                  : 'border-transparent text-white/40 hover:text-white/80'
              }`}
            >
              Login
            </button>
            <button
              id="tab-signup"
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors border-b-2 ${
                mode === 'signup'
                  ? 'border-indigo-400 text-white'
                  : 'border-transparent text-white/40 hover:text-white/80'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div id="auth-error-message" className="mb-5 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-start gap-2 text-rose-200 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-300" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                  Full Name
                </label>
                <input
                  id="signup-name-input"
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Email Address
              </label>
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Password
              </label>
              <input
                id="auth-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="signup-confirm-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === 'login' ? (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Instant Demo Logins
              </span>
              <span className="text-xs text-indigo-300 font-medium">1-Click Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_USERS.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  id={`quick-demo-${u.name.toLowerCase()}`}
                  type="button"
                  onClick={() => handleDemoLogin(u.email)}
                  disabled={loading}
                  className="flex items-center justify-between p-2.5 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 text-left transition"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      {u.name}
                    </div>
                    <div className="text-[11px] text-white/50 truncate">{u.roleDesc}</div>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">login</span>
                </button>
              ))}
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-white/40 shrink-0" />
              <span>Password for all demo users is <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-indigo-200">password123</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
