import React from 'react';
import { Layers, Calendar, Save, Trash2 } from 'lucide-react';

export default function MeasurementsTab({
  lang,
  editTaille, setEditTaille,
  editPoids, setEditPoids,
  editPerimCran, setEditPerimCran,
  isSaving,
  onSave,
  loadingHeights,
  loadingWeights,
  loadingHeadCircs,
  combinedMensurationsHistory,
  onDeleteHeight,
  onDeleteWeight,
  onDeleteHeadCirc
}) {
  return (
    <div className="space-y-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800 animate-in fade-in duration-200">
      <div className="space-y-2">
        <label className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          {lang === 'fr' ? 'Nouvelles Mesures (Taille, Poids, PC)' : 'New Measurements (Height, Weight, HC)'}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Taille (cm)</label>
            <input
              type="number"
              value={editTaille}
              onChange={(e) => setEditTaille(e.target.value)}
              placeholder="170"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Poids (kg)</label>
            <input
              type="number"
              value={editPoids}
              onChange={(e) => setEditPoids(e.target.value)}
              placeholder="70"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Périm. Crân. (cm)</label>
            <input
              type="number"
              value={editPerimCran}
              onChange={(e) => setEditPerimCran(e.target.value)}
              placeholder="45"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
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

      <div className="pt-3 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {lang === 'fr' ? 'Historique des Mensurations' : 'Measurement History'}
          </h4>
          {(loadingHeights || loadingWeights || loadingHeadCircs) && (
            <span className="text-[10px] text-cyan-400 animate-pulse">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</span>
          )}
        </div>

        {(loadingHeights || loadingWeights || loadingHeadCircs) ? (
          <div className="text-center text-xs text-slate-400">Chargement...</div>
        ) : combinedMensurationsHistory.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div className="grid grid-cols-5 items-center gap-2 text-xs text-slate-400 uppercase font-semibold bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <div className="col-span-1">{lang === 'fr' ? 'Date' : 'Date'}</div>
              <div className="text-right col-span-1">{lang === 'fr' ? 'Taille' : 'Height'}</div>
              <div className="text-right col-span-1">{lang === 'fr' ? 'Poids' : 'Weight'}</div>
              <div className="text-right col-span-1">{lang === 'fr' ? 'PC' : 'HC'}</div>
              <div className="text-right col-span-1">{lang === 'fr' ? 'Actions' : 'Actions'}</div>
            </div>
            {combinedMensurationsHistory.map((m, index) => (
              <div
                key={index}
                className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-xl grid grid-cols-5 items-center gap-2 text-xs hover:border-slate-700 transition"
              >
                <div className="font-bold text-cyan-400 flex items-center gap-2 col-span-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>{m.date}</span>
                </div>
                <div className="text-right text-slate-200 col-span-1">
                  {m.height ? `${m.height} cm` : <span className="text-slate-500">-</span>}
                </div>
                <div className="text-right text-slate-200 col-span-1">
                  {m.weight ? `${m.weight} kg` : <span className="text-slate-500">-</span>}
                </div>
                <div className="text-right text-slate-200 col-span-1">
                  {m.headCirc ? `${m.headCirc} cm` : <span className="text-slate-500">-</span>}
                </div>
                <div className="flex items-center gap-0.5 justify-end col-span-1">
                  {m.heightId && (
                    <button
                      type="button"
                      onClick={() => onDeleteHeight(m.heightId)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {m.weightId && (
                    <button
                      type="button"
                      onClick={() => onDeleteWeight(m.weightId)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {m.headCircId && (
                    <button
                      type="button"
                      onClick={() => onDeleteHeadCirc(m.headCircId)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-400 text-xs italic">
            {lang === 'fr' ? 'Aucun historique de mesures disponible.' : 'No measurement history available.'}
          </div>
        )}
      </div>
    </div>
  );
}
