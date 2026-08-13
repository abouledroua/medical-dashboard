import React from 'react';
import { Calendar, Save } from 'lucide-react';

export default function ObstetricsTab({
  lang,
  editDDR, setEditDDR,
  editDPA, setEditDPA,
  isSaving,
  onSave
}) {
  return (
    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
      <label className="text-xs font-bold text-pink-300 uppercase flex items-center gap-2">
        <Calendar className="w-4 h-4 text-pink-400" />
        {lang === 'fr' ? 'Gynécologie & Obstétrique (DDR && DPA)' : 'Obstetrics (LMP && EDD)'}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
            DDR (Dernières Règles)
          </label>
          <input
            type="date"
            value={editDDR}
            onChange={(e) => {
              const ddrVal = e.target.value;
              setEditDDR(ddrVal);
              if (ddrVal) {
                const d = new Date(ddrVal);
                d.setDate(d.getDate() + 280);
                setEditDPA(d.toISOString().split('T')[0]);
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
            DPA (Accouchement Prévu)
          </label>
          <input
            type="date"
            value={editDPA}
            onChange={(e) => setEditDPA(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-pink-500"
          />
        </div>
      </div>
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
