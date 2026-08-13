import React from 'react';
import { useConsultation } from '../../context/ConsultationContext';
import { Pill, FileCheck, TestTube, Compass, CalendarOff, FileText, Calendar } from 'lucide-react';

export default function ConsultationSidebarTabs() {
  const { lang, activeDocType, setActiveDocType, notifyDraftUpdate } = useConsultation();

  const handleTabChange = (docType) => {
    setActiveDocType(docType);
    notifyDraftUpdate({ activeDocType: docType });
  };

  const tabs = [
    { id: 'ordonnance', label: lang === 'fr' ? 'Ordonnance' : 'Prescription', icon: Pill, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'certificat', label: lang === 'fr' ? 'Certificat' : 'Certificate', icon: FileCheck, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'bilan', label: lang === 'fr' ? 'Bilan / Examen' : 'Exams', icon: TestTube, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { id: 'orientation', label: lang === 'fr' ? 'Orientation' : 'Referral', icon: Compass, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { id: 'arret_travail', label: lang === 'fr' ? 'Arrêt de travail' : 'Sick Leave', icon: CalendarOff, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 'doc_medical', label: lang === 'fr' ? 'Doc Médical' : 'Med Doc', icon: FileText, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' },
    { id: 'prochain_rdv', label: lang === 'fr' ? 'Prochain RDV' : 'Next Appt', icon: Calendar, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' }
  ];

  return (
    <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar scroll-smooth">
      {tabs.map((tab) => {
        const isSelected = activeDocType === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border transition-all shrink-0 min-w-[80px]
              ${isSelected 
                ? 'bg-slate-800 border-slate-600 shadow-lg scale-105' 
                : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100'}
            `}
          >
            <div className={`p-1.5 rounded-lg ${isSelected ? tab.bg : 'bg-slate-800/50'} ${isSelected ? tab.border : 'border-transparent'}`}>
              <Icon className={`w-4 h-4 ${isSelected ? tab.color : 'text-slate-400'}`} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-slate-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
