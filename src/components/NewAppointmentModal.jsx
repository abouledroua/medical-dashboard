import React, { useState } from 'react';
import { X, Calendar, Clock, User, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';
import { translations } from '../translations';

export default function NewAppointmentModal({ isOpen, onClose, patients, defaultPatient, onAppointmentCreated, lang = 'fr' }) {
  if (!isOpen) return null;
  const t = translations[lang] || translations.fr;

  const [patientId, setPatientId] = useState(defaultPatient ? defaultPatient.id : (patients[0]?.id || ''));
  const [date, setDate] = useState('2026-07-27');
  const [time, setTime] = useState('10:00 AM');
  const [doctor, setDoctor] = useState('Dr. Sarah Jenkins, MD');
  const [department, setDepartment] = useState('Cardiology');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('In-Person');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId || !date || !reason.trim()) {
      setError('Please select a patient, date, and enter the reason for visit.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          date,
          time,
          doctor,
          department,
          reason: reason.trim(),
          type
        })
      });

      if (!res.ok) {
        throw new Error('Failed to schedule appointment.');
      }

      const newApt = await res.json();
      onAppointmentCreated(newApt);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden space-y-4">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">{t.modalNewApptTitle || (lang === 'fr' ? 'Programmer un Nouveau Rendez-vous' : 'Schedule New Appointment')}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 pt-0 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">{t.selectPatient || (lang === 'fr' ? 'Sélectionner un Patient' : 'Select Patient')} *</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.lastName} {p.firstName} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">{lang === 'fr' ? 'Date du Rendez-vous' : 'Appointment Date'} *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">{t.time || (lang === 'fr' ? 'Heure' : 'Time')} *</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="09:30 AM">09:30 AM</option>
                <option value="10:15 AM">10:15 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="01:30 PM">01:30 PM</option>
                <option value="02:45 PM">02:45 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">{t.doctor || (lang === 'fr' ? 'Médecin Traitant' : 'Physician')}</label>
              <select
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
              >
                <option value="Dr. A. BENKERMI Ep. TATI">Dr. A. BENKERMI Ep. TATI</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">{t.type || (lang === 'fr' ? 'Type de Visite' : 'Visit Type')}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
              >
                <option value="In-Person">{lang === 'fr' ? 'En Présentiel' : 'In-Person Visit'}</option>
                <option value="Follow-up">{lang === 'fr' ? 'Suivi' : 'Follow-up'}</option>
                <option value="Telehealth">{lang === 'fr' ? 'Téléconsultation' : 'Telehealth'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">{t.reason || (lang === 'fr' ? 'Motif RDV' : 'Reason for Visit')} *</label>
            <input
              type="text"
              required
              placeholder={lang === 'fr' ? 'ex: Consultation ORL de contrôle' : 'e.g. Follow-up consultation'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold border border-slate-700"
            >
              {t.cancelBtn || (lang === 'fr' ? 'Annuler' : 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
            >
              {loading ? (lang === 'fr' ? 'Enregistrement...' : 'Booking...') : (lang === 'fr' ? 'Confirmer le RDV' : 'Confirm Appointment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
