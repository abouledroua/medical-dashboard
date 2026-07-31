import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Search } from 'lucide-react';
import { translations } from '../translations';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { debounce } from '../utils.js';

export default function NewAppointmentModal({ isOpen, onClose, patients, defaultPatient, appointmentToEdit, onAppointmentCreated, onAppointmentUpdated, lang = 'fr', clinicInfo }) {
  if (!isOpen) return null;
  const t = translations[lang] || translations.fr;

  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientListOpen, setIsPatientListOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [date, setDate] = useState(new Date());
  const [month, setMonth] = useState(date);
  const [reason, setReason] = useState('');
  const [motifId, setMotifId] = useState('');
  const [regionId, setRegionId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaveDays, setLeaveDays] = useState([]);
  
  const [motifsList, setMotifsList] = useState([]);
  const [regionsList, setRegionsList] = useState([]);

  useEffect(() => {
    if (appointmentToEdit) {
      setPatientId(appointmentToEdit.patientId || appointmentToEdit.mrn || '');
      setPatientSearch(appointmentToEdit.patientName || '');
      if (appointmentToEdit.date) {
        const parsedDate = new Date(appointmentToEdit.date.replace(/-/g, '/'));
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
          setMonth(parsedDate);
        }
      }
      setReason(appointmentToEdit.reason || '');
      setMotifId(appointmentToEdit.motifId ? String(appointmentToEdit.motifId) : '');
      setRegionId(appointmentToEdit.regionId ? String(appointmentToEdit.regionId) : '');
    } else if (defaultPatient) {
      setPatientId(defaultPatient.id || defaultPatient.codeBarre || '');
      setPatientSearch(`${defaultPatient.lastName || ''} ${defaultPatient.firstName || ''}`.trim());
      setMotifId('');
      setRegionId('');
    } else {
      setPatientId('');
      setPatientSearch('');
      setReason('');
      setMotifId('');
      setRegionId('');
    }
  }, [appointmentToEdit, defaultPatient, isOpen]);

  const findNextAvailableDate = useCallback((startDate, daysToSkip) => {
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    while (daysToSkip.includes(currentDate.getDay())) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return currentDate;
  }, []);

  useEffect(() => {
    setMonth(date);
  }, [date]);

  useEffect(() => {
    async function fetchHoraire() {
      try {
        const res = await fetch('/api/horaire');
        const data = await res.json();
        const offDays = data.filter(d => d.CONGE === 1).map(d => {
          const dayName = d.JOUR.toUpperCase();
          if (dayName.includes('DIMANCHE') || dayName.includes('SUNDAY')) return 0;
          if (dayName.includes('LUNDI') || dayName.includes('MONDAY')) return 1;
          if (dayName.includes('MARDI') || dayName.includes('TUESDAY')) return 2;
          if (dayName.includes('MERCREDI') || dayName.includes('WEDNESDAY')) return 3;
          if (dayName.includes('JEUDI') || dayName.includes('THURSDAY')) return 4;
          if (dayName.includes('VENDREDI') || dayName.includes('FRIDAY')) return 5;
          if (dayName.includes('SAMEDI') || dayName.includes('SATURDAY')) return 6;
          return -1;
        }).filter(d => d !== -1);
        setLeaveDays(offDays);
      } catch (err) {
        console.error("Failed to fetch horaire", err);
      }
    }
    fetchHoraire();
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [motifsRes, regionsRes] = await Promise.all([
        fetch('/api/motif_rdv'),
        fetch('/api/region')
      ]);
      if (motifsRes.ok) setMotifsList(await motifsRes.json());
      if (regionsRes.ok) setRegionsList(await regionsRes.json());
    } catch (err) {
      console.error("Failed to fetch motifs or regions", err);
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  useEffect(() => {
    if (appointmentToEdit) return; // Do not auto-override date if editing existing appointment

    if (leaveDays.length === 0) {
      setDate(new Date());
      setMonth(new Date());
      return;
    };

    if (patientId) {
      const fetchAppointments = async () => {
        try {
          const res = await fetch(`/api/appointments?patientId=${patientId}`);
          const appointments = await res.json();
          const activeAppointment = appointments.find(apt => {
            const aptDate = new Date(apt.date.replace(/-/g, '/'));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isFutureOrToday = aptDate >= today;
            const isActiveStatus = apt.status === 'Scheduled' || apt.status === 'In Progress';
            
            return isActiveStatus && isFutureOrToday;
          });
          if (activeAppointment && activeAppointment.date) {
            const newDate = new Date(activeAppointment.date.replace(/-/g, '/'));
            setDate(newDate);
            setMonth(newDate);
          } else {
            const nextAvailableDate = findNextAvailableDate(new Date(), leaveDays);
            setDate(nextAvailableDate);
            setMonth(nextAvailableDate);
          }
        } catch (err) {
          console.error("Failed to fetch patient appointments", err);
        }
      };
      fetchAppointments();
    } else {
      const nextAvailableDate = findNextAvailableDate(new Date(), leaveDays);
      setDate(nextAvailableDate);
      setMonth(nextAvailableDate);
    }
  }, [patientId, leaveDays, findNextAvailableDate, appointmentToEdit]);

  const searchPatients = async (query) => {
    if (!query || query.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Failed to search patients", err);
    }
  };
  
  const debouncedSearch = useCallback(debounce(searchPatients, 300), []);

  useEffect(() => {
    if (patientSearch) {
      debouncedSearch(patientSearch);
    } else {
      setSearchResults([]);
    }
  }, [patientSearch, debouncedSearch]);

  const handlePatientSelect = (patient) => {
    setPatientId(patient.id);
    setPatientSearch(`${patient.lastName} ${patient.firstName}`);
    setIsPatientListOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalReason = reason.trim();

    if (clinicInfo?.MOTIF_RDV === 2) {
      if (motifId === '' || regionId === '') {
        setError('Please select a motif and a region.');
        return;
      }
      const selectedMotif = motifsList.find(m => m.ID_MOTIF === parseInt(motifId));
      const selectedRegion = regionsList.find(r => r.ID_REGION === parseInt(regionId));
      finalReason = `Motif: ${selectedMotif?.DESIGNATION}, Région: ${selectedRegion?.DESIGNATION}`;
    }

    if (!patientId || !date) {
      setError('Please select a patient and date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const body = {
        patientId,
        date: formattedDate,
        time: '09:00:00',
        reason: finalReason,
        motifId,
        regionId,
        status: appointmentToEdit ? (appointmentToEdit.status || 'Scheduled') : 'Scheduled'
      };

      if (appointmentToEdit) {
        const res = await fetch(`/api/appointments/${appointmentToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to update appointment.');
        }

        if (onAppointmentUpdated) {
          await onAppointmentUpdated(appointmentToEdit.id, body);
        }
      } else {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to schedule appointment.');
        }

        const newApt = await res.json();
        onAppointmentCreated(newApt);
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const disabledDays = [
    { before: new Date() },
    ...leaveDays.map(day => ({ dayOfWeek: day })),
  ];

  const displayPatients = patientSearch.length > 1 ? searchResults : patients;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">
              {appointmentToEdit
                ? (lang === 'fr' ? 'Modifier le Rendez-vous' : 'Edit Appointment')
                : (t.modalNewApptTitle || (lang === 'fr' ? 'Nouveau Rendez-vous' : 'Schedule New Appointment'))}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="relative">
            <label className="block text-slate-300 font-medium mb-1">{t.selectPatient || 'Select Patient'} *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => { setPatientSearch(e.target.value); setIsPatientListOpen(true); }}
                onFocus={() => setIsPatientListOpen(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setIsPatientListOpen(false);
                    // Check for exact barcode match
                    const exactMatch = displayPatients.find(p => p.codeBarre.toLowerCase() === patientSearch.toLowerCase());
                    if (exactMatch && patientSearch.length > 0) {
                      handlePatientSelect(exactMatch);
                    } else if (patientSearch.length > 0 && !patientId) { // Clear if no exact match and input is not empty and no patient is selected
                      setPatientSearch('');
                      setPatientId('');
                    }
                  }, 200);
                }}
                placeholder={t.searchPatientPlaceholder || 'Search by name, MRN, or Barcode...'}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
              />
            </div>
            {isPatientListOpen && (
              <div className="absolute z-10 w-full max-h-48 overflow-y-auto mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                {displayPatients.map(p => (
                  <div
                    key={p.id}
                    onMouseDown={() => handlePatientSelect(p)}
                    className="px-4 py-2 text-sm text-slate-200 hover:bg-teal-500/20 cursor-pointer"
                  >
                    {p.lastName} {p.firstName} ({p.mrn})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2 flex flex-col items-center">
              <label className="block text-slate-300 font-medium self-start">{lang === 'fr' ? 'Date du Rendez-vous' : 'Appointment Date'}</label>
              <div className="flex flex-col items-center w-full">
                <DayPicker
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => { if (newDate) setDate(newDate); }}
                  month={month}
                  onMonthChange={setMonth}
                  disabled={disabledDays}
                  className="bg-slate-900 p-2 rounded-xl border border-slate-700 text-sm"
                  classNames={{
                    caption: "flex justify-center items-center mb-2 text-sm",
                    caption_label: "text-sm font-bold text-white",
                    nav_button: "h-6 w-6 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-300",
                    head_row: "flex justify-around text-slate-400 mb-1 text-sm",
                    cell: "w-8 h-8 flex items-center justify-center rounded-full",
                    day: "hover:bg-slate-800 cursor-pointer",
                    day_selected: "bg-teal-500 text-slate-950 font-bold hover:bg-teal-600",
                    day_today: "font-bold text-teal-400",
                    day_disabled: "text-slate-600 cursor-not-allowed",
                  }}
                  modifiers={{
                    leave: leaveDays.map(day => ({ dayOfWeek: day }))
                  }}
                  modifiersStyles={{
                    leave: { color: '#f77' }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setMonth(today);
                    const isTodayOnLeave = leaveDays.includes(today.getDay());
                    if (!isTodayOnLeave) {
                      setDate(today);
                    } else {
                      const nextDate = findNextAvailableDate(today, leaveDays);
                      setDate(nextDate);
                    }
                  }}
                  className="mt-2 text-xs text-teal-400 hover:text-teal-300 font-bold hover:underline flex items-center gap-1 cursor-pointer transition px-3 py-1 bg-slate-900/80 rounded-lg border border-slate-700/80 shadow-sm"
                >
                  📅 {lang === 'fr' ? "Aujourd'hui" : "Today"}
                </button>
              </div>
            </div>
          </div>

          {clinicInfo?.MOTIF_RDV === 2 ? (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Motif *</label>
                <div className="w-full bg-slate-900 border border-slate-700 rounded-xl focus-within:border-teal-500">
                  <select
                    value={motifId}
                    onChange={(e) => setMotifId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-transparent text-slate-100 outline-none"
                  >
                    <option value="" disabled>Select a motif</option>
                    {motifsList.map(m => <option key={m.ID_MOTIF} value={m.ID_MOTIF} className="bg-slate-800 text-slate-100">{m.DESIGNATION}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Région *</label>
                <div className="w-full bg-slate-900 border border-slate-700 rounded-xl focus-within:border-teal-500">
                  <select
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-transparent text-slate-100 outline-none"
                  >
                    <option value="" disabled>Select a region</option>
                    {regionsList.map(r => <option key={r.ID_REGION} value={r.ID_REGION} className="bg-slate-800 text-slate-100">{r.DESIGNATION}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-300 font-medium mb-1">{t.reason || 'Reason for Visit'}</label>
              <input
                type="text"
                placeholder={lang === 'fr' ? 'ex: Consultation ORL de contrôle' : 'e.g. Follow-up consultation'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
              />
            </div>
          )}
          </div>
          <div className="p-5 pt-3 flex items-center justify-end gap-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold border border-slate-700"
            >
              {t.cancelBtn || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
            >
              {loading
                ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...')
                : (appointmentToEdit
                    ? (lang === 'fr' ? 'Enregistrer les modifications' : 'Save Changes')
                    : (lang === 'fr' ? 'Confirmer le RDV' : 'Confirm Appointment'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
