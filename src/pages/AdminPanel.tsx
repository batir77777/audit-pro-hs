import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const EDGE_FUNCTION_URL = 'https://fnepfpksgnvcwfcysizc.supabase.co/functions/v1/create-user';

interface Organisation {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  organisations: { id: string; name: string } | null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminPanel() {
  const { currentUser, authLoading } = useAuth();
  const [roleReady, setRoleReady] = useState(false);

  // --- Create Organisation state ---
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // --- Organisations list state ---
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- Create User state ---
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userOrgId, setUserOrgId] = useState('');
  const [userRole, setUserRole] = useState<'client_admin' | 'client_user'>('client_user');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userCreateError, setUserCreateError] = useState<string | null>(null);
  const [userCreateSuccess, setUserCreateSuccess] = useState(false);

  // --- Users list state ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // --- Suspend / Activate state ---
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<Record<string, string>>({});

  // Once auth is loaded, wait up to 600ms for role patch, then mark ready.
  useEffect(() => {
    if (authLoading) return;
    const timeout = setTimeout(() => setRoleReady(true), 600);
    return () => clearTimeout(timeout);
  }, [authLoading]);

  // If role resolves to super_admin before timeout, mark ready immediately.
  useEffect(() => {
    if (!authLoading && currentUser?.role === 'super_admin') {
      setRoleReady(true);
    }
  }, [authLoading, currentUser?.role]);

  // Fetch orgs and users once super_admin access is confirmed.
  useEffect(() => {
    if (!roleReady || !currentUser || currentUser.role !== 'super_admin') return;

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

    const fetchUsers = async () => {
      setLoadingUsers(true);
      setUsersError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          is_active,
          created_at,
          organisations (
            id,
            name
          )
        `)
        .order('created_at', { ascending: true });
      if (error) {
        setUsersError(error.message);
      } else {
        setUsers((data as UserProfile[]) ?? []);
      }
      setLoadingUsers(false);
    };

    fetchOrgs();
    fetchUsers();
  }, [roleReady]);

  // --- All hooks above this line ---

  if (authLoading || !roleReady) return null;
  if (!currentUser || currentUser.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // ── Fetch users helper (shared) ──
  const refreshUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        organisations (
          id,
          name
        )
      `)
      .order('created_at', { ascending: true });
    setUsers((data as UserProfile[]) ?? []);
  };

  // ── Create Organisation handler ──
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrgName(val);
    setOrgSlug(slugify(val));
  };

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
      const { data } = await supabase
        .from('organisations')
        .select('id, name, slug, created_at')
        .order('created_at', { ascending: false });
      setOrgs(data ?? []);
    }
    setCreating(false);
  };

  // ── Create User handler ──
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserCreateError(null);
    setUserCreateSuccess(false);

    if (!userFullName.trim()) {
      setUserCreateError('Full name is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
      setUserCreateError('A valid email address is required.');
      return;
    }
    if (userPassword.length < 8) {
      setUserCreateError('Password must be at least 8 characters.');
      return;
    }
    if (!userOrgId) {
      setUserCreateError('Please select an organisation.');
      return;
    }

    setCreatingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUserCreateError('Not authenticated. Please refresh and try again.');
        setCreatingUser(false);
        return;
      }

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail.trim(),
          password: userPassword,
          full_name: userFullName.trim(),
          role: userRole,
          organisation_id: userOrgId,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setUserCreateError(result.error ?? 'Failed to create user. Please try again.');
      } else {
        setUserCreateSuccess(true);
        setUserFullName('');
        setUserEmail('');
        setUserPassword('');
        setUserOrgId('');
        setUserRole('client_user');
        await refreshUsers();
      }
    } catch (err: unknown) {
      setUserCreateError(
        err instanceof Error ? err.message : 'Network error. Please try again.'
      );
    }
    setCreatingUser(false);
  };

  // ── Suspend / Activate handler ──
  const handleToggleActive = async (user: UserProfile) => {
    setTogglingUserId(user.id);
    setToggleError((prev) => ({ ...prev, [user.id]: '' }));

    const { error } = await supabase.rpc('admin_update_profile', {
      target_id: user.id,
      new_is_active: !user.is_active,
    });

    if (error) {
      setToggleError((prev) => ({ ...prev, [user.id]: error.message }));
    } else {
      await refreshUsers();
    }
    setTogglingUserId(null);
  };

  // ── Group users by organisation name ──
  const usersByOrg = users.reduce((acc, user) => {
    const orgLabel = user.organisations?.name ?? 'No Organisation';
    if (!acc.has(orgLabel)) acc.set(orgLabel, []);
    acc.get(orgLabel)!.push(user);
    return acc;
  }, new Map<string, UserProfile[]>());

  const sortedOrgGroups = Array.from(usersByOrg.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">
        Admin Panel
      </h1>

      {/* ── Create Organisation ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest">
            Create Organisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name" className="uppercase text-[10px] font-bold tracking-widest">
                Organisation Name
              </Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={handleNameChange}
                placeholder="e.g. Acme Ltd"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug" className="uppercase text-[10px] font-bold tracking-widest">
                Slug
              </Label>
              <Input
                id="org-slug"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="e.g. acme-ltd"
                required
              />
            </div>
            {createError && <p className="text-red-600 text-xs font-bold">{createError}</p>}
            {createSuccess && (
              <p className="text-green-600 text-xs font-bold">Organisation created successfully.</p>
            )}
            <Button
              type="submit"
              disabled={creating}
              className="bg-sitk-yellow text-sitk-black font-bold uppercase tracking-widest hover:bg-sitk-yellow/90"
            >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Create User ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest">
            Create User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-fullname" className="uppercase text-[10px] font-bold tracking-widest">
                Full Name
              </Label>
              <Input
                id="user-fullname"
                value={userFullName}
                onChange={(e) => setUserFullName(e.target.value)}
                placeholder="e.g. Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email" className="uppercase text-[10px] font-bold tracking-widest">
                Email
              </Label>
              <Input
                id="user-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="e.g. jane@clienta.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password" className="uppercase text-[10px] font-bold tracking-widest">
                Temporary Password
              </Label>
              <Input
                id="user-password"
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-org" className="uppercase text-[10px] font-bold tracking-widest">
                Organisation
              </Label>
              <select
                id="user-org"
                value={userOrgId}
                onChange={(e) => setUserOrgId(e.target.value)}
                disabled={loadingOrgs}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {loadingOrgs ? 'Loading organisations...' : '— Select organisation —'}
                </option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role" className="uppercase text-[10px] font-bold tracking-widest">
                Role
              </Label>
              <select
                id="user-role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as 'client_admin' | 'client_user')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="client_user">Client User</option>
                <option value="client_admin">Client Admin</option>
              </select>
            </div>
            {userCreateError && (
              <p className="text-red-600 text-xs font-bold">{userCreateError}</p>
            )}
            {userCreateSuccess && (
              <p className="text-green-600 text-xs font-bold">User created successfully.</p>
            )}
            <Button
              type="submit"
              disabled={creatingUser || loadingOrgs}
              className="bg-sitk-yellow text-sitk-black font-bold uppercase tracking-widest hover:bg-sitk-yellow/90"
            >
              {creatingUser ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Organisations List ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest">
            Organisations List
          </CardTitle>
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
                      <td className="py-2 text-slate-500 text-xs">
                        {new Date(org.created_at).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Users ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest">
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers && <p className="text-sm text-slate-500">Loading users...</p>}
          {usersError && <p className="text-red-600 text-xs font-bold">{usersError}</p>}
          {!loadingUsers && !usersError && users.length === 0 && (
            <p className="text-sm text-slate-500">No users found.</p>
          )}
          {!loadingUsers && !usersError && sortedOrgGroups.length > 0 && (
            <div className="space-y-6">
              {sortedOrgGroups.map(([orgLabel, orgUsers]) => (
                <div key={orgLabel}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    {orgLabel}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
                          <th className="text-left py-2 pr-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</th>
                          <th className="text-left py-2 pr-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</th>
                          <th className="text-left py-2 pr-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Active</th>
                          <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orgUsers.map((user) => (
                          <tr key={user.id} className="border-b last:border-0">
                            <td className="py-2 pr-3 font-medium whitespace-nowrap">{user.full_name}</td>
                            <td className="py-2 pr-3 text-slate-500 font-mono text-xs break-all">{user.email}</td>
                            <td className="py-2 pr-3 text-xs whitespace-nowrap">{formatRole(user.role)}</td>
                            <td className="py-2 pr-3 text-xs">
                              {user.is_active ? (
                                <span className="text-green-600 font-bold">&#10003;</span>
                              ) : (
                                <span className="text-slate-400">&#8211;</span>
                              )}
                            </td>
                            <td className="py-2 text-xs">
                              {user.role !== 'super_admin' && (
                                <div>
                                  <button
                                    onClick={() => handleToggleActive(user)}
                                    disabled={togglingUserId === user.id}
                                    className={
                                      'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ' +
                                      (user.is_active
                                        ? 'border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50'
                                        : 'border-green-300 text-green-600 hover:bg-green-50 disabled:opacity-50')
                                    }
                                  >
                                    {togglingUserId === user.id
                                      ? '...'
                                      : user.is_active
                                      ? 'Suspend'
                                      : 'Activate'}
                                  </button>
                                  {toggleError[user.id] && (
                                    <p className="text-red-600 text-[10px] mt-1">{toggleError[user.id]}</p>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
