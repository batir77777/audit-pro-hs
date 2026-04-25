import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  ShieldAlert, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  Plus,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/authContext';
import { useAutoSaveContext } from '@/lib/autoSaveContext';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { currentUser, logout } = useAuth();
  const { status: autoSaveStatus } = useAutoSaveContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isFormRoute = path.includes('/new');
  const formAccentClass = !isFormRoute
    ? ''
    : path.includes('/audits')
      ? 'form-accent-blue'
      : path.includes('/checklists')
        ? 'form-accent-green'
        : path.includes('/fire-safety')
          ? 'form-accent-red'
          : path.includes('/permits')
            ? 'form-accent-purple'
            : path.includes('/incidents')
              ? 'form-accent-orange'
              : path.includes('/premises-checks')
                ? 'form-accent-teal'
                : path.includes('/risk-assessments')
                  ? 'form-accent-amber'
                  : 'form-accent-amber';

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Dynamic Risk Assessments', href: '/risk-assessments', icon: ShieldAlert },
    { name: 'Incident Reports', href: '/incidents', icon: FileText },
    { name: 'Checklists', href: '/checklists', icon: ClipboardCheck },
    { name: 'Audits', href: '/audits', icon: BarChart3 },
    { name: 'Toolbox Talks', href: '/toolbox-talks', icon: ClipboardCheck },
    { name: 'Fire Safety', href: '/fire-safety', icon: ShieldAlert },
    { name: 'Premises / Equipment Checks', href: '/premises-checks', icon: ClipboardCheck },
    { name: 'Permit to Work', href: '/permits', icon: FileText },
    { name: 'Contractor Vetting', href: '/contractors', icon: User },
    { name: 'My Reports', href: '/my-reports', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isNavActive = (href: string) => path === href || path.startsWith(`${href}/`);

  const isCreateRoute = [
    '/new-report',
    '/risk-assessments',
    '/incidents',
    '/checklists',
    '/audits',
    '/toolbox-talks',
    '/fire-safety',
    '/premises-checks',
    '/permits',
    '/contractors',
  ].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  const mobileNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, isActive: isNavActive('/dashboard') },
    { name: 'Create', href: '/new-report', icon: Plus, isActive: isCreateRoute },
    { name: 'Reports', href: '/my-reports', icon: FileText, isActive: isNavActive('/my-reports') },
    { name: 'Account', href: '/settings', icon: User, isActive: isNavActive('/settings') },
  ];

  const avatarUrl = currentUser
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`
    : '';

  const NavContent = () => (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="border-b border-white/10 p-5 lg:p-6 flex flex-col items-start gap-3">
        <Logo size="sm" className="shadow-lg" />
        <div className="space-y-0.5">
          <p className="text-[10px] text-white/50 uppercase tracking-[0.24em] font-black">Safety is the Key Ltd</p>
          <p className="text-[9px] text-sitk-yellow uppercase tracking-[0.16em] font-bold">Health & Safety Platform</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navigation.map((item) => {
          const isActive = isNavActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.08em] transition-all duration-200",
                isActive 
                  ? "bg-sitk-yellow text-sitk-black shadow-md shadow-sitk-yellow/20" 
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sitk-black" : "text-white/55")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0">
        <div className="mx-3 mb-2.5 h-px bg-white/10" />
        <div className="px-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-0">
          <div className="bg-white/5 rounded-xl p-3 mb-2 border border-white/10">
            <div className="flex items-center gap-3">
              {avatarUrl && <img src={avatarUrl} alt={currentUser?.name} className="w-9 h-9 rounded-xl bg-white/10 border border-white/10" />}
              <div className="overflow-hidden">
                <p className="text-xs font-extrabold uppercase tracking-[0.06em] truncate">{currentUser?.name ?? 'User'}</p>
                <p className="text-[10px] text-white/50 tracking-tight font-semibold truncate">{currentUser?.email ?? ''}</p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white/80 hover:text-red-300 hover:bg-red-400/15 font-extrabold uppercase text-[10px] tracking-[0.16em] h-10 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-slate-200/80 flex-col sticky top-0 h-screen">
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200/90 bg-white/95 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Logo size="sm" showFullText={false} className="px-2 py-1" />
            <span className="font-semibold text-sm tracking-tight text-slate-800">Safety is the Key</span>
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="inline-flex size-8 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            >
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r border-slate-200">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className={cn(
          "flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-5 md:py-8 pb-24 md:pb-10 lg:pb-16",
          isFormRoute && 'form-shell',
          formAccentClass
        )}>
          {children}
        </main>

        {/* Autosave floating indicator */}
        {autoSaveStatus !== 'idle' && (
          <div className="fixed right-3 z-45 pointer-events-none bottom-[calc(env(safe-area-inset-bottom)+5.4rem)] sm:right-4 lg:right-6 lg:bottom-6">
            <div className={cn(
              "inline-flex min-w-[6rem] justify-center items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.12em] shadow-sm border transition-all duration-300",
              autoSaveStatus === 'saving'
                ? "bg-white text-slate-400 border-slate-100"
                : "bg-green-50 text-green-600 border-green-100"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                autoSaveStatus === 'saving' ? "bg-slate-300 animate-pulse" : "bg-green-500"
              )} />
              {autoSaveStatus === 'saving' ? 'Saving…' : 'Saved'}
            </div>
          </div>
        )}

        {/* Mobile Bottom Nav (Quick Access) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around p-2 border-t border-slate-200 bg-white/98 backdrop-blur z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {mobileNavigation.map((item) => {
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-14",
                  item.isActive ? "text-slate-900 bg-sitk-yellow/30 ring-1 ring-sitk-yellow/45" : "text-slate-600 hover:text-slate-800"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

