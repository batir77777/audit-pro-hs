import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';

export default function ResetPassword() {
    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [sent, setSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: 'https://audit-pro-hs.vercel.app/update-password',
                });
                if (resetError) throw resetError;
                setSent(true);
        } catch (err: any) {
                setError(err.message || 'Failed to send reset email.');
        } finally {
                setLoading(false);
        }
  };

  return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
              <div className="w-full max-w-md">
                      <div className="flex flex-col items-center mb-8">
                                <Logo size="lg" className="mb-6 shadow-2xl rotate-[-2deg]" />
                                <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Safety is the Key Ltd</p>p>
                                <p className="text-slate-500 mt-1 font-medium tracking-widest uppercase text-[10px]">Health &amp; Safety Management</p>p>
                      </div>div>
              
                      <Card className="border-none shadow-xl">
                                <CardHeader>
                                            <CardTitle className="text-lg font-black uppercase tracking-widest">Reset Password</CardTitle>CardTitle>
                                            <CardDescription className="font-medium">
                                                          Enter your email address and we will send you a password reset link.
                                            </CardDescription>CardDescription>
                                </CardHeader>CardHeader>
                      
                        {sent ? (
                      <CardContent className="space-y-4 pt-2">
                                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-xl">
                                                    Reset link sent. Check your email and follow the link to set a new password.
                                    </div>div>
                      </CardContent>CardContent>
                    ) : (
                      <form onSubmit={handleSubmit}>
                                    <CardContent className="space-y-4 pt-2">
                                      {error && (
                                          <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
                                            {error}
                                          </div>div>
                                                    )}
                                                    <div className="space-y-2">
                                                                      <Label htmlFor="reset-email" className="uppercase text-[10px] font-bold tracking-widest">Email</Label>Label>
                                                                      <div className="relative">
                                                                                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                                          <Input
                                                                                                                  id="reset-email"
                                                                                                                  type="email"
                                                                                                                  placeholder="name@company.co.uk"
                                                                                                                  className="pl-10 border-slate-200"
                                                                                                                  value={email}
                                                                                                                  onChange={(e) => setEmail(e.target.value)}
                                                                                                                  required
                                                                                                                  autoComplete="email"
                                                                                                                />
                                                                      </div>div>
                                                    </div>div>
                                    </CardContent>CardContent>
                                    <CardFooter className="flex flex-col gap-3">
                                                    <Button
                                                                        className="w-full bg-sitk-yellow text-sitk-black hover:bg-sitk-yellow/90 font-black uppercase tracking-widest py-6 shadow-lg"
                                                                        type="submit"
                                                                        disabled={loading}
                                                                      >
                                                      {loading ? 'Sending...' : 'Send Reset Link'}
                                                    </Button>Button>
                                    </CardFooter>CardFooter>
                      </form>form>
                                )}
                      </Card>Card>
              
                      <div className="text-center mt-6">
                                <Link to="/login" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700">
                                            Back to Sign In
                                </Link>Link>
                      </div>div>
              
                      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-8">
                                &copy; 2024 Safety is the Key Ltd. All Rights Reserved.
                      </p>p>
              </div>div>
        </div>div>
      );
}</div>
