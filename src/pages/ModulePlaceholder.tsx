import { useParams, useLocation } from 'react-router-dom';
import { Construction, AlertTriangle, ClipboardList, Search, Flame, FileText, User, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ModulePlaceholder() {
  const { type } = useParams();
  const location = useLocation();
  
  const getModuleInfo = () => {
    const path = location.pathname;
    if (path.includes('risk-assessments')) return { title: 'Dynamic Risk Assessments', icon: AlertTriangle, color: 'text-orange-500' };
    if (path.includes('incidents')) return { title: 'Incident Reports', icon: Construction, color: 'text-red-500' };
    if (path.includes('checklists')) return { title: 'Checklists', icon: ClipboardList, color: 'text-blue-500' };
    if (path.includes('audits')) return { title: 'Audits', icon: Search, color: 'text-purple-500' };
    if (path.includes('toolbox-talks')) return { title: 'Toolbox Talks', icon: Users, color: 'text-green-500' };
    if (path.includes('fire-safety')) return { title: 'Fire Safety', icon: Flame, color: 'text-orange-600' };
    if (path.includes('permits')) return { title: 'Permit to Work', icon: FileText, color: 'text-blue-600' };
    if (path.includes('contractors')) return { title: 'Contractor Vetting', icon: User, color: 'text-slate-600' };
    return { title: 'Module', icon: Construction, color: 'text-primary' };
  };

  const info = getModuleInfo();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <div className={`p-6 rounded-full bg-slate-100 ${info.color}`}>
        <info.icon className="w-16 h-16" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{info.title}</h2>
        <p className="text-muted-foreground max-w-md">
          This module is currently in development for the SafeSite Pilot. 
          The full functional template will be available in the next update.
        </p>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => window.history.back()}>Go Back</Button>
        <Button variant="outline">Learn More</Button>
      </div>
    </div>
  );
}
