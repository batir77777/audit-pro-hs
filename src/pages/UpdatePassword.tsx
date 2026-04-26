import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';

export default function UpdatePassword() {
    const navigate = useNavigate();
    const [password, setPassword] = React.useState('');
    const [confirm, setConfirm] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [done, setDone] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
                setError('Password must be at least 8 characters.');
                return;
        }
        if (password !== confirm) {
                setError('Passwords do not match.');
                return;
        }

        setLoading(true);
        try {
                const { error: updateError } = await supabase.auth.updateUser({ password });
                if (updateError) throw updateError;
                setDone(true);
                // Sign out so user logs in fresh with new password
          await supabase.auth.signOut();
                setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
                setError(err.message || 'Failed to update password.');
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
                                            <CardTitle className="text-lg font-black uppercase tracking-widest">Set New Password</CardTitle>CardTitle>
                                            <CardDescription className="font-medium">
                                                          Enter your new password below.
                                            </CardDescription>CardDescription>
                                </CardHeader>CardHeader>
                      
                        {done ? (
                      <CardContent className="space-y-4 pt-2">
                                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-xl">
                                                    Password updated successfully. Redirecting you to sign in...
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
                                                                      <Label htmlFor="new-password" className="uppercase text-[10px] font-bold tracking-widest">New Password</Label>Label>
                                                                      <div className="relative">
                                                                                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                                          <Input
                                                                                                                  id="new-password"
                                                                                                                  type="password"
                                                                                                                  placeholder="Minimum 8 characters"
                                                                                                                  className="pl-10 border-slate-200"
                                                                                                                  value={password}
                                                                                                                  onChange={(e) => setPassword(e.target.value)}
                                                                                                                  required
                                                                                                                  autoComplete="new-password"
                                                                                                                />
                                                                      </div>div>
                                                    </div>div>
                                                    <div className="space-y-2">
                                                                      <Label htmlFor="confirm-password" className="uppercase text-[10px] font-bold tracking-widest">Confirm Password</Label>Label>
                                                                      <div className="relative">
                                                                                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                                          <Input
                                                                                                                  id="confirm-password"
                                                                                                                  type="password"
                                                                                                                  placeholder="Repeat new password"
                                                                                                                  className="pl-10 border-slate-200"
                                                                                                                  value={confirm}
                                                                                                                  onChange={(e) => setConfirm(e.target.value)}
                                                                                                                  required
                                                                                                                  autoComplete="new-password"
                                                                                                                />
                                                                      </div>div>
                                                    </div>div>
                                    </CardContent>CardContent>
                                    <CardFooter>
                                                    <Button
                                                                        className="w-full bg-sitk-yellow text-sitk-black hover:bg-sitk-yellow/90 font-black uppercase tracking-widest py-6 shadow-lg"
                                                                        type="submit"
                                                                        disabled={loading}
                                                                      >
                                                      {loading ? 'Updating...' : 'Set New Password'}
                                                    </Button>Button>
                                    </CardFooter>CardFooter>
                      </form>form>
                                )}
                      </Card>Card>
              
                      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-8">
                                &copy; 2024 Safety is the Key Ltd. All Rights Reserved.
                      </p>p>
              </div>div>
        </div>div>
      );
}</div>
