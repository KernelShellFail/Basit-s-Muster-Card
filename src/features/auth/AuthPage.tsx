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
  ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

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
  };

  return (
    <div className="min-h-screen bg-pure-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 md:p-12 space-y-10 border border-ash bg-off-white-canvas">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[28px] bg-electric-lime text-off-black-ink mb-4">
            <HardHat className="w-8 h-8" />
          </div>
          <h2 className="text-[28px] font-medium tracking-[-0.03em] text-off-black-ink">MusterMate</h2>
          <p className="text-[16px] text-graphite">Labour Muster & Verification</p>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-pure-white border border-ash rounded-full">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-full text-[14px] font-medium transition-colors ${
              isLogin 
                ? 'bg-electric-lime text-off-black-ink' 
                : 'text-graphite hover:bg-off-white-canvas hover:text-off-black-ink'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-full text-[14px] font-medium transition-colors ${
              !isLogin 
                ? 'bg-electric-lime text-off-black-ink' 
                : 'text-graphite hover:bg-off-white-canvas hover:text-off-black-ink'
            }`}
          >
            Register Owner
          </button>
        </div>

        {isLogin ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Login ID"
                icon={<User className="w-5 h-5" />}
                placeholder="e.g. owner@mustermate.com"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                icon={<Lock className="w-5 h-5" />}
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              {loading ? 'Validating...' : 'Log In'}
              <ArrowRight className="w-5 h-5" />
            </Button>

            {/* Quick Demo Info Alert */}
            <div className="p-4 rounded-[18px] bg-pure-white border border-ash text-[12px] text-graphite leading-relaxed space-y-2">
              <p className="font-medium text-off-black-ink flex items-center gap-1.5 uppercase tracking-[0.1em]">
                <ShieldAlert className="w-5 h-5 shrink-0 text-electric-lime" />
                Demo Setup
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Owner: owner@mustermate.com / owner123</li>
                <li>Supervisor: satish@mustermate.com / super123</li>
                <li>Labour: WRK-2026-001 / labour123</li>
              </ul>
            </div>
          </form>
        ) : (
          /* OWNER REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-8">
            
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 bg-pure-white border border-ash rounded-full text-[10px] font-medium uppercase tracking-[0.1em] text-off-black-ink">
                1. Owner Profile
              </span>
              
              <Input
                label="Full Name"
                icon={<User className="w-5 h-5" />}
                placeholder="e.g. Rajesh Singhania"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  icon={<Mail className="w-5 h-5" />}
                  placeholder="e.g. name@firm.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  icon={<Phone className="w-5 h-5" />}
                  placeholder="e.g. +91 98765 43210"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Set Password"
                type="password"
                icon={<Lock className="w-5 h-5" />}
                placeholder="Create Password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>

            <div className="h-px bg-ash w-full" />

            <div className="space-y-4">
              <span className="inline-block px-3 py-1 bg-pure-white border border-ash rounded-full text-[10px] font-medium uppercase tracking-[0.1em] text-off-black-ink">
                2. Company Profile
              </span>
              
              <Input
                label="Organization / Firm Name"
                icon={<Building className="w-5 h-5" />}
                placeholder="e.g. Singhania Infrastructures Ltd."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              {loading ? 'Creating Account...' : 'Register Company'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>
        )}

      </Card>
    </div>
  );
};
