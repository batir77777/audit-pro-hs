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
  const { currentUser, logout } = useAuth();
  const { status: autoSaveStatus } = useAutoSaveContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.08em] transition-all duration-200",
                isActive 
                  ? "bg-sitk-yellow text-sitk-black shadow-md shadow-sitk-yellow/20" 
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sitk-black" : "text-white/40")} />
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
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-700 hover:bg-slate-100">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r border-slate-200">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 w-full px-4 sm:px-5 md:px-7 lg:px-8 xl:px-10 py-5 md:py-8 pb-24 md:pb-10 lg:pb-8">
          {children}
        </main>

        {/* Autosave floating indicator */}
        {autoSaveStatus !== 'idle' && (
          <div className="fixed bottom-[5.2rem] right-4 z-50 pointer-events-none lg:bottom-6">
            <div className={cn(
              "inline-flex min-w-[6.4rem] justify-center items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md border transition-all duration-300",
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
          {navigation.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-14",
                  isActive ? "text-slate-900 bg-sitk-yellow/25" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
          <Link
            to="/my-reports"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-14",
              location.pathname === '/my-reports' ? "text-slate-900 bg-sitk-yellow/25" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Reports</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

