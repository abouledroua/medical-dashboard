import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, UserPlus, FileText, Calendar, ChevronRight, Stethoscope, Settings, PanelLeftClose, PanelLeftOpen, Sliders } from 'lucide-react';
import { translations } from '../translations';

export default function Sidebar({ activeTab, setActiveTab, selectedPatient, ongoingConsultations = [], activeConsultationPatientId, onSelectConsultationDraft, lang = 'fr' }) {
  const t = translations[lang] || translations.fr;

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('el_iyada_sidebar_width');
      return saved ? Math.min(Math.max(parseInt(saved, 10), 180), 480) : 256;
    } catch (e) {
      return 256;
    }
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('el_iyada_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [isResizing, setIsResizing] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('el_iyada_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const startResizing = (e) => {
    e.preventDefault();
    if (!isCollapsed) {
      setIsResizing(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || isCollapsed) return;
      const newWidth = Math.min(Math.max(e.clientX, 180), 480);
      setSidebarWidth(newWidth);
      try {
        localStorage.setItem('el_iyada_sidebar_width', newWidth);
      } catch (err) {}
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, isCollapsed]);

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
      badge: selectedPatient ? null : t.selectPatientBadge
    },
    ...(ongoingConsultations || []).map(draft => ({
      id: `add-consultation-${draft.patientId}`,
      tabId: 'add-consultation',
      patientId: draft.patientId,
      patient: draft.patient,
      label: lang === 'fr' ? 'Consultation En Cours' : 'Ongoing Consultation',
      icon: Stethoscope,
      badge: `${draft.patient?.lastName || ''} ${draft.patient?.firstName ? draft.patient.firstName[0] + '.' : ''}`,
      isOngoing: true
    })),
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
    },
    {
      id: 'data-templates',
      label: lang === 'fr' ? 'Données & Gabarit' : 'Data & Templates',
      icon: Sliders,
      badge: null
    }
  ];

  return (
    <aside
      style={{ width: isCollapsed ? '72px' : `${sidebarWidth}px` }}
      className={`relative w-full md:w-auto glass-panel border-r border-slate-800 p-3.5 flex flex-col justify-between shrink-0 select-none transition-all duration-200 ease-in-out`}
    >
      {/* Draggable Resize Handle (Only when expanded) */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          className={`absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-teal-500/40 transition-colors z-20 group flex items-center justify-center ${
            isResizing ? 'bg-teal-500/60' : ''
          }`}
          title={lang === 'fr' ? 'Faites glisser pour redimensionner' : 'Drag to resize'}
        >
          <div className={`w-0.5 h-8 rounded-full bg-slate-700 group-hover:bg-teal-300 transition-all ${
            isResizing ? 'bg-teal-300 h-14' : ''
          }`} />
        </div>
      )}

      <div className="space-y-5">
        {/* Title & Hide/Show Toggle Button Header */}
        <div className={`flex items-center justify-between gap-2 px-1 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
          {!isCollapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              {lang === 'fr' ? 'Navigation Clinique' : 'Clinical Navigation'}
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-teal-300 border border-slate-800 hover:border-teal-500/40 transition shadow-sm flex items-center justify-center shrink-0"
            title={isCollapsed ? (lang === 'fr' ? 'Afficher la barre latérale' : 'Show sidebar') : (lang === 'fr' ? 'Masquer la barre latérale' : 'Hide sidebar')}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-teal-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-teal-400" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isOngoing
              ? (activeTab === 'add-consultation' && String(item.patientId) === String(activeConsultationPatientId))
              : (activeTab === item.id);

            const handleItemClick = () => {
              if (item.isOngoing) {
                if (onSelectConsultationDraft) {
                  onSelectConsultationDraft(item.patientId, item.patient);
                } else {
                  setActiveTab('add-consultation');
                }
              } else {
                setActiveTab(item.id);
              }
            };

            if (isCollapsed) {
              return (
                <button
                  key={item.id}
                  onClick={handleItemClick}
                  title={`${item.label}${item.id === 'medical-history' && selectedPatient ? ` (${selectedPatient.lastName} ${selectedPatient.firstName})` : ''}${item.isOngoing && item.patient ? ` (${item.patient.lastName} ${item.patient.firstName})` : ''}`}
                  className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/30 to-teal-500/10 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-950/50'
                      : item.isOngoing
                      ? 'bg-teal-950/60 text-teal-300 border border-teal-800/80 hover:bg-teal-900/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition ${isActive || item.isOngoing ? 'text-teal-400 scale-110' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  {item.isOngoing && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                  )}
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={handleItemClick}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border border-teal-500/30 shadow-md shadow-teal-950/50'
                    : item.isOngoing
                    ? 'bg-teal-950/50 text-teal-300 border border-teal-800/70 hover:bg-teal-900/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {item.id === 'medical-history' && selectedPatient ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-teal-400 scale-110' : 'text-slate-400 group-hover:text-slate-300'}`} />
                        <span className={`truncate font-bold text-xs ${isActive ? 'text-white' : 'text-slate-300'}`}>{item.label}</span>
                      </div>
                    </div>
                    <div className={`pl-6 text-xs font-bold truncate ${isActive ? 'text-teal-300' : 'text-teal-400/90'}`}>
                      {selectedPatient.lastName} {selectedPatient.firstName}
                    </div>
                  </div>
                ) : item.isOngoing ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Icon className="w-4 h-4 text-teal-400 shrink-0 scale-110" />
                        <span className="truncate font-bold text-xs text-white">{item.label}</span>
                      </div>
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                      </span>
                    </div>
                    <div className="pl-6 text-xs font-bold text-teal-300 truncate">
                      {item.patient ? `${item.patient.lastName || ''} ${item.patient.firstName || ''}`.trim() : ''}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-teal-400 scale-110' : 'text-slate-400 group-hover:text-slate-300'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold truncate max-w-[80px] shrink-0 ml-1 ${
                        isActive
                          ? 'bg-teal-400/20 text-teal-300 border border-teal-400/30'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Selected Patient Banner if active and not collapsed */}
        {!isCollapsed && selectedPatient && (
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
            <div className="font-semibold text-slate-100 text-sm truncate">
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
      {!isCollapsed ? (
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>{t.serverStatus}</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Node.js 3001
            </span>
          </div>
          <div className="text-[10px] text-slate-600">{t.hipaaNotice}</div>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-800 flex justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Node.js Connected"></span>
        </div>
      )}
    </aside>
  );
}
