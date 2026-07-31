import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAppStore } from '../../store/useAppStore';
import { HardHat, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Eyebrow } from '../../components/ui/Eyebrow';

const loginSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().min(2, 'Organization Name must be at least 2 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const AuthPage = () => {
  const { loginUser, registerUser, currentUser } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoMeta, setDemoMeta] = useState<{
    enabled: boolean;
    organizationName: string;
    accounts: { label: string; email: string; password: string }[];
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    let active = true;
    fetch('/api/meta/demo')
      .then(res => res.json())
      .then((data) => {
        if (active) setDemoMeta(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginId: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      organizationName: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    await loginUser(data.loginId, data.password);
    setLoading(false);
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    await registerUser(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-just-black text-surface-cream relative flex flex-col items-center justify-center p-6 overflow-hidden">

      {/* Ambient gradient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-shockingly-green/[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[55%] h-[65%] rounded-full bg-lilac/[0.06] blur-[120px] pointer-events-none" />

      {/* Decorative organic gradient blobs */}
      <div className="absolute top-[8%] right-[6%] w-40 h-40 rounded-full opacity-40 blur-2xl pointer-events-none"
        style={{ background: 'linear-gradient(114.41deg, #fec5fb 0%, #00bae2 100%)' }} />
      <div className="absolute bottom-[12%] left-[8%] w-48 h-48 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'linear-gradient(114.41deg, #ff8709 0%, #abff84 100%)' }} />

      {/* Navbar / Logo area for the page */}
      <div className="w-full max-w-7xl px-6 md:px-8 flex justify-between items-center mb-10 lg:absolute lg:top-8 lg:left-0 lg:right-0 lg:mx-auto">
        <h1 className="text-[12px] font-bold uppercase tracking-widest text-surface-cream flex items-center gap-2">
          <HardHat className="w-4 h-4 text-shockingly-green" />
          Perk / <span className="text-shockingly-green">Muster</span>Mate
        </h1>
      </div>

      <div className="w-full max-w-[460px] z-10">

        {/* Branding header */}
        <div className="mb-12 text-center">
          <Eyebrow text="command center" color="text-shockingly-green" />
          <h2 className="mt-4 text-[clamp(44px,9vw,96px)] font-semibold tracking-[-0.03em] leading-[0.95] text-surface-cream">
            Welcome<br />back.
          </h2>
          <p className="text-[13px] font-medium text-surface-50 uppercase tracking-widest mt-6">Enter your credentials to access the command center</p>
        </div>

        {/* Card Container */}
        <Card className="w-full p-8 sm:p-10 bg-off-black border border-border rounded-[8px] space-y-8">

          {/* Tab Selector - Underline Link Style */}
          <div className="flex gap-6 border-b border-border">
            <button
              onClick={() => setIsLogin(true)}
              className={`pb-3 text-[13px] uppercase tracking-wider font-semibold transition-all border-b-2 ${
                isLogin
                  ? 'text-surface-cream border-surface-cream'
                  : 'text-surface-50 hover:text-surface-cream border-transparent'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`pb-3 text-[13px] uppercase tracking-wider font-semibold transition-all border-b-2 ${
                !isLogin
                  ? 'text-surface-cream border-surface-cream'
                  : 'text-surface-50 hover:text-surface-cream border-transparent'
              }`}
            >
              Register
            </button>
          </div>

          {isLogin ? (
            /* LOGIN FORM */
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <div className="space-y-5">
                <Input
                  label="Login ID"
                  placeholder="you@example.com"
                  error={loginForm.formState.errors.loginId?.message}
                  {...loginForm.register('loginId')}
                  className="h-12"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password')}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="w-full h-12 font-semibold text-xs"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Log in
              </Button>

              {/* Quick Demo Info Alert */}
              {demoMeta?.enabled && (
                <div className="pt-8 border-t border-border space-y-4">
                  <span className="inline-block bg-muted px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-surface-cream border border-border">
                    Demo Credentials · {demoMeta.organizationName}
                  </span>
                  <ul className="text-[11px] text-surface-50 font-semibold uppercase tracking-wider space-y-3">
                    {demoMeta.accounts.map((acc) => (
                      <li key={acc.email} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                        <span>{acc.label}</span>
                        <span className="text-shockingly-green font-semibold text-right break-all">{acc.email} · {acc.password}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          ) : (
            /* OWNER REGISTRATION FORM */
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
              <div className="space-y-5">
                <span className="inline-block bg-muted px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-surface-cream border border-border">
                  1. Profile Details
                </span>

                <Input
                  label="Full Name"
                  placeholder="Your Full Name"
                  error={registerForm.formState.errors.name?.message}
                  {...registerForm.register('name')}
                  className="h-12"
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="name@firm.com"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register('email')}
                  className="h-12"
                />

                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  error={registerForm.formState.errors.phone?.message}
                  {...registerForm.register('phone')}
                  className="h-12"
                />

                <Input
                  label="Set Password"
                  type="password"
                  placeholder="Create Password"
                  error={registerForm.formState.errors.password?.message}
                  {...registerForm.register('password')}
                  className="h-12"
                />
              </div>

              <div className="w-full h-px bg-border my-6" />

              <div className="space-y-5">
                <span className="inline-block bg-muted px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-surface-cream border border-border">
                  2. Organization
                </span>

                <Input
                  label="Organization / Firm Name"
                  placeholder="Singhania Infrastructures Ltd."
                  error={registerForm.formState.errors.organizationName?.message}
                  {...registerForm.register('organizationName')}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="w-full h-12 font-semibold text-xs"
                size="lg"
              >
                Create Account
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
