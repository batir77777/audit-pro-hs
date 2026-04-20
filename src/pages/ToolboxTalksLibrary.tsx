import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowRight,
  Flame,
  Box,
  FlaskConical,
  ShieldAlert,
  AlertTriangle,
  Construction,
  Scale,
  Mountain,
  Zap,
  Footprints,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SectionHeader from '@/components/SectionHeader';
import { cn } from '@/lib/utils';

interface ToolboxTalkTemplate {
  id: string;
  ref: string;
  title: string;
  description: string;
  icon: any;
  category: 'General' | 'Equipment' | 'Safety' | 'Health';
}

const TALK_TEMPLATES: ToolboxTalkTemplate[] = [
  { 
    id: 'tt-26-001', 
    ref: '26-001', 
    title: 'Stepladders', 
    description: 'Safe use, inspection, and positioning of stepladders on site.', 
    icon: Construction,
    category: 'Equipment'
  },
  { 
    id: 'tt-26-002', 
    ref: '26-002', 
    title: 'Fire Safety', 
    description: 'Prevention measures, extinguisher types, and evacuation procedures.', 
    icon: Flame,
    category: 'Safety'
  },
  { 
    id: 'tt-26-004', 
    ref: '26-004', 
    title: 'Manual Handling', 
    description: 'L.I.T.E. principles and correct lifting techniques to avoid injury.', 
    icon: Box,
    category: 'Safety'
  },
  { 
    id: 'tt-26-005', 
    ref: '26-005', 
    title: 'Chemicals COSHH', 
    description: 'Understanding hazard symbols and safe handling of hazardous substances.', 
    icon: FlaskConical,
    category: 'Health'
  },
  { 
    id: 'tt-26-008', 
    ref: '26-008', 
    title: 'PPE General', 
    description: 'Mandatory equipment requirements and correct maintenance of PPE.', 
    icon: ShieldAlert,
    category: 'General'
  },
  { 
    id: 'tt-26-009', 
    ref: '26-009', 
    title: 'Asbestos Awareness', 
    description: 'Identifying potential asbestos and emergency procedures if disturbed.', 
    icon: AlertTriangle,
    category: 'Health'
  },
  { 
    id: 'tt-26-015', 
    ref: '26-015', 
    title: 'Accident Prevention', 
    description: 'Identifying near misses and proactive measures to prevent site accidents.', 
    icon: ShieldAlert,
    category: 'Safety'
  },
  { 
    id: 'tt-26-020', 
    ref: '26-020', 
    title: 'Lifting Equipment', 
    description: 'Safe operation and daily checks for mechanical lifting aids.', 
    icon: Box,
    category: 'Equipment'
  },
  { 
    id: 'tt-26-030', 
    ref: '26-030', 
    title: 'Employees’ H&S Duties at Work', 
    description: 'Legal responsibilities of employees under the Health and Safety at Work Act.', 
    icon: Scale,
    category: 'General'
  },
  { 
    id: 'tt-26-036', 
    ref: '26-036', 
    title: 'Work at Height', 
    description: 'Risk assessment and hierarchy of control for all work above ground level.', 
    icon: Mountain,
    category: 'Safety'
  },
  { 
    id: 'tt-26-054', 
    ref: '26-054', 
    title: 'Dynamic Risk Assessments (DRAs)', 
    description: 'Continuous assessment of hazards in rapidly changing environments.', 
    icon: Zap,
    category: 'Safety'
  },
  { 
    id: 'tt-26-063', 
    ref: '26-063', 
    title: 'Slips, Trips and Falls', 
    description: 'Housekeeping standards and identifying common walking surface hazards.', 
    icon: Footprints,
    category: 'Safety'
  },
];

export default function ToolboxTalksLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string>('All');

  const categories = ['All', 'General', 'Equipment', 'Safety', 'Health'];

  const filteredTalks = TALK_TEMPLATES.filter(talk => {
    const matchesSearch = talk.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         talk.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         talk.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || talk.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <SectionHeader 
          title="Toolbox Talks Library" 
          icon={Users} 
          description="Safety Briefing Sheets & Site Presentations" 
          className="mb-0"
        />
        <div className="flex items-center gap-2 px-4 py-2 bg-sitk-yellow/10 rounded-full">
          <Info className="w-3.5 h-3.5 text-sitk-yellow" />
          <p className="text-[10px] font-black uppercase tracking-widest text-sitk-black">Select a template to begin briefing</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-sitk-yellow transition-colors" />
          <Input 
            placeholder="Search by title, ref or description..." 
            className="pl-14 h-16 bg-white border-none shadow-sm focus-visible:ring-sitk-yellow rounded-2xl font-bold text-sm" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "h-16 px-8 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shrink-0",
                activeCategory === category 
                  ? "bg-sitk-black text-white shadow-xl shadow-sitk-black/20" 
                  : "bg-white border-none shadow-sm hover:bg-slate-50"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredTalks.map((talk) => (
          <Card key={talk.id} className="border-none shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group rounded-[2.5rem] overflow-hidden bg-white flex flex-col">
            <CardHeader className="p-8 pb-4 relative">
              <div className="absolute top-8 right-8 text-[10px] font-black text-slate-300 tracking-widest group-hover:text-sitk-yellow transition-colors">
                {talk.ref}
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl w-fit mb-6 group-hover:bg-sitk-yellow transition-colors duration-500 shadow-inner">
                <talk.icon className="w-7 h-7 text-sitk-black" />
              </div>
              <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900 leading-tight mb-3 group-hover:text-sitk-yellow transition-colors">
                {talk.title}
              </CardTitle>
              <CardDescription className="text-sm font-bold text-slate-500 leading-relaxed min-h-[3.5rem] line-clamp-2">
                {talk.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 mt-auto">
              <div className="flex items-center justify-between mb-8 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{talk.category}</span>
                <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-sitk-yellow rounded-full" />
                </div>
              </div>
              <Button 
                className="w-full bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-[0.2em] h-16 rounded-2xl shadow-xl shadow-sitk-black/10 group-hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() => navigate(`/toolbox-talks/new?template=${talk.id}`)}
              >
                Start Talk <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {filteredTalks.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-slate-100">
            <div className="flex flex-col items-center gap-4 opacity-20">
              <Search className="w-12 h-12" />
              <p className="text-xs font-black uppercase tracking-widest">No matching talks found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
