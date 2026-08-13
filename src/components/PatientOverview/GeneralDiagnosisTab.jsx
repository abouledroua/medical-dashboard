import React from 'react';
import { TestTube, Save, Calendar, Trash2 } from 'lucide-react';

export default function GeneralDiagnosisTab({
  lang,
  t,
  editExplorConsult, setEditExplorConsult,
  isSaving,
  onSave,
  loadingNutritions,
  patientNutritions,
  onDeleteNutrition
}) {
  return (
    <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800 animate-in fade-in duration-200">
      <label className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-2">
        <TestTube className="w-4 h-4 text-indigo-400" />
        {lang === 'fr' ? 'Diagnostique Général' : 'General Diagnosis'}
      </label>
      <textarea
        rows={4}
        value={editExplorConsult}
        onChange={(e) => setEditExplorConsult(e.target.value)}
        placeholder={t?.exGeneralDiag || (lang === 'fr' ? 'Saisir le diagnostique général...' : 'Enter general diagnosis...')}
        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
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

      <div className="pt-3 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            {lang === 'fr' ? 'Historique de l\'Alimentation' : 'Nutrition History'}
          </h4>
          {loadingNutritions && (
            <span className="text-[10px] text-amber-400 animate-pulse">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</span>
          )}
        </div>

        {patientNutritions.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {patientNutritions.map((nutr) => (
              <div
                key={nutr.id}
                className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-xl flex items-start justify-between gap-6 hover:border-slate-700 transition"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-amber-400">
                    <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{nutr.date}</span>
                  </div>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">{nutr.nutrition}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteNutrition(nutr.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition shrink-0"
                  title={lang === 'fr' ? 'Supprimer cet enregistrement' : 'Delete this record'}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-400 text-xs italic">{lang === 'fr' ? 'Aucun historique d’alimentation.' : 'No nutrition history.'}</div>
        )}
      </div>
    </div>
  );
}
