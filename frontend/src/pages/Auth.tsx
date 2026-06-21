import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, Phone, Key, HelpCircle, HardHat, CheckCircle2 } from 'lucide-react';

export default function Auth() {
  const { login, signup, sendOtp } = useAuth();
  
  const [isSignup, setIsSignup] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(companyName, gstin, name, email, password, 'Company Owner');
      } else {
        if (authMode === 'password') {
          await login(email, password, false);
        } else {
          if (!otpSent) {
            const res = await sendOtp(phone);
            setOtpSent(true);
            setInfo(res.message);
            setLoading(false);
            return;
          } else {
            await login(phone, '', true, otp);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await login('owner@buildflow.in', 'admin123'); // Bypass mock login
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans transition-colors duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Column: Premium SaaS Info panel */}
        <div className="flex-1 bg-zinc-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-zinc-900 to-zinc-950 z-0" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <span className="text-white font-extrabold text-base tracking-tighter">B</span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight">BuildFlow AI</h1>
            </div>
            
            <div className="space-y-6 mt-16 max-w-sm">
              <h2 className="text-3xl font-extrabold leading-tight">Construction Management, Simplified.</h2>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Connect your engineers, site workers, stock records, and financial books inside an enterprise-grade cloud workspace. Replace paper registers, WhatsApp chat spam, and manual calculations.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4 mt-8">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-[10px] font-bold text-zinc-300">GST-Ready Billing & Vendor Portals</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-[10px] font-bold text-zinc-300">GPS Site Check-ins & UPI Payroll integrations</p>
            </div>
          </div>

          <p className="relative z-10 text-[9px] text-zinc-500 font-medium tracking-wider uppercase">
            © 2026 BuildFlow AI. Engineered for Contractors in India.
          </p>
        </div>

        {/* Right Column: Form fields inputs */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">
                {isSignup ? 'Create Company Account' : 'Welcome to BuildFlow AI'}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {isSignup ? 'Register your construction enterprise to start.' : 'Access your site dashboards and financial ledgers.'}
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            {info && (
              <div className="bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-4 py-2.5 rounded-xl">
                {info}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Owner Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Rajesh Sharma"
                        className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2.5 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Company Name</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="e.g. Shiva Builders"
                        className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2.5 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Company GSTIN</label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={e => setGstin(e.target.value)}
                      placeholder="e.g. 27AAAAA1111A1Z1 (Optional)"
                      className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2.5 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Work Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. contact@shiva.in"
                      className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2.5 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2.5 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                </>
              ) : (
                <>
                  {authMode === 'password' ? (
                    <>
                      <div>
                        <div className="flex justify-between">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
                          <button
                            type="button"
                            onClick={() => setAuthMode('otp')}
                            className="text-[10px] text-primary font-bold hover:underline"
                          >
                            Use OTP verification
                          </button>
                        </div>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="e.g. owner@buildflow.in"
                            className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Password</label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Try admin123"
                            className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile Phone Number</label>
                          <button
                            type="button"
                            onClick={() => setAuthMode('password')}
                            className="text-[10px] text-primary font-bold hover:underline"
                          >
                            Use Email Password
                          </button>
                        </div>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="10-digit Indian Mobile Number"
                            className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          />
                        </div>
                      </div>
                      {otpSent && (
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Verify SMS OTP Code</label>
                          <div className="relative mt-1">
                            <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              required
                              value={otp}
                              onChange={e => setOtp(e.target.value)}
                              placeholder="Enter 6-digit code (Use 123456)"
                              className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/95 disabled:opacity-40 text-white font-bold text-xs py-3 rounded-xl transition-all duration-150 shadow-lg shadow-primary/20 flex items-center justify-center"
              >
                {loading ? 'Authenticating transaction...' : isSignup ? 'Register Company' : otpSent ? 'Verify OTP & Enter' : authMode === 'otp' ? 'Send OTP Verification' : 'Login'}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink mx-4 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">or login with</span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full border border-border hover:bg-muted bg-background text-foreground font-bold text-xs py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.99 0 12 0 7.35 0 3.37 2.67 1.48 6.56l3.86 3C6.26 6.94 8.94 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z"/>
                <path fill="#FBBC05" d="M5.34 9.56c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.48 1.98C.54 3.89 0 6.04 0 8.27s.54 4.38 1.48 6.29l3.86-3z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.73-2.89c-1.03.69-2.35 1.11-4.23 1.11-3.06 0-5.74-1.9-6.66-4.52l-3.86 3C3.37 21.33 7.35 24 12 24z"/>
              </svg>
              Google Workspace Account
            </button>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setInfo('');
                }}
                className="text-xs text-primary font-bold hover:underline"
              >
                {isSignup ? 'Already have an account? Sign in.' : "Don't have an account? Sign up today."}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
