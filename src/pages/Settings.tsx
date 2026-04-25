import React from 'react';
import { User, Building2, Bell, Shield, LogOut, ChevronRight, Settings as SettingsIcon, Camera, Paintbrush, UploadCloud, RotateCcw, CheckCircle2, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockUser } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '@/components/SectionHeader';
import { useBranding, DEFAULT_BRANDING } from '@/lib/brandingContext';
import { useAuth } from '@/lib/authContext';

const PROFILE_STORAGE_KEY = 'sitk_profile_settings';
const NOTIFICATIONS_STORAGE_KEY = 'sitk_notifications_settings';

interface ProfileSettings {
  name: string;
  email: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
}

interface PasswordDraft {
  current: string;
  next: string;
  confirm: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { branding, updateBranding, resetBranding } = useBranding();
  const [draft, setDraft] = React.useState({ ...branding });
  const [profileDraft, setProfileDraft] = React.useState<ProfileSettings>(() => {
    const fallback: ProfileSettings = {
      name: currentUser?.name ?? mockUser.name,
      email: currentUser?.email ?? mockUser.email,
    };

    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!stored) return fallback;
      const parsed = JSON.parse(stored) as Partial<ProfileSettings>;
      return {
        name: parsed.name?.trim() || fallback.name,
        email: parsed.email?.trim() || fallback.email,
      };
    } catch {
      return fallback;
    }
  });

  const avatarUrl = currentUser
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`
    : mockUser.avatar;
  const [saved, setSaved] = React.useState(false);
  const [profileSaved, setProfileSaved] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (!stored) {
        return { emailEnabled: true, pushEnabled: false };
      }
      const parsed = JSON.parse(stored) as Partial<NotificationSettings>;
      return {
        emailEnabled: parsed.emailEnabled ?? true,
        pushEnabled: parsed.pushEnabled ?? false,
      };
    } catch {
      return { emailEnabled: true, pushEnabled: false };
    }
  });
  const [securityOpen, setSecurityOpen] = React.useState(false);
  const [passwordDraft, setPasswordDraft] = React.useState<PasswordDraft>({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = React.useState<string | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  // Keep draft in sync if branding changes externally
  React.useEffect(() => {
    setDraft({ ...branding });
  }, [branding]);

  React.useEffect(() => {
    if (!currentUser) return;

    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) return;
    } catch {
      // no-op
    }

    setProfileDraft({
      name: currentUser.name || mockUser.name,
      email: currentUser.email || mockUser.email,
    });
  }, [currentUser]);

  React.useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore storage errors
    }
  }, [notifications]);

  const handleSaveProfile = () => {
    const normalized: ProfileSettings = {
      name: profileDraft.name.trim() || (currentUser?.name ?? mockUser.name),
      email: profileDraft.email.trim() || (currentUser?.email ?? mockUser.email),
    };

    setProfileDraft(normalized);

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // ignore storage errors
    }

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return; // 2MB cap
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setDraft(prev => ({ ...prev, logoDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = () => {
    updateBranding(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_BRANDING });
    resetBranding();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);

    if (!passwordDraft.current || !passwordDraft.next || !passwordDraft.confirm) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (passwordDraft.next.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(passwordDraft.next) || !/[0-9]/.test(passwordDraft.next)) {
      setPasswordError('New password must include at least one letter and one number.');
      return;
    }

    if (passwordDraft.next !== passwordDraft.confirm) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (passwordDraft.current === passwordDraft.next) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordNotice('Password update will be enabled soon.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sitk-black/40 font-black uppercase text-[10px] tracking-[0.2em]">
          <SettingsIcon className="w-3 h-3" /> System Configuration
        </div>
        <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 leading-none">
          Settings
        </h2>
        <p className="text-muted-foreground font-medium text-sm">Manage your account and platform preferences.</p>
      </div>

      <div className="grid gap-8">
        {/* User Profile */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <SectionHeader title="User Profile" icon={User} description="Update your personal information" className="mb-0" />
            
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="relative group">
                <img src={avatarUrl} alt={currentUser?.name ?? mockUser.name} className="w-24 h-24 rounded-2xl bg-slate-100 object-cover shadow-inner" />
                <button className="absolute -bottom-2 -right-2 bg-sitk-black text-white p-2 rounded-xl shadow-lg hover:bg-slate-800 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <h4 className="font-black uppercase text-lg tracking-tight">{currentUser?.name ?? mockUser.name}</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{currentUser?.email ?? mockUser.email} | {branding.companyName}</p>
                <Button variant="outline" size="sm" className="mt-2 font-black uppercase text-[10px] tracking-widest border-none bg-slate-100">Change Avatar</Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Full Name</Label>
                <Input
                  id="name"
                  className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                  value={profileDraft.name}
                  onChange={(e) => setProfileDraft(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Email Address</Label>
                <Input
                  id="email"
                  className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                  value={profileDraft.email}
                  onChange={(e) => setProfileDraft(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Job Role</Label>
                <Input id="role" className="py-6 bg-slate-100 border border-slate-300 font-bold" defaultValue={mockUser.role} disabled />
                <p className="text-[10px] text-muted-foreground font-medium">Managed from account profile.</p>
              </div>
            </div>
            <Button
              onClick={handleSaveProfile}
              className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest px-8 py-6 rounded-xl shadow-lg flex items-center gap-2"
            >
              {profileSaved ? (
                <><CheckCircle2 className="w-4 h-4 text-sitk-yellow" /> Saved</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Company Branding */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden border-t-4 border-t-sitk-yellow">
          <CardContent className="p-8 space-y-8">
            <div className="flex items-start justify-between">
              <SectionHeader
                title="Company Branding"
                icon={Paintbrush}
                description="Applied to PDF exports, Word documents, and shared reports"
                className="mb-0"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="font-black uppercase text-[10px] tracking-widest border-none bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 shrink-0"
              >
                <RotateCcw className="w-3 h-3" /> Reset Default
              </Button>
            </div>

            {/* Live Preview */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Live Preview — appears on exports &amp; shared reports</p>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-5">
                {draft.logoDataUrl ? (
                  <img
                    src={draft.logoDataUrl}
                    alt="Company logo preview"
                    className="h-14 w-14 rounded-xl object-contain bg-slate-50 border border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-sitk-black flex items-center justify-center shrink-0 shadow-md shadow-sitk-black/20">
                    <Shield className="w-7 h-7 text-sitk-yellow" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-black text-slate-900 uppercase tracking-tight text-sm leading-tight truncate">{draft.companyName || 'Company Name'}</p>
                  {draft.address && <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{draft.address}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {draft.phone && <p className="text-[11px] text-slate-400 font-medium">{draft.phone}</p>}
                    {draft.email && <p className="text-[11px] text-slate-400 font-medium">{draft.email}</p>}
                    {draft.website && <p className="text-[11px] text-sitk-yellow font-bold">{draft.website}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Company Logo</Label>
              <div className="flex items-center gap-4">
                {draft.logoDataUrl ? (
                  <img
                    src={draft.logoDataUrl}
                    alt="Logo"
                    className="h-16 w-16 rounded-xl object-contain bg-slate-50 border border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                )}
                <div className="space-y-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    className="font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 hover:border-sitk-yellow hover:bg-sitk-yellow/10 transition-all"
                  >
                    <UploadCloud className="w-3 h-3 mr-2" /> Upload Logo
                  </Button>
                  {draft.logoDataUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDraft(prev => ({ ...prev, logoDataUrl: '' }))}
                      className="font-black uppercase text-[10px] tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 ml-2"
                    >
                      Remove
                    </Button>
                  )}
                  <p className="text-[10px] text-muted-foreground font-medium">PNG, JPG, SVG or WebP. Max 2MB. Recommended: 200×200px square.</p>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="brand-company" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Company Name</Label>
                <Input
                  id="brand-company"
                  className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 font-bold"
                  value={draft.companyName}
                  onChange={e => setDraft(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g. Safety is the Key Ltd"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="brand-address" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Address
                </Label>
                <Input
                  id="brand-address"
                  className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                  value={draft.address}
                  onChange={e => setDraft(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 2 Palace Green, Croydon, CR0 9AG"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-phone" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Phone
                </Label>
                <Input
                  id="brand-phone"
                  className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                  value={draft.phone}
                  onChange={e => setDraft(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. 020 8406 5039"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-email" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <Input
                  id="brand-email"
                  type="email"
                  className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                  value={draft.email}
                  onChange={e => setDraft(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. info@example.co.uk"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="brand-website" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Website
                </Label>
                <Input
                  id="brand-website"
                  className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                  value={draft.website}
                  onChange={e => setDraft(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="e.g. www.example.co.uk"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveBranding}
              className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest px-8 py-6 rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              {saved ? (
                <><CheckCircle2 className="w-4 h-4 text-sitk-yellow" /> Branding Saved</>
              ) : (
                'Save Branding'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <SectionHeader title="Notifications" icon={Bell} description="How you receive platform updates" className="mb-0" />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">Email Notifications</p>
                  <p className="text-xs text-muted-foreground font-medium">Receive report summaries via email</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotifications(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }))}
                  className={`bg-white border-none shadow-sm font-black uppercase text-[10px] tracking-widest ${notifications.emailEnabled ? 'text-green-600' : 'text-slate-400'}`}
                >
                  {notifications.emailEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">Push Notifications</p>
                  <p className="text-xs text-muted-foreground font-medium">Receive alerts on your device</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotifications(prev => ({ ...prev, pushEnabled: !prev.pushEnabled }))}
                  className={`bg-white border-none shadow-sm font-black uppercase text-[10px] tracking-widest ${notifications.pushEnabled ? 'text-green-600' : 'text-slate-400'}`}
                >
                  {notifications.pushEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Danger Zone */}
        <div className="pt-4 space-y-4">
          <Button
            variant="outline"
            onClick={() => {
              setSecurityOpen(prev => !prev);
              setPasswordError(null);
              setPasswordNotice(null);
            }}
            className="w-full justify-between group py-8 rounded-2xl border-none bg-white shadow-sm hover:bg-slate-50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-sitk-yellow transition-colors">
                <Shield className="h-5 w-5 text-slate-500 group-hover:text-sitk-black" />
              </div>
              <span className="font-black uppercase text-xs tracking-widest">Change Security Password</span>
            </div>
            <ChevronRight className={`h-4 w-4 text-slate-300 transition-transform ${securityOpen ? 'rotate-90' : ''}`} />
          </Button>

          {securityOpen && (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordDraft.current}
                      onChange={(e) => setPasswordDraft(prev => ({ ...prev, current: e.target.value }))}
                      className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordDraft.next}
                      onChange={(e) => setPasswordDraft(prev => ({ ...prev, next: e.target.value }))}
                      className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordDraft.confirm}
                      onChange={(e) => setPasswordDraft(prev => ({ ...prev, confirm: e.target.value }))}
                      className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                    />
                  </div>

                  {passwordError && <p className="text-xs font-semibold text-red-600">{passwordError}</p>}
                  {passwordNotice && <p className="text-xs font-semibold text-sitk-black">{passwordNotice}</p>}

                  <Button
                    type="submit"
                    className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest px-6 py-5 rounded-xl shadow-lg"
                  >
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          
          <Button 
            variant="destructive" 
            className="w-full justify-start py-8 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none font-black uppercase text-xs tracking-[0.2em]"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut className="h-5 w-5 mr-4" />
            Sign Out of Platform
          </Button>
        </div>
      </div>
    </div>
  );
}
