import React, { useState, useEffect } from 'react';
import { FileText, Stethoscope, Heart, Activity, AlertTriangle, Plus, Calendar, Clock, Pill, User, ShieldAlert, Phone, ChevronRight, CheckCircle2, RefreshCw, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { translations } from '../translations';
import PatientOverviewPanel from './PatientOverviewPanel';

export default function PatientMedicalHistory({
  selectedPatient,
  onSelectPatient,
  allPatients,
  onOpenNewConsultation,
  onOpenNewAppointment,
  onEditPatient,
  onSelectTab,
  lang = 'fr'
}) {
  const t = translations[lang] || translations.fr;
  const [patientData, setPatientData] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedConsults, setExpandedConsults] = useState({});

  const toggleExpandConsult = (id) => {
    setExpandedConsults(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id] // Default true (expanded), click to collapse
    }));
  };

  const toggleAllConsults = (expand) => {
    const newStates = {};
    consultations.forEach(c => {
      newStates[c.id] = expand;
    });
    setExpandedConsults(newStates);
  };

  const currentPatient = selectedPatient;

  // Fetch full details with silent update option
  const fetchPatientDetails = (silent = false) => {
    if (!currentPatient) return;

    const patId = currentPatient.id || currentPatient.codeBarre || currentPatient.mrn;
    if (!patId) return;

    if (!silent) setLoading(true);

    fetch(`/api/patients/${encodeURIComponent(patId)}`)
      .then(res => {
        if (!res.ok) throw new Error('Patient not found');
        return res.json();
      })
      .then(data => {
        if (data && !data.error) {
          setPatientData(data);
          setConsultations(data.consultations || []);
        }
      })
      .catch(err => {
        if (!silent) console.error('Failed to load patient history:', err);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  // 1. Initial fetch whenever currentPatient changes
  useEffect(() => {
    setPatientData(null);
    setConsultations([]);
    fetchPatientDetails(false);
  }, [currentPatient]);

  // 2. Automatic real-time multi-PC auto-sync (5s silent polling + focus/visibility triggers)
  useEffect(() => {
    if (!currentPatient) return;

    const interval = setInterval(() => {
      fetchPatientDetails(true);
    }, 5000);

    const handleSync = () => {
      fetchPatientDetails(true);
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
    };
  }, [currentPatient]);

  if (!currentPatient) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3 max-w-md mx-auto my-16">
        <User className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-white">
          {lang === 'fr' ? 'Aucun patient sélectionné' : 'No Patient Selected'}
        </h3>
        <p className="text-xs text-slate-400">
          {lang === 'fr' ? 'Veuillez sélectionner un patient dans la liste pour consulter son dossier médical.' : 'Please select a patient to view their medical history.'}
        </p>
      </div>
    );
  }

  const p = patientData || currentPatient || {};
  const lastName = p.lastName || '';
  const firstName = p.firstName || '';
  const initialLast = lastName.length > 0 ? lastName[0].toUpperCase() : 'P';
  const initialFirst = firstName.length > 0 ? firstName[0].toUpperCase() : '';
  const initials = `${initialLast}${initialFirst}`;

  const rawFiltered = (consultations || []).filter(c => {
    if (!c) return false;
    if (c.status === 'Canceled' || Number(c.etat) === 2) return false;

    const hasComplaint = Boolean(c.chiefComplaint && String(c.chiefComplaint).trim());
    const hasDiag = Boolean(c.diagnosis && String(c.diagnosis).trim() && String(c.diagnosis).trim() !== 'Consultation');
    const hasNotes = Boolean(c.clinicalNotes && String(c.clinicalNotes).trim());
    const hasArret = Boolean(c.hasArretDeTravail && c.arretDeTravail);
    const hasRx = Boolean(c.prescriptions && Array.isArray(c.prescriptions) && c.prescriptions.length > 0);

    return hasComplaint || hasDiag || hasNotes || hasArret || hasRx;
  });

  const seenIds = new Set();
  const sortedConsultations = [];

  for (const item of rawFiltered) {
    const itemKey = item.id || `${item.date}-${item.chiefComplaint || ''}-${item.diagnosis || ''}`;
    if (!seenIds.has(itemKey)) {
      seenIds.add(itemKey);
      sortedConsultations.push(item);
    }
  }

  sortedConsultations.sort((a, b) => {
    const dateA = String(a.date || a.DATE_CONSULTATION || '');
    const dateB = String(b.date || b.DATE_CONSULTATION || '');
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  return (
    <div className="space-y-6">
      {/* Top Selector Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-lg shadow-teal-500/20">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{lastName} {firstName}</h2>
              <span className="font-mono text-xs bg-slate-900 text-teal-400 px-2 py-0.5 rounded border border-slate-700 font-semibold">
                {p.mrn || p.codeBarre || ''}
              </span>
              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                p.status === 'Critical'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : p.status === 'Inpatient'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-teal-950 text-teal-300 border-teal-800'
              }`}>
                {p.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {p.gender === 'Female' ? (lang === 'fr' ? 'Féminin' : 'Female') : (lang === 'fr' ? 'Masculin' : 'Male')} • {p.age || 'N/A'} {p.ageUnit === 'months' ? (lang === 'fr' ? 'mois' : 'months') : p.ageUnit === 'days' ? (lang === 'fr' ? 'jours' : 'days') : (lang === 'fr' ? 'ans' : 'years old')} ({p.dob || 'N/A'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onEditPatient && (
            <button
              onClick={() => onEditPatient(p)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-xl border border-teal-800/60 flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-400" /> {lang === 'fr' ? 'Modifier' : 'Edit'}
            </button>
          )}
          <button
            onClick={() => onOpenNewAppointment(p)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-400" /> {lang === 'fr' ? 'Prendre RDV' : 'Book Visit'}
          </button>
          <button
            onClick={() => onOpenNewConsultation(p)}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> {lang === 'fr' ? 'Ajouter Une Consultation' : 'Add Consultation Note'}
          </button>
        </div>
      </div>

      {/* Patient Summary & Vitals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (1 col): Reusable Patient Overview & Vitals Panel */}
        <PatientOverviewPanel patient={p} onEditPatient={onEditPatient} onOpenNewConsultation={onOpenNewConsultation} lang={lang} />

        {/* Right Col (2 cols): Consultation History Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chronological Consultations & Medical History Timeline */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" /> {lang === 'fr' ? 'Historique des Consultations' : 'Past Consultations & Clinical Notes'}
                </h3>
                <p className="text-xs text-slate-400">{lang === 'fr' ? 'Historique chronologique des observations médicales' : 'Chronological history of medical evaluations and observations'}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAllConsults(false)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 text-xs font-medium transition"
                >
                  {lang === 'fr' ? 'Tout réduire' : 'Collapse All'}
                </button>
                <button
                  onClick={() => toggleAllConsults(true)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-teal-400 hover:text-teal-300 rounded-lg border border-slate-700 text-xs font-medium transition"
                >
                  {lang === 'fr' ? 'Tout développer' : 'Expand All'}
                </button>
                <span className="text-xs bg-slate-900 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 font-mono">
                  {sortedConsultations.length} {lang === 'fr' ? 'Consultations' : 'Visits'}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400" /> Loading consultation timeline...
              </div>
            ) : sortedConsultations.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-300">{lang === 'fr' ? 'Aucune observation enregistrée.' : 'No prior consultation notes recorded.'}</p>
                <p className="text-xs text-slate-500">{lang === 'fr' ? 'Cliquez sur "Ajouter Une Consultation" pour ajouter une observation.' : 'Click "Add Consultation Note" to log a new evaluation.'}</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {sortedConsultations.map((c) => {
                  const isExpanded = expandedConsults[c.id] !== false; // Default expanded

                  return (
                    <div key={c.id} className="relative pl-9 group">
                      {/* Timeline Node Icon */}
                      <div className="absolute left-0 top-3 w-7 h-7 rounded-full bg-slate-900 border-2 border-teal-500 text-teal-400 flex items-center justify-center shadow-md z-10">
                        <Stethoscope className="w-3.5 h-3.5" />
                      </div>

                      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition overflow-hidden">
                        {/* Interactive Consultation Meta Header */}
                        <div
                          onClick={() => toggleExpandConsult(c.id)}
                          className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-800/50 transition select-none"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5 font-mono">
                              <Calendar className="w-3.5 h-3.5 text-teal-400" /> {c.date}
                            </span>

                            {c.status && (
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                                c.status === 'Completed'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : c.status === 'In Progress'
                                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                                  : 'bg-rose-950 text-rose-300 border-rose-800'
                              }`}>
                                {c.status === 'Completed' ? (lang === 'fr' ? 'Terminé' : 'Completed') : c.status === 'In Progress' ? (lang === 'fr' ? 'En cours' : 'In Progress') : (lang === 'fr' ? 'Annulé' : 'Canceled')}
                              </span>
                            )}

                            {c.hasArretDeTravail && c.arretDeTravail && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 shadow-sm">
                                <Clock className="w-3 h-3 text-amber-400" />
                                {lang === 'fr' ? 'Arrêt de travail:' : 'Sick Leave:'} {c.arretDeTravail.nbJour} {lang === 'fr' ? 'jour(s)' : 'day(s)'}
                              </span>
                            )}

                            {/* Summary badge when collapsed */}
                            {!isExpanded && c.prescriptions && c.prescriptions.length > 0 && (
                              <span className="text-[10px] text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                                <Pill className="w-3 h-3 text-cyan-400" /> {c.prescriptions.length} {lang === 'fr' ? 'médicament(s)' : 'med(s)'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                              {isExpanded ? (lang === 'fr' ? 'Réduire' : 'Collapse') : (lang === 'fr' ? 'Développer' : 'Expand')}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-teal-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Consultation Details Body */}
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-slate-800/60 space-y-4 mt-3">

                      {/* Consultation Content */}
                      <div className="space-y-2">
                        {(c.chiefComplaint || c.clinicalNotes) && (
                          <div>
                            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
                              {lang === 'fr' ? 'Motif de Consultation / Observation' : 'Chief Complaint / Observation'}
                            </span>
                            <p className="text-xs text-slate-200 font-medium">{c.chiefComplaint || c.clinicalNotes}</p>
                          </div>
                        )}

                        {c.diagnosis && (
                          <div>
                            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
                              {lang === 'fr' ? 'Diagnostic' : 'Diagnosis'}
                            </span>
                            <span className="inline-block text-xs font-bold text-teal-300 bg-teal-950/70 border border-teal-800/60 px-2.5 py-1 rounded-lg mt-0.5">
                              {c.diagnosis}
                            </span>
                          </div>
                        )}


                      </div>

                      {/* Arrêt de Travail Details if present in arret_consult table */}
                      {c.hasArretDeTravail && c.arretDeTravail && (
                        <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 font-bold text-amber-300">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>{lang === 'fr' ? 'Arrêt de Travail Prescrit' : 'Work Stoppage / Sick Leave Prescribed'}</span>
                          </div>
                          <div className="text-slate-200 pl-6 space-y-0.5">
                            <p>
                              <span className="text-slate-400">{lang === 'fr' ? 'Durée:' : 'Duration:'}</span>{' '}
                              <strong className="text-amber-200 font-mono text-sm">{c.arretDeTravail.nbJour} {lang === 'fr' ? 'jours' : 'days'}</strong>{' '}
                              {c.arretDeTravail.nbJoursL && <span className="text-slate-400">({c.arretDeTravail.nbJoursL})</span>}
                            </p>
                            {(c.arretDeTravail.dateDebut || c.arretDeTravail.dateFin) && (
                              <p className="font-mono text-[11px] text-slate-300">
                                {lang === 'fr' ? 'Du' : 'From'} <strong className="text-teal-300">{c.arretDeTravail.dateDebut || '-'}</strong> {lang === 'fr' ? 'au' : 'to'} <strong className="text-teal-300">{c.arretDeTravail.dateFin || '-'}</strong>
                              </p>
                            )}
                            {c.arretDeTravail.obs && (
                              <p className="text-slate-300 italic text-[11px] pt-0.5">Observation: {c.arretDeTravail.obs}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Prescriptions Table if any */}
                      {c.prescriptions && c.prescriptions.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-cyan-400" /> {lang === 'fr' ? 'Ordonnance / Médicaments Prescrits' : 'Prescribed Rx & Dosage'}
                          </span>
                          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                            <table className="w-full text-left text-xs text-slate-300">
                              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                                <tr>
                                  <th className="py-2 px-3">{lang === 'fr' ? 'Médicament' : 'Medication'}</th>
                                  <th className="py-2 px-3">{lang === 'fr' ? 'Dosage' : 'Dosage'}</th>
                                  <th className="py-2 px-3">{lang === 'fr' ? 'Fréquence / Posologie' : 'Frequency'}</th>
                                  <th className="py-2 px-3">{lang === 'fr' ? 'Quantité / Durée' : 'Duration'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60">
                                {c.prescriptions.map((rx, idx) => (
                                  <tr key={idx} className="hover:bg-slate-900/50">
                                    {rx.type === 2 ? (
                                      <td colSpan={4} className="py-2.5 px-3 font-semibold text-cyan-300 bg-cyan-950/20">
                                        <span className="text-[10px] text-cyan-400 font-mono uppercase bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60 mr-2 font-bold">
                                          {lang === 'fr' ? 'Prescription Libre' : 'Custom Rx'}
                                        </span>
                                        {rx.name}
                                      </td>
                                    ) : (
                                      <>
                                        <td className="py-2 px-3 font-semibold text-teal-300">{rx.name}</td>
                                        <td className="py-2 px-3 font-mono text-slate-200">{rx.dosage || '-'}</td>
                                        <td className="py-2 px-3 text-slate-300">{rx.frequency || '-'}</td>
                                        <td className="py-2 px-3 font-mono text-cyan-400">{rx.duration || '-'}</td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}


                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
