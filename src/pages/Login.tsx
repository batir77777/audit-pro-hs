import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/authContext';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

  const [signInEmail, setSignInEmail] = React.useState('');
    const [signInPassword, setSignInPassword] = React.useState('');
    const [signInError, setSignInError] = React.useState<string | null>(null);
    const [signInLoading, setSignInLoading] = React.useState(false);
    const [showSignInPw, setShowSignInPw] = React.useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setSignInError(null);
        setSignInLoading(true);
        try {
                await login(signInEmail, signInPassword);
                navigate('/dashboard');
        } catch (err: any) {
                setSignInError(err.message || 'Sign in failed.');
        } finally {
                setSignInLoading(false);
        }
  };

  return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
              <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md"
                      >
                      <div className="flex flex-col items-center mb-8">
                                <Logo size="lg" className="mb-6 shadow-2xl rotate-[-2deg]" />
                                <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Safety is the Key Ltd</p>p>
                                <p className="text-slate-500 mt-1 font-medium tracking-widest uppercase text-[10px]">Health &amp; Safety Management</p>p>
                      </div>div>
              
                      <Card className="border-none shadow-xl">
                                <CardHeader className="pb-0">
                                            <CardTitle className="font-black uppercase text-[10px] tracking-widest text-center py-3">Sign In</CardTitle>CardTitle>
                                </CardHeader>CardHeader>
                                <form onSubmit={handleSignIn}>
                                            <CardContent className="space-y-4 pt-6">
                                                          <CardDescription className="text-center font-medium">
                                                                          Access your SITK safety platform
                                                          </CardDescription>CardDescription>
                                              {signInError && (
                                        <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
                                          {signInError}
                                        </div>div>
                                                          )}
                                                          <div className="space-y-2">
                                                                          <Label htmlFor="signin-email" className="uppercase text-[10px] font-bold tracking-widest">Email</Label>Label>
                                                                          <div className="relative">
                                                                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                                            <Input
                                                                                                                  id="signin-email"
                                                                                                                  type="email"
                                                                                                                  placeholder="name@company.co.uk"
                                                                                                                  className="pl-10 border-slate-200 focus:ring-sitk-yellow"
                                                                                                                  value={signInEmail}
                                                                                                                  onChange={(e) => setSignInEmail(e.target.value)}
                                                                                                                  required
                                                                                                                  autoComplete="email"
                                                                                                                />
                                                                          </div>div>
                                                          </div>div>
                                                          <div className="space-y-2">
                                                                          <Label htmlFor="signin-password" className="uppercase text-[10px] font-bold tracking-widest">Password</Label>Label>
                                                                          <div className="relative">
                                                                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                                            <Input
                                                                                                                  id="signin-password"
                                                                                                                  type={showSignInPw ? 'text' : 'password'}
                                                                                                                  className="pl-10 pr-10 border-slate-200 focus:ring-sitk-yellow"
                                                                                                                  value={signInPassword}
                                                                                                                  onChange={(e) => setSignInPassword(e.target.value)}
                                                                                                                  required
                                                                                                                  autoComplete="current-password"
                                                                                                                />
                                                                                            <button
                                                                                                                  type="button"
                                                                                                                  onClick={() => setShowSignInPw((v) => !v)}
                                                                                                                  className="absolute right-3 top-3 text-muted-foreground hover:text-slate-700"
                                                                                                                  tabIndex={-1}
                                                                                                                >
                                                                                                {showSignInPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                                              </button>button>
                                                                          </div>div>
                                                                          <div className="text-right">
                                                                                            <Link
                                                                                                                  to="/reset-password"
                                                                                                                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                                                                                                >
                                                                                                                Forgot your password?
                                                                                              </Link>Link>
                                                                          </div>div>
                                                          </div>div>
                                            </CardContent>CardContent>
                                            <CardFooter>
                                                          <Button
                                                                            className="w-full bg-sitk-yellow text-sitk-black hover:bg-sitk-yellow/90 font-black uppercase tracking-widest py-6 shadow-lg"
                                                                            type="submit"
                                                                            disabled={signInLoading}
                                                                          >
                                                            {signInLoading ? 'Signing in...' : 'Sign in to Platform'}
                                                          </Button>Button>
                                            </CardFooter>CardFooter>
                                </form>form>
                      </Card>Card>
              
                      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-12">
                                &copy; 2024 Safety is the Key Ltd. All Rights Reserved.
                      </p>p>
              </motion.div>motion.div>
        </div>div>
      );
}</div>
