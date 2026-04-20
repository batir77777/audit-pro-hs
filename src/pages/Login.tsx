import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'motion/react';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/authContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Sign In state
  const [signInEmail, setSignInEmail] = React.useState('');
  const [signInPassword, setSignInPassword] = React.useState('');
  const [signInError, setSignInError] = React.useState('');
  const [signInLoading, setSignInLoading] = React.useState(false);
  const [showSignInPw, setShowSignInPw] = React.useState(false);

  // Sign Up state
  const [signUpName, setSignUpName] = React.useState('');
  const [signUpEmail, setSignUpEmail] = React.useState('');
  const [signUpPassword, setSignUpPassword] = React.useState('');
  const [signUpConfirm, setSignUpConfirm] = React.useState('');
  const [signUpError, setSignUpError] = React.useState('');
  const [signUpLoading, setSignUpLoading] = React.useState(false);
  const [showSignUpPw, setShowSignUpPw] = React.useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setSignInLoading(true);
    try {
      await login(signInEmail, signInPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setSignInError(err.message ?? 'Sign in failed.');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    if (signUpName.trim().length < 2) {
      setSignUpError('Please enter your full name.');
      return;
    }
    if (signUpPassword.length < 8) {
      setSignUpError('Password must be at least 8 characters.');
      return;
    }
    if (signUpPassword !== signUpConfirm) {
      setSignUpError('Passwords do not match.');
      return;
    }

    setSignUpLoading(true);
    try {
      await register(signUpName, signUpEmail, signUpPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setSignUpError(err.message ?? 'Registration failed.');
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-6 shadow-2xl rotate-[-2deg]" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Safety is the Key Ltd</h1>
          <p className="text-slate-500 mt-1 font-medium tracking-widest uppercase text-[10px]">Health & Safety Management</p>
        </div>

        <Card className="border-none shadow-xl">
          <Tabs defaultValue="signin">
            <CardHeader className="pb-0">
              <TabsList className="w-full bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="signin" className="flex-1 font-black uppercase text-[10px] tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1 font-black uppercase text-[10px] tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Create Account
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Sign In */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4 pt-6">
                  <CardDescription className="text-center font-medium">
                    Access your SITK safety platform
                  </CardDescription>

                  {signInError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
                      {signInError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="uppercase text-[10px] font-bold tracking-widest">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="name@company.co.uk"
                        className="pl-10 border-slate-200 focus:ring-sitk-yellow"
                        value={signInEmail}
                        onChange={e => setSignInEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="uppercase text-[10px] font-bold tracking-widest">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showSignInPw ? 'text' : 'password'}
                        className="pl-10 pr-10 border-slate-200 focus:ring-sitk-yellow"
                        value={signInPassword}
                        onChange={e => setSignInPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPw(v => !v)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-slate-700"
                        tabIndex={-1}
                      >
                        {showSignInPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-sitk-yellow text-sitk-black hover:bg-sitk-yellow/90 font-black uppercase tracking-widest py-6 shadow-lg"
                    type="submit"
                    disabled={signInLoading}
                  >
                    {signInLoading ? 'Signing in...' : 'Sign in to Platform'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-6">
                  <CardDescription className="text-center font-medium">
                    Create your account to get started
                  </CardDescription>

                  {signUpError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
                      {signUpError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="uppercase text-[10px] font-bold tracking-widest">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jane Smith"
                        className="pl-10 border-slate-200 focus:ring-sitk-yellow"
                        value={signUpName}
                        onChange={e => setSignUpName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="uppercase text-[10px] font-bold tracking-widest">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@company.co.uk"
                        className="pl-10 border-slate-200 focus:ring-sitk-yellow"
                        value={signUpEmail}
                        onChange={e => setSignUpEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="uppercase text-[10px] font-bold tracking-widest">Password <span className="text-slate-400 normal-case font-medium tracking-normal">(min 8 chars)</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showSignUpPw ? 'text' : 'password'}
                        className="pl-10 pr-10 border-slate-200 focus:ring-sitk-yellow"
                        value={signUpPassword}
                        onChange={e => setSignUpPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPw(v => !v)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-slate-700"
                        tabIndex={-1}
                      >
                        {showSignUpPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="uppercase text-[10px] font-bold tracking-widest">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type={showSignUpPw ? 'text' : 'password'}
                        className="pl-10 border-slate-200 focus:ring-sitk-yellow"
                        value={signUpConfirm}
                        onChange={e => setSignUpConfirm(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-sitk-black text-white hover:bg-slate-800 font-black uppercase tracking-widest py-6 shadow-lg"
                    type="submit"
                    disabled={signUpLoading}
                  >
                    {signUpLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-12">
          &copy; 2024 Safety is the Key Ltd. All Rights Reserved.
        </p>
      </motion.div>
    </div>
  );
}

