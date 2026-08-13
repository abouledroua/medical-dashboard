import React from 'react';
import { Activity, ShieldAlert, AlertTriangle, Plus, Users, Trash2 } from 'lucide-react';

export default function AntecedentsTab({
  lang,
  newPersonalInput, setNewPersonalInput,
  showPersonalDropdown, setShowPersonalDropdown,
  handleAddPersonalAntecedent,
  personalDbSuggestions,
  personalListState,
  handleDeletePersonalAntecedent,

  newFamilyInput, setNewFamilyInput,
  showFamilyDropdown, setShowFamilyDropdown,
  handleAddFamilyAntecedent,
  familyDbSuggestions,
  familyListState,
  handleDeleteFamilyAntecedent,

  newAllergyInput, setNewAllergyInput,
  showAllergyDropdown, setShowAllergyDropdown,
  handleAddAllergy,
  allergyDbSuggestions,
  allergyListState,
  handleDeleteAllergy
}) {
  return (
    <div className="p-5 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Left Column: Antécédents Personnels */}
        <div className="space-y-4 lg:pr-3">
          <label className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2 tracking-wider">
            <Activity className="w-4 h-4 text-amber-400" />
            {lang === 'fr' ? 'Antécédents Personnels' : 'Personal Antecedents'}
          </label>

          <div className="space-y-2 relative">
            <input
              type="text"
              value={newPersonalInput}
              onFocus={() => setShowPersonalDropdown(true)}
              onBlur={() => setTimeout(() => setShowPersonalDropdown(false), 200)}
              onChange={(e) => {
                setNewPersonalInput(e.target.value);
                setShowPersonalDropdown(true);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPersonalAntecedent(); } }}
              placeholder={lang === 'fr' ? 'Ajouter un antécédent personnel...' : 'Add personal antecedent...'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />

            <datalist id="personal-antecedents-list">
              {personalDbSuggestions.map((item, idx) => (
                <option key={idx} value={item} />
              ))}
            </datalist>

            {showPersonalDropdown && personalDbSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto p-1 divide-y divide-slate-800">
                {personalDbSuggestions
                  .filter(item => !newPersonalInput.trim() || item.toLowerCase().includes(newPersonalInput.toLowerCase()))
                  .slice(0, 20)
                  .map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => {
                        setNewPersonalInput(suggestion);
                        setShowPersonalDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-amber-200 hover:bg-amber-950/60 hover:text-amber-100 rounded-lg transition font-medium flex items-center justify-between"
                    >
                      <span>{suggestion}</span>
                      <span className="text-[10px] text-slate-500 font-mono font-normal">antecedent</span>
                    </button>
                  ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddPersonalAntecedent}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-md shadow-amber-500/10"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {lang === 'fr' ? 'Enregistrer' : 'Save'}
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              {lang === 'fr' ? 'Liste des Antécédents Personnels' : 'Personal Antecedents List'} ({personalListState.length})
            </span>

            {personalListState.length > 0 ? (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {personalListState.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2 hover:border-slate-700 transition"
                  >
                    <span className="text-xs text-amber-200 font-medium break-words leading-relaxed">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleDeletePersonalAntecedent(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition shrink-0"
                      title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl text-center text-slate-500 text-xs italic">
                {lang === 'fr' ? 'Aucun antécédent personnel' : 'No personal antecedents'}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Antécédents Familiaux */}
        <div className="space-y-4 lg:px-3 lg:border-x lg:border-slate-800/80">
          <label className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2 tracking-wider">
            <Users className="w-4 h-4 text-indigo-400" />
            {lang === 'fr' ? 'Antécédents Familiaux' : 'Family Antecedents'}
          </label>

          <div className="space-y-2 relative">
            <input
              type="text"
              value={newFamilyInput}
              onFocus={() => setShowFamilyDropdown(true)}
              onBlur={() => setTimeout(() => setShowFamilyDropdown(false), 200)}
              onChange={(e) => {
                setNewFamilyInput(e.target.value);
                setShowFamilyDropdown(true);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFamilyAntecedent(); } }}
              placeholder={lang === 'fr' ? 'Ajouter un antécédent familial...' : 'Add family antecedent...'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />

            {showFamilyDropdown && familyDbSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-indigo-500/50 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto p-1 divide-y divide-slate-800">
                {familyDbSuggestions
                  .filter(item => !newFamilyInput.trim() || item.toLowerCase().includes(newFamilyInput.toLowerCase()))
                  .slice(0, 20)
                  .map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => {
                        setNewFamilyInput(suggestion);
                        setShowFamilyDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-indigo-200 hover:bg-indigo-950/60 hover:text-indigo-100 rounded-lg transition font-medium flex items-center justify-between"
                    >
                      <span>{suggestion}</span>
                      <span className="text-[10px] text-slate-500 font-mono font-normal">antecedent_fam</span>
                    </button>
                  ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddFamilyAntecedent}
              className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-md shadow-indigo-500/10"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {lang === 'fr' ? 'Enregistrer' : 'Save'}
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              {lang === 'fr' ? 'Liste des Antécédents Familiaux' : 'Family Antecedents List'} ({familyListState.length})
            </span>

            {familyListState.length > 0 ? (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {familyListState.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2 hover:border-slate-700 transition"
                  >
                    <span className="text-xs text-indigo-200 font-medium break-words leading-relaxed">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFamilyAntecedent(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition shrink-0"
                      title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl text-center text-slate-500 text-xs italic">
                {lang === 'fr' ? 'Aucun antécédent familial' : 'No family antecedents'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Allergies Connues */}
        <div className="space-y-4 lg:pl-3">
          <label className="text-xs font-bold text-rose-400 uppercase flex items-center gap-2 tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            {lang === 'fr' ? 'Allergies Connues' : 'Known Allergies'}
          </label>

          <div className="space-y-2 relative">
            <input
              type="text"
              value={newAllergyInput}
              onFocus={() => setShowAllergyDropdown(true)}
              onBlur={() => setTimeout(() => setShowAllergyDropdown(false), 200)}
              onChange={(e) => {
                setNewAllergyInput(e.target.value);
                setShowAllergyDropdown(true);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAllergy(); } }}
              placeholder={lang === 'fr' ? 'Ajouter une allergie (ex: Pénicilline...)' : 'Add allergy (e.g. Penicillin...)'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
            />

            {showAllergyDropdown && allergyDbSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-rose-500/50 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto p-1 divide-y divide-slate-800">
                {allergyDbSuggestions
                  .filter(item => !newAllergyInput.trim() || item.toLowerCase().includes(newAllergyInput.toLowerCase()))
                  .slice(0, 20)
                  .map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => {
                        setNewAllergyInput(suggestion);
                        setShowAllergyDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-200 hover:bg-rose-950/60 hover:text-rose-100 rounded-lg transition font-medium flex items-center justify-between"
                    >
                      <span>{suggestion}</span>
                      <span className="text-[10px] text-slate-500 font-mono font-normal">allergie</span>
                    </button>
                  ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddAllergy}
              className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-md shadow-rose-500/10"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {lang === 'fr' ? 'Enregistrer' : 'Save'}
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              {lang === 'fr' ? 'Liste des Allergies' : 'Allergies List'} ({allergyListState.length})
            </span>

            {allergyListState.length > 0 ? (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {allergyListState.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900/90 border border-rose-900/50 rounded-xl flex items-center justify-between gap-2 hover:border-rose-700 transition"
                  >
                    <span className="text-xs text-rose-300 font-semibold break-words leading-relaxed flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAllergy(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition shrink-0"
                      title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl text-center text-slate-500 text-xs italic">
                {lang === 'fr' ? 'Aucune allergie connue' : 'No known allergies'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
