import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle2, AlertCircle, User, Filter, ArrowUpRight, Search, ChevronDown } from 'lucide-react';
import { translations } from '../translations';

export default function AppointmentsList({
  appointments,
  patients,
  onOpenNewAppointment,
  onUpdateAppointmentStatus,
  onSelectPatient,
  lang = 'fr'
}) {
  const t = translations[lang] || translations.fr;
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(todayStr); // Always default to Today's date
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);

  // Memoize filtered results for instant response
  const filteredAppointments = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    return appointments.filter(apt => {
      const matchesDate = !dateFilter || apt.date === dateFilter;
      const matchesStatus = filterStatus === 'All' || (apt.status && apt.status.toLowerCase() === filterStatus.toLowerCase());
      const matchesSearch = !q ||
        (apt.patientName && apt.patientName.toLowerCase().includes(q)) ||
        (apt.mrn && apt.mrn.toLowerCase().includes(q)) ||
        (apt.reason && apt.reason.toLowerCase().includes(q));

      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [appointments, dateFilter, filterStatus, searchFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(30);
  }, [dateFilter, filterStatus, searchFilter]);

  const displayedAppointments = useMemo(() => {
    return filteredAppointments.slice(0, visibleCount);
  }, [filteredAppointments, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 30);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-400" /> {t.scheduleTitle || (lang === 'fr' ? 'Planning des Rendez-vous Cliniques' : 'Clinical Appointments & Schedule')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'fr' ? (
              <>Affichage de <span className="text-teal-400 font-semibold">{displayedAppointments.length}</span> sur {filteredAppointments.length} rendez-vous ({dateFilter || 'Toutes les dates'})</>
            ) : (
              <>Showing <span className="text-teal-400 font-semibold">{displayedAppointments.length}</span> of {filteredAppointments.length} appointments ({dateFilter || 'All Dates'})</>
            )}
          </p>
        </div>

        <button
          onClick={() => onOpenNewAppointment()}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> {t.bookApptBtn || (lang === 'fr' ? '+ Programmer un Rendez-vous' : '+ Schedule Appointment')}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher par patient, NIP, motif...' : 'Search appointment by patient name, MRN, reason...'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 placeholder-slate-500 transition"
            />
            {searchFilter && (
              <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 animate-pulse rounded-full"></div>
            )}
          </div>

          {/* Date Selector & Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <CalendarIcon className="w-4 h-4 text-teal-400" />
            <span className="text-slate-400 font-medium hidden sm:inline">{lang === 'fr' ? 'Date :' : 'Date:'}</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 font-mono"
            />
            <button
              onClick={() => setDateFilter(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                dateFilter === todayStr
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? "Aujourd'hui" : 'Today'}
            </button>
            <button
              onClick={() => setDateFilter('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                !dateFilter
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? 'Toutes les Dates' : 'All Dates'}
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {[
            { key: 'All', label: lang === 'fr' ? 'Tous' : 'All' },
            { key: 'Scheduled', label: lang === 'fr' ? 'Programmé' : 'Scheduled' },
            { key: 'In Progress', label: lang === 'fr' ? 'En cours / Arrivé' : 'In Progress' },
            { key: 'Completed', label: lang === 'fr' ? 'Terminé' : 'Completed' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === item.key
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                {lang === 'fr'
                  ? `Aucun rendez-vous trouvé ${dateFilter ? `pour le ${dateFilter}` : ''}.`
                  : `No appointments found ${dateFilter ? `for ${dateFilter}` : ''}.`}
              </p>
              <p className="text-xs text-slate-500">
                {lang === 'fr' ? 'Essayez de sélectionner "Toutes les Dates" ou d\'ajouter un nouveau rendez-vous.' : 'Try selecting "All Dates" or schedule a new appointment.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Date & Heure' : 'Date & Time'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Patient' : 'Patient'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Motif RDV' : 'Reason'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {displayedAppointments.map((apt) => {
                    const matchedPatient = patients.find(p => p.id === apt.patientId || p.codeBarre === apt.patientId || p.mrn === apt.mrn);

                    return (
                      <tr key={apt.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-teal-300 text-xs">{apt.date}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" /> {apt.time}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {apt.patientName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">{apt.mrn} {apt.phone !== 'N/A' && `• ${apt.phone}`}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-slate-200">{apt.reason}</div>
                          <div className="text-[11px] text-teal-400">{apt.type || 'En Présentiel'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                            apt.status === 'Completed'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : apt.status === 'In Progress'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-teal-950 text-teal-300 border-teal-800'
                          }`}>
                            {apt.status === 'Completed' ? (lang === 'fr' ? 'Terminé' : 'Completed') : apt.status === 'In Progress' ? (lang === 'fr' ? 'En cours / Arrivé' : 'In Progress') : (lang === 'fr' ? 'Programmé' : 'Scheduled')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          {apt.status !== 'Completed' && (
                            <button
                              onClick={() => onUpdateAppointmentStatus(apt.id, 'Completed')}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-500/30 transition inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Marquer Terminé' : 'Complete'}
                            </button>
                          )}

                          {matchedPatient && (
                            <button
                              onClick={() => onSelectPatient(matchedPatient)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                            >
                              {lang === 'fr' ? 'Fiche Patient' : 'Chart'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {visibleCount < filteredAppointments.length && (
          <div className="text-center pt-2">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-800/60 rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-lg"
            >
              <ChevronDown className="w-4 h-4" />
              {lang === 'fr'
                ? `Afficher 30 rendez-vous de plus (${filteredAppointments.length - visibleCount} restants)`
                : `Show 30 More Appointments (${filteredAppointments.length - visibleCount} remaining)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
