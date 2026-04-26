import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Organisation {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminPanel() {
  const { currentUser, authLoading } = useAuth();

  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Wait for auth to finish loading before deciding access
  if (authLoading) return null;

  // Redirect non-super_admin users
  if (!currentUser || currentUser.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrgName(val);
    setOrgSlug(slugify(val));
  };

  const fetchOrgs = async () => {
    setLoadingOrgs(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('organisations')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setFetchError(error.message);
    } else {
      setOrgs(data ?? []);
    }
    setLoadingOrgs(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(false);
    if (!orgName.trim() || !orgSlug.trim()) return;
    setCreating(true);
    const { error } = await supabase
      .from('organisations')
      .insert({ name: orgName.trim(), slug: orgSlug.trim() });
    if (error) {
      setCreateError(error.message);
    } else {
      setCreateSuccess(true);
      setOrgName('');
      setOrgSlug('');
      fetchOrgs();
    }
    setCreating(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">Admin Panel</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Create Organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name" className="uppercase text-[10px] font-bold tracking-widest">Organisation Name</Label>
              <Input id="org-name" value={orgName} onChange={handleNameChange} placeholder="e.g. Acme Ltd" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug" className="uppercase text-[10px] font-bold tracking-widest">Slug</Label>
              <Input id="org-slug" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} placeholder="e.g. acme-ltd" required />
            </div>
            {createError && <p className="text-red-600 text-xs font-bold">{createError}</p>}
            {createSuccess && <p className="text-green-600 text-xs font-bold">Organisation created successfully.</p>}
            <Button type="submit" disabled={creating} className="bg-sitk-yellow text-sitk-black font-bold uppercase tracking-widest hover:bg-sitk-yellow/90">
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Organisations List</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOrgs && <p className="text-sm text-slate-500">Loading...</p>}
          {fetchError && <p className="text-red-600 text-xs font-bold">{fetchError}</p>}
          {!loadingOrgs && !fetchError && orgs.length === 0 && (
            <p className="text-sm text-slate-500">No organisations yet.</p>
          )}
          {!loadingOrgs && orgs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
                    <th className="text-left py-2 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Slug</th>
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org) => (
                    <tr key={org.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{org.name}</td>
                      <td className="py-2 pr-4 text-slate-500 font-mono text-xs">{org.slug}</td>
                      <td className="py-2 text-slate-500 text-xs">{new Date(org.created_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
