import React from 'react';
import { Sparkles, Save } from 'lucide-react';

export default function DietTab({
  lang,
  t,
  editAlimentation, setEditAlimentation,
  isSaving,
  onSave
}) {
  return (
    <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800 animate-in fade-in duration-200">
      <label className="text-xs font-bold text-amber-300 uppercase flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        {lang === 'fr' ? 'Alimentation / Régime' : 'Diet & Nutrition'}
      </label>
      <textarea
        rows={3}
        value={editAlimentation}
        onChange={(e) => setEditAlimentation(e.target.value)}
        placeholder={t?.exDiet || ''}
        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-amber-500 resize-y"
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
  );
}
