import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle2, AlertCircle, User, Filter, ArrowUpRight, Search, ChevronDown, Loader2, Edit3, X, Save, List, Trash2 } from 'lucide-react';
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
  const [dateFilter, setDateFilter] = useState({ start: todayStr, end: todayStr });
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const [confirmArrivalApt, setConfirmArrivalApt] = useState(null);
  const [markingArrival, setMarkingArrival] = useState(false);

  const [editingApt, setEditingApt] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', reason: '', status: 'Scheduled' });
  const [savingEdit, setSavingEdit] = useState(false);

  const [clinicSettings, setClinicSettings] = useState(null);
  const [motifs, setMotifs] = useState([]);
  const [regions, setRegions] = useState([]);
  const [motifFilter, setMotifFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [listModal, setListModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemDesignation, setNewItemDesignation] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAddItem = async () => {
    if (!newItemDesignation.trim() || !listModal) return;
    setActionLoading(true);
    try {
      const endpoint = listModal.type === 'motif' ? '/api/motif_rdv' : '/api/region';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DESIGNATION: newItemDesignation.trim() })
      });
      if (!res.ok) throw new Error('Failed to create item');
      const created = await res.json();
      if (listModal.type === 'motif') {
        setMotifs(prev => [...prev, created]);
      } else {
        setRegions(prev => [...prev, created]);
      }
      setNewItemDesignation('');
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.designation.trim() || !listModal) return;
    setActionLoading(true);
    try {
      const endpoint = listModal.type === 'motif'
        ? `/api/motif_rdv/${editingItem.id}`
        : `/api/region/${editingItem.id}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DESIGNATION: editingItem.designation.trim() })
      });
      if (!res.ok) throw new Error('Failed to update item');
      if (listModal.type === 'motif') {
        setMotifs(prev => prev.map(m => {
          const id = m.ID_MOTIF_RDV ?? m.ID_MOTIF ?? m.id;
          return String(id) === String(editingItem.id)
            ? { ...m, DESIGNATION: editingItem.designation.trim() }
            : m;
        }));
      } else {
        setRegions(prev => prev.map(r => {
          const id = r.ID_REGION ?? r.ID_REG ?? r.id;
          return String(id) === String(editingItem.id)
            ? { ...r, DESIGNATION: editingItem.designation.trim() }
            : r;
        }));
      }
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cet élément ?' : 'Are you sure you want to delete this item?')) return;
    setActionLoading(true);
    try {
      const endpoint = listModal.type === 'motif'
        ? `/api/motif_rdv/${id}`
        : `/api/region/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      if (listModal.type === 'motif') {
        setMotifs(prev => prev.filter(m => {
          const mId = m.ID_MOTIF_RDV ?? m.ID_MOTIF ?? m.id;
          return String(mId) !== String(id);
        }));
        if (String(motifFilter) === String(id)) setMotifFilter('All');
      } else {
        setRegions(prev => prev.filter(r => {
          const rId = r.ID_REGION ?? r.ID_REG ?? r.id;
          return String(rId) !== String(id);
        }));
        if (String(regionFilter) === String(id)) setRegionFilter('All');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/clinic');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setClinicSettings(data);
        if (Number(data.MOTIF_RDV) === 2) {
          const [motifsRes, regionsRes] = await Promise.all([
            fetch('/api/motif_rdv'),
            fetch('/api/region')
          ]);
          if (!motifsRes.ok || !regionsRes.ok) {
            throw new Error('Failed to fetch motifs or regions');
          }
          const motifsData = await motifsRes.json();
          const regionsData = await regionsRes.json();
          setMotifs(motifsData);
          setRegions(regionsData);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

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
      const { start, end } = dateFilter;
      let matchesDate = true;
      if (start && end) {
        matchesDate = apt.date >= start && apt.date <= end;
      } else if (start) {
        matchesDate = apt.date >= start;
      } else if (end) {
        matchesDate = apt.date <= end;
      }
      const matchesStatus = filterStatus === 'All' || (apt.status && apt.status.toLowerCase() === filterStatus.toLowerCase());
      
      const isMotifEnabled = Number(clinicSettings?.MOTIF_RDV) === 2;
      const matchesMotif = !isMotifEnabled || motifFilter === 'All' || (apt.motifId && apt.motifId == motifFilter);
      const matchesRegion = !isMotifEnabled || regionFilter === 'All' || (apt.regionId && apt.regionId == regionFilter);

      const matchesSearch = !q ||
        (apt.patientName && apt.patientName.toLowerCase().includes(q)) ||
        (apt.mrn && String(apt.mrn).toLowerCase().includes(q)) ||
        (apt.patientId && String(apt.patientId).toLowerCase().includes(q)) ||
        (apt.codeBarre && String(apt.codeBarre).toLowerCase().includes(q)) ||
        (apt.codeMalade && String(apt.codeMalade).toLowerCase().includes(q)) ||
        (apt.num_rdv && String(apt.num_rdv).includes(q)) ||
        (apt.reason && apt.reason.toLowerCase().includes(q));

      return matchesDate && matchesStatus && matchesSearch && matchesMotif && matchesRegion;
    });
  }, [appointments, dateFilter, filterStatus, searchFilter, motifFilter, regionFilter, clinicSettings]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(30);
  }, [dateFilter, filterStatus, searchFilter, motifFilter, regionFilter]);

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
              <>Affichage de <span className="text-teal-400 font-semibold">{displayedAppointments.length}</span> sur {filteredAppointments.length} rendez-vous ({dateFilter.start || dateFilter.end ? `${dateFilter.start || ''}${dateFilter.start && dateFilter.end ? ' - ' : ''}${dateFilter.end || ''}` : 'Toutes les dates'})</>
            ) : (
              <>Showing <span className="text-teal-400 font-semibold">{displayedAppointments.length}</span> of {filteredAppointments.length} appointments ({dateFilter.start || dateFilter.end ? `${dateFilter.start || ''}${dateFilter.start && dateFilter.end ? ' - ' : ''}${dateFilter.end || ''}` : 'All Dates'})</>
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
              onClick={() => setDateFilter({ start: todayStr, end: todayStr })}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                (dateFilter.start === todayStr && dateFilter.end === todayStr)
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? "Aujourd'hui" : "Today"}
            </button>

            <button
              onClick={() => setDateFilter({ start: '', end: '' })}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                (!dateFilter.start && !dateFilter.end)
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
                value={dateFilter.start}
                onChange={(e) => setDateFilter(df => ({ ...df, start: e.target.value }))}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <span className="text-slate-500 text-xs">à</span>
            <div className="relative">
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(df => ({ ...df, end: e.target.value }))}
                min={dateFilter.start}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 border border-slate-800 rounded-xl">
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
            
            {Number(clinicSettings?.MOTIF_RDV) === 2 && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Motif Filter */}
                <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 border border-slate-800 rounded-xl">
                  <label className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Filter className="w-3 h-3 text-teal-400" />
                    {lang === 'fr' ? 'Motif :' : 'Reason:'}
                  </label>
                  <div className="relative">
                    <select
                      value={motifFilter}
                      onChange={(e) => setMotifFilter(e.target.value)}
                      className="appearance-none bg-slate-950 border border-slate-700/80 text-teal-300 text-xs font-semibold rounded-lg pl-3 pr-7 py-1 focus:outline-none focus:border-teal-500 cursor-pointer shadow-sm min-w-[130px] max-w-[220px] truncate"
                    >
                      <option value="All" className="bg-slate-900 text-slate-200">{lang === 'fr' ? 'Tous les motifs' : 'All reasons'}</option>
                      {motifs.map(m => {
                        const id = m.ID_MOTIF_RDV ?? m.ID_MOTIF ?? m.id;
                        if (id == null) return null;
                        return (
                          <option key={id} value={id} className="bg-slate-900 text-slate-200">
                            {m.DESIGNATION}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1.5 text-slate-400 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setListModal({ type: 'motif', search: '' });
                      setIsAddingNew(false);
                      setEditingItem(null);
                    }}
                    title={lang === 'fr' ? 'Voir la liste des motifs' : 'View motifs list'}
                    className="p-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-lg flex items-center justify-center transition shadow-sm"
                  >
                    <List className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Region Filter */}
                <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 border border-slate-800 rounded-xl">
                  <label className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Filter className="w-3 h-3 text-teal-400" />
                    {lang === 'fr' ? 'Région :' : 'Region:'}
                  </label>
                  <div className="relative">
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="appearance-none bg-slate-950 border border-slate-700/80 text-teal-300 text-xs font-semibold rounded-lg pl-3 pr-7 py-1 focus:outline-none focus:border-teal-500 cursor-pointer shadow-sm min-w-[130px] max-w-[220px] truncate"
                    >
                      <option value="All" className="bg-slate-900 text-slate-200">{lang === 'fr' ? 'Toutes les régions' : 'All regions'}</option>
                      {regions.map(r => {
                        const id = r.ID_REGION ?? r.ID_REG ?? r.id;
                        if (id == null) return null;
                        return (
                          <option key={id} value={id} className="bg-slate-900 text-slate-200">
                            {r.DESIGNATION}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1.5 text-slate-400 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setListModal({ type: 'region', search: '' });
                      setIsAddingNew(false);
                      setEditingItem(null);
                    }}
                    title={lang === 'fr' ? 'Voir la liste des régions' : 'View regions list'}
                    className="p-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-lg flex items-center justify-center transition shadow-sm"
                  >
                    <List className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
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
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] text-teal-400">{apt.type || 'En Présentiel'}</span>
                            {apt.periode && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/15 text-teal-300 border border-teal-500/30 rounded-md text-[10px] font-bold font-mono">
                                <span className="text-teal-400">⏱️</span>
                                <span>{apt.periode}</span>
                              </span>
                            )}
                          </div>
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

      {/* List Modal for Motifs & Regions */}
      {listModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <List className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {listModal.type === 'motif'
                      ? (lang === 'fr' ? 'Liste des Motifs de Rendez-vous' : 'Appointment Reasons List')
                      : (lang === 'fr' ? 'Liste des Régions' : 'Regions List')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(listModal.type === 'motif' ? motifs.length : regions.length)} {lang === 'fr' ? 'éléments répertoriés' : 'listed items'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingNew(prev => !prev)}
                  className="px-3 py-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  title={lang === 'fr' ? 'Ajouter un élément' : 'Add item'}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{lang === 'fr' ? 'Nouveau' : 'New'}</span>
                </button>
                <button
                  onClick={() => { setListModal(null); setEditingItem(null); setIsAddingNew(false); }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Search Bar & Optional Add Card */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Rechercher par désignation...' : 'Search by name...'}
                  value={listModal.search || ''}
                  onChange={(e) => setListModal(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 text-slate-100 text-xs rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-slate-500 transition"
                  autoFocus
                />
              </div>

              {/* Add New Item Input Row */}
              {isAddingNew && (
                <div className="p-3 bg-teal-950/40 border border-teal-500/40 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-teal-400" />
                    {listModal.type === 'motif' ? (lang === 'fr' ? 'Ajouter un nouveau Motif' : 'Add New Reason') : (lang === 'fr' ? 'Ajouter une nouvelle Région' : 'Add New Region')}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={lang === 'fr' ? 'Entrez la désignation...' : 'Enter designation...'}
                      value={newItemDesignation}
                      onChange={(e) => setNewItemDesignation(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-teal-500"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
                      autoFocus
                    />
                    <button
                      onClick={handleAddItem}
                      disabled={actionLoading || !newItemDesignation.trim()}
                      className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shrink-0"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{lang === 'fr' ? 'Enregistrer' : 'Save'}</span>
                    </button>
                    <button
                      onClick={() => { setIsAddingNew(false); setNewItemDesignation(''); }}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {(() => {
                const items = listModal.type === 'motif' ? motifs : regions;
                const searchQ = (listModal.search || '').toLowerCase().trim();
                const filteredItems = items.filter(item => {
                  const des = (item.DESIGNATION || '').toLowerCase();
                  return !searchQ || des.includes(searchQ);
                });

                if (filteredItems.length === 0) {
                  return (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      {lang === 'fr' ? 'Aucun résultat correspondant.' : 'No matching items.'}
                    </div>
                  );
                }

                return filteredItems.map(item => {
                  const id = listModal.type === 'motif'
                    ? (item.ID_MOTIF_RDV ?? item.ID_MOTIF ?? item.id)
                    : (item.ID_REGION ?? item.ID_REG ?? item.id);
                  const isSelected = listModal.type === 'motif'
                    ? String(motifFilter) === String(id)
                    : String(regionFilter) === String(id);
                  const isEditingThis = editingItem && String(editingItem.id) === String(id);

                  const count = appointments.filter(apt => {
                    return listModal.type === 'motif'
                      ? (apt.motifId && String(apt.motifId) === String(id))
                      : (apt.regionId && String(apt.regionId) === String(id));
                  }).length;

                  return (
                    <div
                      key={id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-500/20 border-teal-500/50 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-mono text-xs text-teal-400 font-bold px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 shrink-0">
                            #{id}
                          </span>
                          <input
                            type="text"
                            value={editingItem.designation}
                            onChange={(e) => setEditingItem({ ...editingItem, designation: e.target.value })}
                            className="flex-1 px-3 py-1 bg-slate-900 border border-teal-500 text-slate-100 text-xs rounded-lg focus:outline-none"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateItem(); }}
                            autoFocus
                          />
                          <button
                            onClick={handleUpdateItem}
                            disabled={actionLoading || !editingItem.designation.trim()}
                            className="p-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition shrink-0"
                            title={lang === 'fr' ? 'Enregistrer' : 'Save'}
                          >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition shrink-0"
                            title={lang === 'fr' ? 'Annuler' : 'Cancel'}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            onClick={() => {
                              if (listModal.type === 'motif') setMotifFilter(id);
                              else setRegionFilter(id);
                              setListModal(null);
                            }}
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                          >
                            <span className="font-mono text-xs text-teal-400 font-bold px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 shrink-0">
                              #{id}
                            </span>
                            <span className="text-xs font-semibold truncate">{item.DESIGNATION}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 mr-1">
                              {count} {lang === 'fr' ? 'RDV' : 'Appt(s)'}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                if (listModal.type === 'motif') setMotifFilter(id);
                                else setRegionFilter(id);
                                setListModal(null);
                              }}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                                isSelected
                                  ? 'bg-teal-500 text-slate-950 shadow'
                                  : 'bg-slate-800 text-slate-300 hover:bg-teal-500/20 hover:text-teal-300'
                              }`}
                            >
                              {isSelected ? (lang === 'fr' ? 'Sélectionné' : 'Selected') : (lang === 'fr' ? 'Filtrer' : 'Filter')}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem({ id, designation: item.DESIGNATION });
                              }}
                              title={lang === 'fr' ? 'Modifier' : 'Edit'}
                              className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteItem(id, e)}
                              title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (listModal.type === 'motif') {
                    setMotifFilter('All');
                  } else {
                    setRegionFilter('All');
                  }
                  setListModal(null);
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700/60"
              >
                {lang === 'fr' ? 'Réinitialiser le filtre' : 'Reset filter'}
              </button>
              <button
                type="button"
                onClick={() => { setListModal(null); setEditingItem(null); setIsAddingNew(false); }}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 rounded-xl shadow-lg shadow-teal-500/20 transition"
              >
                {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
