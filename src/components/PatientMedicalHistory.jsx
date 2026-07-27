import React, { useState, useEffect } from 'react';
import { FileText, Stethoscope, Heart, Activity, AlertTriangle, Plus, Calendar, Clock, Pill, User, ShieldAlert, Phone, ChevronRight, CheckCircle2, RefreshCw, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { translations } from '../translations';

export default function PatientMedicalHistory({
  selectedPatient,
  onSelectPatient,
  allPatients,
  onOpenNewConsultation,
  onOpenNewAppointment,
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

  // Fetch full details whenever selectedPatient changes
  useEffect(() => {
    if (!selectedPatient) {
      if (onSelectTab) {
        onSelectTab('patients');
      }
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/patients/${selectedPatient.id}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setPatientData(data);
          setConsultations(data.consultations || []);
        }
      })
      .catch(err => {
        console.error('Failed to load patient history:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedPatient, onSelectTab]);

  if (!selectedPatient) {
    return null; // Render nothing while redirecting
  }

  const p = patientData || selectedPatient;

  return (
    <div className="space-y-6">
      {/* Top Selector Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-lg shadow-teal-500/20">
            {(p.lastName[0]||'').toUpperCase()}{(p.firstName[0]||'').toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{p.lastName} {p.firstName}</h2>
              <span className="font-mono text-xs bg-slate-900 text-teal-400 px-2 py-0.5 rounded border border-slate-700 font-semibold">
                {p.mrn}
              </span>
              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                p.status === 'Critical'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : p.status === 'Inpatient'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-teal-950 text-teal-300 border-teal-800'
              }`}>
                {p.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {p.gender === 'Female' ? (lang === 'fr' ? 'Féminin' : 'Female') : (lang === 'fr' ? 'Masculin' : 'Male')} • {p.age} {p.ageUnit === 'months' ? (lang === 'fr' ? 'mois' : 'months') : p.ageUnit === 'days' ? (lang === 'fr' ? 'jours' : 'days') : (lang === 'fr' ? 'ans' : 'years old')} ({p.dob})
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
            <Calendar className="w-3.5 h-3.5 text-teal-400" /> Book Visit
          </button>
          <button
            onClick={() => onOpenNewConsultation(p)}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Consultation Note
          </button>
        </div>
      </div>

      {/* Patient Summary & Vitals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (1 col): Clinical Demographics & Allergies */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
              Patient Overview
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Blood Group</span>
                <span className="font-bold text-teal-300 font-mono text-sm">{p.bloodGroup || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">{lang === 'fr' ? 'Profession' : 'Profession'}</span>
                <span className="font-semibold text-slate-200">{p.profession || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">{lang === 'fr' ? 'Adresse' : 'Address'}</span>
                <span className="font-semibold text-slate-200 truncate max-w-[170px]">{p.address || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Contact Phone</span>
                <span className="font-semibold text-slate-200">{p.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-300 truncate max-w-[170px]">{p.email}</span>
              </div>
              <div className="py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400 block mb-1">Emergency Contact</span>
                <span className="font-semibold text-white block">{p.emergencyContact?.name} ({p.emergencyContact?.relation})</span>
                <span className="text-slate-400 font-mono">{p.emergencyContact?.phone}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-400 block mb-1">Insurance Provider</span>
                <span className="font-semibold text-slate-200 block">{p.insurance?.provider}</span>
                <span className="text-slate-400 font-mono text-[11px]">Policy: {p.insurance?.policyNumber}</span>
              </div>
            </div>
          </div>

          {/* Allergies Alert */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Known Allergies
            </h4>
            {p.allergies && p.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {p.allergies.map((allergy, i) => (
                  <span key={i} className="text-xs bg-rose-950/80 text-rose-300 border border-rose-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">No known drug allergies reported.</span>
            )}
          </div>

          {/* Antécédents Personnels & Pathologies */}
          <div>
            <h4 className="text-xs font-bold uppercase text-teal-400 tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Antécédents Personnels & Pathologies' : 'Personal Antecedents & Conditions'}
            </h4>
            {(() => {
              const diagSet = new Set(p.diagnostics || []);
              const personalItems = Array.from(new Set([
                ...(p.personalAntecedents || []),
                ...(p.chronicConditions || [])
              ])).filter(item => !diagSet.has(item));

              return personalItems.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {personalItems.map((cond, i) => (
                    <span key={i} className="text-xs bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded-lg font-medium">
                      {cond}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">{lang === 'fr' ? 'Aucun antécédent personnel enregistré.' : 'No personal antecedents recorded.'}</span>
              );
            })()}
          </div>

          {/* Antécédents Familiaux */}
          {p.familyAntecedents && p.familyAntecedents.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-2">
                {lang === 'fr' ? 'Antécédents Familiaux' : 'Family Antecedents'}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {p.familyAntecedents.map((fam, i) => (
                  <span key={i} className="text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 px-2.5 py-1 rounded-lg font-medium">
                    {fam}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostics */}
          {p.diagnostics && p.diagnostics.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider mb-2">
                {lang === 'fr' ? 'Diagnostics Clés' : 'Key Diagnostics'}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {p.diagnostics.map((diag, i) => (
                  <span key={i} className="text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-lg font-medium">
                    {diag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col (2 cols): Vitals Metrics & Consultation History Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Vitals Metrics Strip */}
          {p.vitals && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-400" /> Current Clinical Vitals
                </span>
                <span className="text-slate-400">Last Recorded: {p.vitals.lastUpdated}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Pressure</span>
                  <span className="text-base font-extrabold text-teal-300 font-mono">{p.vitals.bloodPressure}</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Heart Rate</span>
                  <span className="text-base font-extrabold text-cyan-300 font-mono">{p.vitals.heartRate}</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Oxygen Sat (SpO2)</span>
                  <span className="text-base font-extrabold text-emerald-300 font-mono">{p.vitals.oxygenSat}</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Glucose</span>
                  <span className="text-base font-extrabold text-amber-300 font-mono">{p.vitals.bloodGlucose}</span>
                </div>
              </div>
            </div>
          )}

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
                  {consultations.filter(c => c.status !== 'Canceled' && Number(c.etat) !== 2).length} {lang === 'fr' ? 'Consultations' : 'Visits'}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400" /> Loading consultation timeline...
              </div>
            ) : consultations.filter(c => c.status !== 'Canceled' && Number(c.etat) !== 2).length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-300">{lang === 'fr' ? 'Aucune observation enregistrée.' : 'No prior consultation notes recorded.'}</p>
                <p className="text-xs text-slate-500">{lang === 'fr' ? 'Cliquez sur "Ajouter une Note de Consultation" pour ajouter une observation.' : 'Click "Add Consultation Note" to log a new evaluation.'}</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {consultations.filter(c => c.status !== 'Canceled' && Number(c.etat) !== 2).map((c) => {
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
                        {c.chiefComplaint && (
                          <div>
                            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
                              {lang === 'fr' ? 'Motif de Consultation' : 'Chief Complaint'}
                            </span>
                            <p className="text-xs text-slate-200 font-medium">{c.chiefComplaint}</p>
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

                        {c.clinicalNotes && (
                          <div>
                            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
                              {lang === 'fr' ? 'Notes & Observations Médicales' : 'Clinical & Progress Notes'}
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 mt-1">
                              {c.clinicalNotes}
                            </p>
                          </div>
                        )}
                      </div>

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
                                    <td className="py-2 px-3 font-semibold text-teal-300">{rx.name}</td>
                                    <td className="py-2 px-3 font-mono text-slate-200">{rx.dosage || '-'}</td>
                                    <td className="py-2 px-3 text-slate-300">{rx.frequency || '-'}</td>
                                    <td className="py-2 px-3 font-mono text-cyan-400">{rx.duration || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Vitals At Visit */}
                      {c.vitalsAtVisit && (
                        <div className="text-[11px] text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/50 flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-teal-400" />
                          <span>Vitals at visit: <strong className="text-slate-200">{c.vitalsAtVisit}</strong></span>
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
