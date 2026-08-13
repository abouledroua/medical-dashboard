import React from 'react';
import { CheckCircle2, Save, Calendar, Trash2 } from 'lucide-react';

export default function ConsultDiagnosisTab({
  lang,
  editDiagConsult, setEditDiagConsult,
  isSaving,
  onSave,
  loadingDiagConsults,
  patientDiagConsults,
  onDeleteDiagConsult
}) {
  return (
    <div className="space-y-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800 animate-in fade-in duration-200">
      <div className="space-y-2">
        <label className="text-xs font-bold text-teal-300 uppercase flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          {lang === 'fr' ? 'Nouveau Diagnostic Consultation' : 'New Consultation Diagnosis'}
        </label>
        <textarea
          rows={3}
          value={editDiagConsult}
          onChange={(e) => setEditDiagConsult(e.target.value)}
          placeholder={lang === 'fr' ? 'ex: Otite moyenne aiguë droite, Angine érythémateuse...' : 'e.g., Right acute otitis media, Erythematous angina...'}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-teal-500 font-bold"
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
            {lang === 'fr' ? 'Historique des Diagnostics de Consultation' : 'Consultation Diagnosis History'}
          </h4>
          {loadingDiagConsults && (
            <span className="text-[10px] text-teal-400 animate-pulse">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</span>
          )}
        </div>

        {patientDiagConsults.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {patientDiagConsults.map((diag) => (
              <div
                key={diag.id}
                className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-xl flex items-start justify-between gap-6 hover:border-slate-700 transition"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-teal-400">
                    <Calendar className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>{diag.date}</span>
                  </div>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-semibold">{diag.diagnosis}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteDiagConsult(diag.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition shrink-0"
                  title={lang === 'fr' ? 'Supprimer ce diagnostic' : 'Delete this diagnosis'}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-400 text-xs italic">
            {lang === 'fr' ? 'Aucun diagnostic de consultation enregistré.' : 'No consultation diagnosis recorded.'}
          </div>
        )}
      </div>
    </div>
  );
}
