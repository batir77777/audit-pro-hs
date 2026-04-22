import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Users, 
  ArrowRight,
  ClipboardCheck,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SectionHeader from '@/components/SectionHeader';
import { motion } from 'framer-motion';

export default function ContractorVettingSelection() {
  const navigate = useNavigate();

  const templates = [
    {
      id: '10-001',
      title: 'Contractor Vetting Form',
      description: 'For contractors or sub-contractors with 5 or more employees, or where the full vetting form is required.',
      icon: Building2,
      color: 'bg-blue-500/10 text-blue-600'
    },
    {
      id: '10-002',
      title: 'Contractor Vetting Form (Small)',
      description: 'For smaller or single-person contractors or sub-contractors.',
      icon: User,
      color: 'bg-green-500/10 text-green-600'
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <SectionHeader 
        title="Contractor Vetting" 
        icon={User} 
        description="Select the appropriate vetting form for your contractor or sub-contractor." 
      />

      <div className="grid gap-8 md:grid-cols-2">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden bg-white rounded-[2.5rem] relative">
              <CardHeader className="p-10 pb-4">
                <div className={`p-5 rounded-[1.5rem] w-fit mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg ${template.color}`}>
                  <template.icon className="w-10 h-10" />
                </div>
                <div className="space-y-3">
                  <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Template {template.id}
                  </Badge>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                    {template.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-sm font-medium leading-relaxed text-slate-500 mt-4">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-6">
                <Button 
                  className="w-full bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[11px] tracking-[0.2em] py-8 rounded-2xl shadow-2xl shadow-sitk-black/30 transition-all active:scale-[0.98] group/btn overflow-hidden relative"
                  onClick={() => navigate(`/contractors/${template.id}/new`)}
                >
                  <span className="relative z-10 flex items-center">
                    Start Vetting Form 
                    <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                </Button>
              </CardContent>
              
              {/* Decorative background element */}
              <div className={`absolute -bottom-12 -right-12 w-48 h-48 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 ${template.color.split(' ')[1]}`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info Panel */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl flex items-start gap-6 border-l-8 border-l-sitk-yellow"
      >
        <div className="bg-sitk-yellow p-3 rounded-xl shrink-0">
          <ShieldCheck className="w-6 h-6 text-sitk-black" />
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-sitk-yellow">Compliance Notice</h4>
          <p className="text-sm font-medium leading-relaxed opacity-80">
            All contractors must be fully vetted and approved before commencing any work on site. 
            Ensure all required documentation, including insurance certificates and RAMS, are attached to the submission.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
