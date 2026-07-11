import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { showToast } from '../../components/Toast';
import { 
  Building, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  ShieldAlert, 
  HardHat,
  ArrowRight,
  UserSquare2
} from 'lucide-react';

export const AuthPage = () => {
  const { loginUser, registerUser } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);

  // Login States
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register (Owner Only) States
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [orgName, setOrgName] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !loginPassword) {
      showToast('Please enter your login ID and password.', 'warning');
      return;
    }

    setLoading(true);
    const success = await loginUser(loginId, loginPassword);
    setLoading(false);
    
    if (success) {
      // Toast and redirect are handled inside store action
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerPhone || !registerPassword || !orgName) {
      showToast('Name, Phone, Password, and Organization Name are required!', 'warning');
      return;
    }

    setLoading(true);
    const success = await registerUser({
      name: registerName,
      email: registerEmail,
      phone: registerPhone,
      password: registerPassword,
      organizationName: orgName
    });
    setLoading(false);

    if (success) {
      // Handled in store
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Visual Background Aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-safety-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md rounded-3xl bg-slate-800/80 border border-slate-700/60 backdrop-blur-xl shadow-2xl overflow-hidden p-8 space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-safety-500 text-slate-950 font-black shadow-lg">
            <HardHat className="w-8 h-8" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">MusterMate</h2>
          <p className="text-xs text-slate-400">Labour Muster Management & Verification Portal</p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setIsLogin(true)}
            className={`py-2 rounded-lg transition-all ${
              isLogin 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Staff & Labour Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`py-2 rounded-lg transition-all ${
              !isLogin 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Owner
          </button>
        </div>

        {isLogin ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Login ID (Email, Phone, or Worker ID)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. owner@mustermate.com or WRK-2026-001"
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-safety-500 focus:outline-none outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-safety-500 focus:outline-none outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-slate-950 bg-safety-500 hover:bg-safety-600 transition-colors shadow-md mt-6 disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Log In Session'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Info Alert */}
            <div className="p-3.5 rounded-xl border border-slate-750 bg-slate-900/60 text-[10px] text-slate-400 leading-normal space-y-1.5 mt-4">
              <p className="font-bold text-safety-500 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                Demo Credentials Setup
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Owner: <code className="text-white">owner@mustermate.com</code> / <code className="text-white">owner123</code></li>
                <li>Supervisor: <code className="text-white">satish@mustermate.com</code> / <code className="text-white">super123</code></li>
                <li>Labour link: <code className="text-white">WRK-2026-001</code> / <code className="text-white">labour123</code></li>
              </ul>
            </div>
          </form>
        ) : (
          /* OWNER REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-safety-500 uppercase tracking-wider block mb-1">1. Owner Profile</h4>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="e.g. Rajesh Singhania"
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-safety-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="e.g. name@firm.com"
                      className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Set Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Create Password"
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-safety-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-750">
              <h4 className="text-[10px] font-bold text-safety-500 uppercase tracking-wider block mb-1">2. Company Profile</h4>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Organization / Firm Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Singhania Infrastructures Ltd."
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-safety-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-slate-950 bg-safety-500 hover:bg-safety-600 transition-colors shadow-md mt-6 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register Company & Owner'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
