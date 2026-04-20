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
  X,
  User,
  Key
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
    <div className="flex flex-col h-full bg-sitk-black text-white">
      <div className="p-8 flex flex-col items-start gap-4">
        <Logo size="sm" className="shadow-lg" />
        <div className="space-y-0.5">
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black">Safety is the Key Ltd</p>
          <p className="text-[8px] text-sitk-yellow uppercase tracking-widest font-bold">Health & Safety Platform</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200",
                isActive 
                  ? "bg-sitk-yellow text-sitk-black shadow-lg shadow-sitk-yellow/10 translate-x-1" 
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-sitk-black" : "text-white/30")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
          <div className="flex items-center gap-3">
            {avatarUrl && <img src={avatarUrl} alt={currentUser?.name} className="w-10 h-10 rounded-xl bg-white/10 border border-white/10" />}
            <div className="overflow-hidden">
              <p className="text-xs font-black uppercase tracking-tight truncate">{currentUser?.name ?? 'User'}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold truncate">{currentUser?.email ?? ''}</p>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-white/40 hover:text-red-400 hover:bg-red-400/10 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r flex-col sticky top-0 h-screen">
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Logo size="sm" showFullText={false} className="px-2 py-1" />
            <span className="font-bold text-sm tracking-tight">Safety is the Key</span>
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Autosave floating indicator */}
        {autoSaveStatus !== 'idle' && (
          <div className="fixed bottom-20 right-4 z-50 pointer-events-none lg:bottom-6">
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md border transition-all duration-300",
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
        <nav className="lg:hidden flex items-center justify-around p-2 border-t bg-background sticky bottom-0 z-40">
          {navigation.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                  isActive ? "text-sitk-black bg-sitk-yellow/20" : "text-muted-foreground"
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
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
              location.pathname === '/my-reports' ? "text-sitk-black bg-sitk-yellow/20" : "text-muted-foreground"
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

