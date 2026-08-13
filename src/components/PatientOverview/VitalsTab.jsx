import React from 'react';
import { Heart, Save, Trash2 } from 'lucide-react';

export default function VitalsTab({
  lang,
  editBP, setEditBP,
  editHR, setEditHR,
  editO2, setEditO2,
  editGlucose, setEditGlucose,
  isSaving,
  onSave,
  loadingVitalsHistory,
  vitalsHistory,
  onDeleteVitals
}) {
  return (
    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
      <label className="text-xs font-bold text-rose-300 uppercase flex items-center gap-2">
        <Heart className="w-4 h-4 text-rose-400" />
        {lang === 'fr' ? 'TA & Battement (Signes Vitaux)' : 'BP & Heart Rate'}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">TA (mmHg)</label>
          <input
            type="text"
            value={editBP}
            onChange={(e) => setEditBP(e.target.value)}
            placeholder="120/80"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Battement / FC (bpm)</label>
          <input
            type="text"
            value={editHR}
            onChange={(e) => setEditHR(e.target.value)}
            placeholder="75"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">SpO2 (%)</label>
          <input
            type="text"
            value={editO2}
            onChange={(e) => setEditO2(e.target.value)}
            placeholder="98%"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Glycémie (g/L)</label>
          <input
            type="text"
            value={editGlucose}
            onChange={(e) => setEditGlucose(e.target.value)}
            placeholder="0.95"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
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
      <div className="pt-4 border-t border-slate-800">
        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
          Historique des Signes Vitaux
        </h4>
        {loadingVitalsHistory ? (
          <div className="text-center text-xs text-slate-400">Chargement...</div>
        ) : vitalsHistory.length > 0 ? (
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 uppercase text-[10px] bg-slate-800">
                <tr>
                  <th className="p-2">DATE</th>
                  <th className="p-2">TA</th>
                  <th className="p-2">FC</th>
                  <th className="p-2">SPO2</th>
                  <th className="p-2">GLYCEMIE</th>
                  <th className="p-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {vitalsHistory.map((vital, index) => (
                  <tr key={index} className="hover:bg-slate-800/50">
                    <td className="p-2 font-mono">{vital.date}</td>
                    <td className="p-2 font-mono">{vital.bp || 'N/A'}</td>
                    <td className="p-2 font-mono">{vital.hr || 'N/A'}</td>
                    <td className="p-2 font-mono">{vital.spo2 || 'N/A'}</td>
                    <td className="p-2 font-mono">{vital.bg || 'N/A'}</td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteVitals(vital.date)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                        title={lang === 'fr' ? 'Supprimer cet enregistrement' : 'Delete this record'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-xs text-slate-500 italic">Aucun historique des signes vitaux.</div>
        )}
      </div>
    </div>
  );
}
