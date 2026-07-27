import React from 'react';
import { LayoutDashboard, Users, UserPlus, FileText, Calendar, ChevronRight, Stethoscope, Settings } from 'lucide-react';
import { translations } from '../translations';

export default function Sidebar({ activeTab, setActiveTab, selectedPatient, lang = 'fr' }) {
  const t = translations[lang] || translations.fr;

  const navItems = [
    {
      id: 'overview',
      label: t.navOverview,
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'patients',
      label: t.navPatients,
      icon: Users,
      badge: t.directoryBadge
    },
    {
      id: 'add-patient',
      label: t.navAddPatient,
      icon: UserPlus,
      badge: t.formBadge
    },
    {
      id: 'medical-history',
      label: t.navMedicalHistory,
      icon: FileText,
      badge: selectedPatient ? `${selectedPatient.lastName} ${selectedPatient.firstName[0]}.` : t.selectPatientBadge
    },
    {
      id: 'appointments',
      label: t.navAppointments,
      icon: Calendar,
      badge: null
    },
    {
      id: 'settings',
      label: lang === 'fr' ? 'Paramètres' : 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-full md:w-64 glass-panel border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-3">
            {lang === 'fr' ? 'Navigation Clinique' : 'Clinical Navigation'}
          </span>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border border-teal-500/30 shadow-md shadow-teal-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition ${isActive ? 'text-teal-400 scale-110' : 'text-slate-400 group-hover:text-slate-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      isActive
                        ? 'bg-teal-400/20 text-teal-300 border border-teal-400/30'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Selected Patient Banner if active */}
        {selectedPatient && (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-teal-500/20 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wide flex items-center gap-1">
                <Stethoscope className="w-3 h-3" /> {t.activePatient}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                {selectedPatient.mrn}
              </span>
            </div>
            <div className="font-semibold text-slate-100 text-sm">
              {selectedPatient.lastName} {selectedPatient.firstName}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>{selectedPatient.age} ans • {selectedPatient.gender}</span>
              <span className="text-teal-300 font-bold">{selectedPatient.bloodGroup}</span>
            </div>
            <button
              onClick={() => setActiveTab('medical-history')}
              className="w-full mt-1 text-xs py-1.5 px-3 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 flex items-center justify-center gap-1 font-medium transition"
            >
              {t.viewHistory} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>{t.serverStatus}</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Node.js 3001
          </span>
        </div>
        <div className="text-[10px] text-slate-600">{t.hipaaNotice}</div>
      </div>
    </aside>
  );
}
