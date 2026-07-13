import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  const { loginUser, registerUser } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Navbar / Logo area for the page */}
      <div className="w-full max-w-[1200px] absolute top-8 left-0 right-0 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">Perk / MusterMate</h1>
      </div>

      <div className="w-full max-w-[480px]">
        
        {/* Branding header */}
        <div className="mb-12 text-center">
          <h2 className="text-[60px] leading-[1] tracking-[-1.8px] font-medium text-foreground mb-4">
            Welcome<br/>back.
          </h2>
          <p className="text-[16px] text-muted-foreground font-medium">Enter your credentials to access the command center.</p>
        </div>

        {/* Parallax Card Container */}
        <Card className="w-full p-[48px] bg-background border border-border rounded-[28px] shadow-none space-y-10">
          
          {/* Tab Selector - Underline Link Style */}
          <div className="flex gap-6 border-b border-border">
            <button
              onClick={() => setIsLogin(true)}
              className={`py-3 text-[16px] font-medium transition-all ${
                isLogin 
                  ? 'text-foreground border-b-[3px] border-foreground' 
                  : 'text-muted-foreground hover:text-foreground border-b-[3px] border-transparent'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`py-3 text-[16px] font-medium transition-all ${
                !isLogin 
                  ? 'text-foreground border-b-[3px] border-foreground' 
                  : 'text-muted-foreground hover:text-foreground border-b-[3px] border-transparent'
              }`}
            >
              Register
            </button>
          </div>

          {isLogin ? (
            /* LOGIN FORM */
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-8">
              <div className="space-y-6">
                <Input
                  label="Login ID"
                  placeholder="owner@mustermate.com"
                  error={loginForm.formState.errors.loginId?.message}
                  {...loginForm.register('loginId')}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password')}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="w-full"
                size="lg"
              >
                Log in
              </Button>

              {/* Quick Demo Info Alert */}
              <div className="pt-8 border-t border-border space-y-4">
                <span className="inline-block bg-muted px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-[0.1em] text-foreground border border-border">
                  Demo Credentials
                </span>
                <ul className="text-[14px] text-muted-foreground font-medium space-y-3">
                  <li className="flex justify-between border-b border-border pb-2"><span>Owner</span> <span className="text-foreground">owner123</span></li>
                  <li className="flex justify-between"><span>Supervisor</span> <span className="text-foreground">super123</span></li>
                </ul>
              </div>
            </form>
          ) : (
            /* OWNER REGISTRATION FORM */
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-8">
              <div className="space-y-6">
                <span className="inline-block bg-muted px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-[0.1em] text-foreground border border-border">
                  1. Profile Details
                </span>
                
                <Input
                  label="Full Name"
                  placeholder="Rajesh Singhania"
                  error={registerForm.formState.errors.name?.message}
                  {...registerForm.register('name')}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="name@firm.com"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register('email')}
                />

                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  error={registerForm.formState.errors.phone?.message}
                  {...registerForm.register('phone')}
                />

                <Input
                  label="Set Password"
                  type="password"
                  placeholder="Create Password"
                  error={registerForm.formState.errors.password?.message}
                  {...registerForm.register('password')}
                />
              </div>

              <div className="w-full h-px bg-border my-8" />

              <div className="space-y-6">
                <span className="inline-block bg-muted px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-[0.1em] text-foreground border border-border">
                  2. Organization
                </span>
                
                <Input
                  label="Organization / Firm Name"
                  placeholder="Singhania Infrastructures Ltd."
                  error={registerForm.formState.errors.organizationName?.message}
                  {...registerForm.register('organizationName')}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="w-full mt-8"
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
