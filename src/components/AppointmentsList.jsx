import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle2, AlertCircle, User, Filter, ArrowUpRight, Search, ChevronDown, Loader2, Edit3, X, Save } from 'lucide-react';
import { translations } from '../translations';

export default function AppointmentsList({
  appointments,
  patients,
  onOpenNewAppointment,
  onOpenEditAppointment,
  onUpdateAppointmentStatus,
  onEditAppointment,
  onSelectPatient,
  lang = 'fr'
}) {
  const t = translations[lang] || translations.fr;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [dateFilter, setDateFilter] = useState(todayStr); // Always default to Today's local date
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const [confirmArrivalApt, setConfirmArrivalApt] = useState(null);
  const [markingArrival, setMarkingArrival] = useState(false);

  const [editingApt, setEditingApt] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', reason: '', status: 'Scheduled' });
  const [savingEdit, setSavingEdit] = useState(false);

  const handleStartEdit = (apt) => {
    setEditingApt(apt);
    setEditForm({
      date: apt.date || todayStr,
      reason: apt.reason || '',
      status: apt.status || 'Scheduled'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingApt) return;
    setSavingEdit(true);
    try {
      if (onEditAppointment) {
        await onEditAppointment(editingApt.id, editForm);
      }
      setEditingApt(null);
    } catch (err) {
      console.error('Failed to update appointment:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmArrival = async () => {
    if (!confirmArrivalApt) return;
    setMarkingArrival(true);
    try {
      await onUpdateAppointmentStatus(confirmArrivalApt.id, 'In Progress');
    } catch (err) {
      console.error('Failed to mark arrival:', err);
    } finally {
      setMarkingArrival(false);
      setConfirmArrivalApt(null);
    }
  };

  // Memoize filtered results for instant response
  const filteredAppointments = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    return appointments.filter(apt => {
      const matchesDate = !dateFilter || apt.date === dateFilter;
      const matchesStatus = filterStatus === 'All' || (apt.status && apt.status.toLowerCase() === filterStatus.toLowerCase());
      const matchesSearch = !q ||
        (apt.patientName && apt.patientName.toLowerCase().includes(q)) ||
        (apt.mrn && String(apt.mrn).toLowerCase().includes(q)) ||
        (apt.patientId && String(apt.patientId).toLowerCase().includes(q)) ||
        (apt.codeBarre && String(apt.codeBarre).toLowerCase().includes(q)) ||
        (apt.codeMalade && String(apt.codeMalade).toLowerCase().includes(q)) ||
        (apt.num_rdv && String(apt.num_rdv).includes(q)) ||
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
              placeholder={lang === 'fr' ? "Rechercher par Nom, Barcode, N° RDV..." : "Search by Name, Barcode, Appt N°..."}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 text-slate-100 text-xs border border-slate-700/70 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-slate-500 transition"
            />
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDateFilter(todayStr)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                dateFilter === todayStr
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? "Aujourd'hui" : "Today"}
            </button>

            <button
              onClick={() => setDateFilter('')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                dateFilter === ''
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? 'Toutes les Dates' : 'All Dates'}
            </button>

            {/* Custom Date Input */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 border border-slate-800 rounded-xl">
            {['All', 'Scheduled', 'In Progress', 'Completed'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  filterStatus === st
                    ? 'bg-teal-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'All' ? (lang === 'fr' ? 'Tous' : 'All') : st === 'Scheduled' ? (lang === 'fr' ? 'Programmés' : 'Scheduled') : st === 'In Progress' ? (lang === 'fr' ? 'Arrivés' : 'In Progress') : (lang === 'fr' ? 'Terminés' : 'Completed')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments List View */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'fr' ? 'Liste des Rendez-vous' : 'Appointment Queue'}
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-400">
            {filteredAppointments.length} {lang === 'fr' ? 'résultats' : 'results'}
          </span>
        </div>

        <div>
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
              <p className="text-sm font-semibold">{lang === 'fr' ? 'Aucun rendez-vous trouvé pour ces critères' : 'No appointments found for selected filters'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 text-center font-bold text-slate-300">
                      <span className="inline-flex items-center gap-1 text-teal-400">
                        <span>N° RDV</span>
                      </span>
                    </th>
                    <th className="py-3.5 px-4 font-bold text-slate-300">
                      <span className="inline-flex items-center gap-1 text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{lang === 'fr' ? 'Heure & Date' : 'Time & Date'}</span>
                      </span>
                    </th>
                    <th className="py-3.5 px-4 font-bold text-slate-300">{lang === 'fr' ? 'Patient' : 'Patient'}</th>
                    <th className="py-3.5 px-4 font-bold text-slate-300">{lang === 'fr' ? 'Motif RDV' : 'Reason'}</th>
                    <th className="py-3.5 px-4 font-bold text-slate-300">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-right font-bold text-slate-300">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {displayedAppointments.map((apt, index) => {
                    const matchedPatient = patients.find(p => p.id === apt.patientId || p.codeBarre === apt.patientId || p.mrn === apt.mrn);
                    const rawNumRdv = Number(apt.num_rdv);
                    const hasNumRdv = Boolean(rawNumRdv && rawNumRdv !== 0);
                    const isToday = apt.date === todayStr;
                    const isTimeEmpty = !apt.time || String(apt.time).trim() === '';

                    return (
                      <tr key={apt.id || index} className="hover:bg-slate-800/50 transition duration-150">
                        {/* N° Appt - Highlighted & Weighted Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {hasNumRdv ? (
                            <span className="inline-flex items-center justify-center min-w-[2.75rem] px-3 py-1.5 bg-gradient-to-r from-teal-500/20 via-teal-400/20 to-cyan-500/20 text-teal-200 border border-teal-400/50 rounded-xl font-mono text-sm font-black shadow-md shadow-teal-500/10 tracking-tight">
                              <span className="text-teal-400 text-xs font-extrabold mr-0.5">N°</span>
                              <span>{rawNumRdv}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs font-mono">-</span>
                          )}
                        </td>

                        {/* Time of Appt & Date */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            {apt.time ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-400/40 rounded-xl font-mono shadow-sm tracking-wide">
                                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 stroke-[2.5]" />
                                <span className="text-sm font-black text-amber-200">{apt.time}</span>
                              </div>
                            ) : null}
                            <div className="text-xs font-mono font-bold text-teal-300 flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                              <span>{apt.date}</span>
                            </div>
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
                          {isToday && isTimeEmpty && (
                            <button
                              onClick={() => setConfirmArrivalApt(apt)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold border border-emerald-400/50 shadow-md shadow-emerald-500/20 transition inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              {lang === 'fr' ? "Marquer l'Arrivée" : "Mark Arrived"}
                            </button>
                          )}

                          <button
                            onClick={() => onOpenEditAppointment ? onOpenEditAppointment(apt) : handleStartEdit(apt)}
                            className="px-2.5 py-1 bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 rounded-lg text-xs font-bold border border-teal-800/60 transition inline-flex items-center gap-1"
                            title={lang === 'fr' ? 'Modifier le rendez-vous' : 'Edit appointment'}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                            {lang === 'fr' ? 'Éditer' : 'Edit'}
                          </button>

                          <button
                            onClick={() => {
                              const targetPat = matchedPatient || {
                                id: apt.patientId || apt.mrn,
                                codeBarre: apt.patientId,
                                mrn: apt.mrn,
                                lastName: apt.patientName,
                                firstName: ''
                              };
                              onSelectPatient(targetPat);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                          >
                            {lang === 'fr' ? 'Fiche Patient' : 'Patient Record'}
                          </button>
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
          <div className="text-center pt-2 pb-4">
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

      {/* Confirmation Dialog Box for Patient Arrival */}
      {confirmArrivalApt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'fr' ? "Confirmer l'arrivée du patient" : "Confirm Patient Arrival"}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'fr' ? "Enregistrement de l'heure d'arrivée" : "Record patient check-in time"}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {lang === 'fr' ? (
                <>Êtes-vous sûr que le patient <span className="text-teal-300 font-extrabold bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-800/60 mx-1">{confirmArrivalApt.patientName}</span> est arrivé à la clinique ?</>
              ) : (
                <>Are you sure that patient <span className="text-teal-300 font-extrabold bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-800/60 mx-1">{confirmArrivalApt.patientName}</span> has arrived at the clinic?</>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmArrivalApt(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                {lang === 'fr' ? "Annuler" : "Cancel"}
              </button>
              <button
                onClick={handleConfirmArrival}
                disabled={markingArrival}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
              >
                {markingArrival && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {lang === 'fr' ? "Oui, Confirmer l'Arrivée" : "Yes, Confirm Arrival"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {editingApt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg font-bold text-white">
                  {lang === 'fr' ? 'Modifier le Rendez-vous' : 'Edit Appointment'}
                </h3>
              </div>
              <button
                onClick={() => setEditingApt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {lang === 'fr' ? 'Patient' : 'Patient'}
                </label>
                <input
                  type="text"
                  disabled
                  value={editingApt.patientName}
                  className="w-full px-3 py-2 bg-slate-950/80 text-slate-300 text-xs border border-slate-800 rounded-xl cursor-not-allowed font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {lang === 'fr' ? 'Date du Rendez-vous' : 'Appointment Date'}
                </label>
                <input
                  type="date"
                  required
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 text-xs border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {lang === 'fr' ? 'Statut du Rendez-vous' : 'Appointment Status'}
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 text-xs border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="Scheduled">{lang === 'fr' ? 'Programmé' : 'Scheduled'}</option>
                  <option value="In Progress">{lang === 'fr' ? 'En cours / Arrivé' : 'In Progress'}</option>
                  <option value="Completed">{lang === 'fr' ? 'Terminé' : 'Completed'}</option>
                  <option value="Canceled">{lang === 'fr' ? 'Annulé' : 'Canceled'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {lang === 'fr' ? 'Motif du Rendez-vous' : 'Reason / Note'}
                </label>
                <textarea
                  rows={3}
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder={lang === 'fr' ? 'Entrez le motif ou des détails...' : 'Enter reason or notes...'}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 text-xs border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20 transition flex items-center gap-1.5"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {lang === 'fr' ? 'Enregistrer les modifications' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
