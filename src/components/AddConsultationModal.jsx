import React, { useState } from 'react';
import { X, Stethoscope, Plus, Pill, Trash2, Save, FileText } from 'lucide-react';
import { translations } from '../translations';

export default function AddConsultationModal({ isOpen, onClose, patient, onConsultationAdded, lang = 'fr' }) {
  if (!isOpen || !patient) return null;
  const t = translations[lang] || translations.fr;

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [vitalsAtVisit, setVitalsAtVisit] = useState(`BP: ${patient.vitals?.bloodPressure || '120/80'} | HR: ${patient.vitals?.heartRate || '72 bpm'}`);
  const [doctor, setDoctor] = useState('Dr. Sarah Jenkins, MD');
  const [department, setDepartment] = useState(patient.department || 'Cardiology');
  const [prescriptions, setPrescriptions] = useState([
    { name: '', dosage: '', frequency: 'Once daily', duration: '30 days' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddRxRow = () => {
    setPrescriptions([...prescriptions, { name: '', dosage: '', frequency: 'Once daily', duration: '30 days' }]);
  };

  const handleRemoveRxRow = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleRxChange = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chiefComplaint.trim() || !diagnosis.trim()) {
      setError('Chief Complaint and Diagnosis are mandatory.');
      return;
    }

    setLoading(true);
    setError('');

    const validRx = prescriptions.filter(r => r.name.trim().length > 0);

    try {
      const res = await fetch(`/api/patients/${patient.id}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint: chiefComplaint.trim(),
          diagnosis: diagnosis.trim(),
          clinicalNotes: clinicalNotes.trim(),
          prescriptions: validRx,
          doctor,
          department,
          vitalsAtVisit
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save consultation note.');
      }

      const newConsultation = await res.json();
      onConsultationAdded(newConsultation);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.modalNewConsultTitle || (lang === 'fr' ? 'Ajouter une Consultation / Note Clinique' : 'Add Consultation Note')}</h3>
              <p className="text-xs text-slate-400">Patient: <span className="text-teal-300 font-semibold">{patient.lastName} {patient.firstName} ({patient.mrn})</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 pt-0 space-y-4 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">{t.doctor || (lang === 'fr' ? 'Médecin Traitant' : 'Attending Physician')}</label>
              <select
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
              >
                <option value="Dr. A. BENKERMI Ep. TATI">Dr. A. BENKERMI Ep. TATI</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">{t.department || (lang === 'fr' ? 'Service' : 'Department')}</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">{t.chiefComplaint || (lang === 'fr' ? 'Motif de Consultation' : 'Chief Complaint')} *</label>
            <input
              type="text"
              required
              placeholder={lang === 'fr' ? 'ex: Douleurs otiques et vertiges depuis 3 jours.' : 'e.g. Patient reports ear pain for 3 days.'}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">{t.diagnosis || (lang === 'fr' ? 'Diagnostic & Évaluation Clinique' : 'Diagnosis')} *</label>
            <input
              type="text"
              required
              placeholder={lang === 'fr' ? 'ex: Otite moyenne aiguë' : 'e.g. Acute Otitis Media'}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Physician Progress & Evaluation Notes</label>
            <textarea
              rows="3"
              placeholder="Enter detailed clinical observations, physical exam findings, and follow-up plan..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Vitals Recorded At Visit</label>
            <input
              type="text"
              value={vitalsAtVisit}
              onChange={(e) => setVitalsAtVisit(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500"
            />
          </div>

          {/* Prescriptions Block */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase text-[11px] flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-400" /> Prescribe Medications
              </span>
              <button
                type="button"
                onClick={handleAddRxRow}
                className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Drug
              </button>
            </div>

            <div className="space-y-2">
              {prescriptions.map((rx, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 items-center">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Medication name"
                      value={rx.name}
                      onChange={(e) => handleRxChange(i, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 text-slate-100 border border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={rx.dosage}
                      onChange={(e) => handleRxChange(i, 'dosage', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 text-slate-100 border border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Frequency (e.g. Twice daily)"
                      value={rx.frequency}
                      onChange={(e) => handleRxChange(i, 'frequency', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 text-slate-100 border border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {prescriptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRxRow(i)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
              {loading ? (lang === 'fr' ? 'Enregistrement...' : 'Saving Note...') : (t.submitBtn || (lang === 'fr' ? 'Enregistrer la Consultation' : 'Save Consultation Entry'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
