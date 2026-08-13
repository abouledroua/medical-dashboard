import React from 'react';
import { useConsultation } from '../../context/ConsultationContext';
import { Stethoscope } from 'lucide-react';

export default function ConsultationHeader() {
  const { lang, clinicInfo, doctor, activePatient, fullPatientDetails, getPatientDisplayAge, handleCancel, handleSubmit, loading } = useConsultation();

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 shrink-0">
            <Stethoscope className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              {lang === 'fr' ? 'Espace Consultation Médicale' : 'Medical Consultation Suite'}
            </h2>

            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-300">{clinicInfo?.NOM_CLINIQUE || clinicInfo?.nomCabinet || (lang === 'fr' ? 'Cabinet Médical' : 'Medical Clinic')}</span>
              <span className="text-slate-600">•</span>
              <span>{clinicInfo?.doctorNameFr || doctor || ''}</span>
            </p>

            {activePatient && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">{lang === 'fr' ? 'Patient :' : 'Patient:'}</span>
                <span className="font-extrabold text-white bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  {[activePatient.NOM || activePatient.nom || activePatient.lastName || activePatient.nomMalade, activePatient.PRENOM || activePatient.prenom || activePatient.firstName || activePatient.prenomMalade].filter(Boolean).join(' ') || activePatient.name || activePatient.FULLNAME || activePatient.fullname || '—'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-medium">{lang === 'fr' ? 'Âge :' : 'Age:'}</span>
                <span className="font-bold text-teal-300 font-mono bg-teal-500/10 px-2.5 py-0.5 rounded-lg border border-teal-500/20 shadow-sm">
                  {getPatientDisplayAge(fullPatientDetails || activePatient)}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-medium">{lang === 'fr' ? 'Sexe :' : 'Sex:'}</span>
                <span className="font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/60">
                  {(activePatient.SEXE || activePatient.sexe || activePatient.gender || 'M').toString().toUpperCase().startsWith('F') ? (lang === 'fr' ? 'Féminin (F)' : 'Female (F)') : (lang === 'fr' ? 'Masculin (M)' : 'Male (M)')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            {lang === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition"
          >
            {loading ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') : (lang === 'fr' ? 'Enregistrer la Consultation' : 'Save Consultation')}
          </button>
        </div>
      </div>
  );
}
