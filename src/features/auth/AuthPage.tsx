import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAppStore } from '../../store/useAppStore';
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
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

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
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(190,255,80,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(190,255,80,0.04),transparent_60%)] pointer-events-none" />

      {/* Navbar / Logo area for the page */}
      <div className="w-full max-w-7xl px-6 md:px-8 flex justify-between items-center mb-10 lg:absolute lg:top-8 lg:left-0 lg:right-0 lg:mx-auto">
        <h1 className="text-[12px] font-black uppercase tracking-widest text-foreground">Perk / MusterMate</h1>
      </div>

      <div className="w-full max-w-[460px] z-10">
        
        {/* Branding header */}
        <div className="mb-10 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.15]">
            Welcome<br/>back.
          </h2>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-4">Enter your credentials to access the command center</p>
        </div>

        {/* Card Container */}
        <Card className="w-full p-8 sm:p-12 bg-gradient-to-br from-card via-card to-background border border-border/80 rounded-[32px] shadow-sm space-y-8">
          
          {/* Tab Selector - Underline Link Style */}
          <div className="flex gap-6 border-b border-border/50">
            <button
              onClick={() => setIsLogin(true)}
              className={`pb-3 text-[12px] uppercase tracking-wider font-bold transition-all border-b-2 ${
                isLogin 
                  ? 'text-foreground border-foreground' 
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`pb-3 text-[12px] uppercase tracking-wider font-bold transition-all border-b-2 ${
                !isLogin 
                  ? 'text-foreground border-foreground' 
                  : 'text-muted-foreground hover:text-foreground border-transparent'
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
                  placeholder="owner@mustermate.com"
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
                className="w-full h-12 shadow-sm font-bold text-xs"
                size="lg"
              >
                Log in
              </Button>

              {/* Quick Demo Info Alert */}
              <div className="pt-8 border-t border-border/50 space-y-4">
                <span className="inline-block bg-muted px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-foreground border border-border/80">
                  Demo Credentials
                </span>
                <ul className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider space-y-3">
                  <li className="flex justify-between border-b border-border/50 pb-2"><span>Owner</span> <span className="text-foreground font-bold">owner123</span></li>
                  <li className="flex justify-between"><span>Supervisor</span> <span className="text-foreground font-bold">super123</span></li>
                </ul>
              </div>
            </form>
          ) : (
            /* OWNER REGISTRATION FORM */
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
              <div className="space-y-5">
                <span className="inline-block bg-muted px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-foreground border border-border/80">
                  1. Profile Details
                </span>
                
                <Input
                  label="Full Name"
                  placeholder="Rajesh Singhania"
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

              <div className="w-full h-px bg-border/50 my-6" />

              <div className="space-y-5">
                <span className="inline-block bg-muted px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-foreground border border-border/80">
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
                className="w-full h-12 shadow-sm font-bold text-xs"
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
