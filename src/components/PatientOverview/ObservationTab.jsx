import React from 'react';
import { Stethoscope, Save, Calendar, Trash2 } from 'lucide-react';

export default function ObservationTab({
  lang,
  editComplaint,
  setEditComplaint,
  isSaving,
  onSave,
  loadingObservations,
  patientObservations,
  onDeleteObservation
}) {
  return (
    <div className="space-y-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800 animate-in fade-in duration-200">
      <div className="space-y-2">
        <label className="text-xs font-bold text-teal-300 uppercase flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-teal-400" />
          {lang === 'fr' ? 'Nouvelle Observation / Note Clinique' : 'New Observation / Clinical Note'}
        </label>
        <textarea
          rows={3}
          value={editComplaint}
          onChange={(e) => setEditComplaint(e.target.value)}
          placeholder={lang === 'fr' ? 'Saisir une observation clinique...' : 'Enter a clinical observation...'}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
        />
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-md shadow-teal-500/20 transition text-xs"
          >
            <Save className="w-4 h-4" />
            {isSaving ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') : (lang === 'fr' ? 'Enregistrer' : 'Save')}
          </button>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            {lang === 'fr' ? 'Liste des Observations du Patient' : 'Patient Observations List'}
          </h4>
          {loadingObservations && (
            <span className="text-[10px] text-teal-400 animate-pulse">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</span>
          )}
        </div>

        {patientObservations.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {patientObservations.map((obs) => (
              <div
                key={obs.id}
                className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-xl flex items-start justify-between gap-6 hover:border-slate-700 transition"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-teal-400">
                    <Calendar className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>{obs.date}</span>
                  </div>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">{obs.observation}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteObservation(obs.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition shrink-0"
                  title={lang === 'fr' ? 'Supprimer cette observation' : 'Delete this observation'}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-400 text-xs italic">
            {lang === 'fr' ? 'Aucune observation enregistrée pour ce patient.' : 'No observations recorded for this patient.'}
          </div>
        )}
      </div>
    </div>
  );
}
