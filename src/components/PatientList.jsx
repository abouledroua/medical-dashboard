import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, FileText, Calendar, AlertCircle, Phone, Heart, Activity, ChevronRight, UserCheck, ShieldAlert, LayoutGrid, List, Edit3, Loader2, ChevronDown } from 'lucide-react';
import { translations } from '../translations';

export default function PatientList({
  patients,
  searchQuery,
  setSearchQuery,
  onSelectPatient,
  onOpenNewAppointment,
  onOpenNewConsultation,
  onEditPatient,
  onSelectTab,
  lang = 'fr'
}) {
  const t = translations[lang] || translations.fr;
  const [statusFilter, setStatusFilter] = useState('All');
  const [bloodFilter, setBloodFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [visibleCount, setVisibleCount] = useState(30); // Fast initial render chunk
  const [isRendering, setIsRendering] = useState(false);

  // Memoize filtered results so we don't re-calculate on every small state update
  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return patients.filter(patient => {
      const fullName1 = `${patient.lastName || ''} ${patient.firstName || ''}`.toLowerCase();
      const fullName2 = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
      const matchesSearch = !q ||
        (patient.firstName && patient.firstName.toLowerCase().includes(q)) ||
        (patient.lastName && patient.lastName.toLowerCase().includes(q)) ||
        fullName1.includes(q) ||
        fullName2.includes(q) ||
        (patient.mrn && patient.mrn.toLowerCase().includes(q)) ||
        (patient.phone && patient.phone.includes(q)) ||
        (patient.email && patient.email.toLowerCase().includes(q)) ||
        (patient.chronicConditions && patient.chronicConditions.some(c => c.toLowerCase().includes(q))) ||
        (patient.allergies && patient.allergies.some(a => a.toLowerCase().includes(q)));

      const matchesStatus = statusFilter === 'All' || (patient.status && patient.status.toLowerCase() === statusFilter.toLowerCase());
      const matchesBlood = bloodFilter === 'All' || patient.bloodGroup === bloodFilter;

      return matchesSearch && matchesStatus && matchesBlood;
    });
  }, [patients, searchQuery, statusFilter, bloodFilter]);

  // Reset visible count when search or filters change to keep DOM render lightweight
  useEffect(() => {
    setVisibleCount(30);
    setIsRendering(true);
    const timer = setTimeout(() => setIsRendering(false), 50);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, bloodFilter]);

  const displayedPatients = useMemo(() => {
    return filteredPatients.slice(0, visibleCount);
  }, [filteredPatients, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 30);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {t.patientDirectoryTitle || (lang === 'fr' ? 'Répertoire Central des Patients' : 'Central Patient Directory')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'fr' ? (
              <>Affichage de <span className="text-teal-400 font-semibold">{displayedPatients.length}</span> sur {filteredPatients.length} patients (sur {patients.length} au total)</>
            ) : (
              <>Showing <span className="text-teal-400 font-semibold">{displayedPatients.length}</span> of {filteredPatients.length} matching patients ({patients.length} total)</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('add-patient')}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> {t.newPatientBtn || (lang === 'fr' ? 'Nouveau Patient' : 'Add New Patient')}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder || (lang === 'fr' ? 'Rechercher par nom, NIP, téléphone...' : 'Search by name, MRN, phone...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 transition placeholder-slate-500"
          />
          {(searchQuery || isRendering) && (
            <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 animate-pulse rounded-full"></div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">{lang === 'fr' ? 'Statut:' : 'Status:'}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="All">{lang === 'fr' ? 'Tous' : 'All'}</option>
              <option value="Active">{lang === 'fr' ? 'Actif' : 'Active'}</option>
              <option value="Inpatient">{lang === 'fr' ? 'Hospitalisé' : 'Inpatient'}</option>
              <option value="Critical">{lang === 'fr' ? 'Critique' : 'Critical'}</option>
            </select>
          </div>

          {/* Blood Group Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">{lang === 'fr' ? 'Groupe Sanguin:' : 'Blood Group:'}</span>
            <select
              value={bloodFilter}
              onChange={(e) => setBloodFilter(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="All">{lang === 'fr' ? 'Tous' : 'All'}</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-slate-200'}`}
              title={lang === 'fr' ? 'Vue Grille' : 'Grid View'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-slate-200'}`}
              title={lang === 'fr' ? 'Vue Tableau' : 'Table View'}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Patient List Content */}
      {filteredPatients.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">{lang === 'fr' ? 'Aucun patient trouvé' : 'No matching patient records'}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {lang === 'fr' ? 'Aucun patient ne correspond à vos critères de recherche. Essayez de réinitialiser les filtres.' : 'No patients match your search criteria. Try clearing filters or adding a new patient record.'}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('All'); setBloodFilter('All'); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            {lang === 'fr' ? 'Réinitialiser les filtres' : 'Reset Filters'}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedPatients.map((patient) => {
              const initials = `${(patient.lastName?.[0] || '').toUpperCase()}${(patient.firstName?.[0] || '').toUpperCase()}`;
              let statusBadge = 'bg-teal-950 text-teal-300 border-teal-800';
              if (patient.status === 'Critical') statusBadge = 'bg-rose-950 text-rose-300 border-rose-800';
              if (patient.status === 'Inpatient') statusBadge = 'bg-amber-950 text-amber-300 border-amber-800';

              const genderText = patient.gender === 'Female' ? (lang === 'fr' ? 'Féminin' : 'Female') : (lang === 'fr' ? 'Masculin' : 'Male');
              const ageUnitText = patient.ageUnit === 'months' ? (lang === 'fr' ? 'm' : 'm') : patient.ageUnit === 'days' ? (lang === 'fr' ? 'j' : 'd') : (lang === 'fr' ? 'ans' : 'y/o');

              return (
                <div
                  key={patient.id}
                  className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-teal-500/40 transition-all group flex flex-col justify-between space-y-4"
                >
                  {/* Top Patient Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-teal-900/60 border border-teal-500/30 flex items-center justify-center font-bold text-slate-200 text-sm shadow-md">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white group-hover:text-teal-300 transition">
                            {patient.lastName} {patient.firstName}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-slate-400">{patient.mrn}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs text-slate-400">{genderText}, {patient.age} {ageUnitText}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${statusBadge}`}>
                        {patient.status === 'Inpatient' ? (lang === 'fr' ? 'Hospitalisé' : 'Inpatient') : patient.status === 'Critical' ? (lang === 'fr' ? 'Critique' : 'Critical') : (lang === 'fr' ? 'Actif' : 'Active')}
                      </span>
                    </div>

                    {/* Blood Group */}
                    <div className="flex items-center justify-between text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                        <span>{lang === 'fr' ? 'Groupe Sanguin :' : 'Blood Group:'}</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-teal-400 font-mono">
                          {patient.bloodGroup || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Vitals Summary */}
                    {patient.vitals && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500 block text-[10px]">{lang === 'fr' ? 'Tension Artérielle (HTA)' : 'Blood Pressure'}</span>
                          <span className="font-mono font-semibold text-slate-200">{patient.vitals.bloodPressure}</span>
                        </div>
                        <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500 block text-[10px]">{lang === 'fr' ? 'Fréquence Cardiaque' : 'Heart Rate'}</span>
                          <span className="font-mono font-semibold text-slate-200">{patient.vitals.heartRate}</span>
                        </div>
                      </div>
                    )}

                    {/* Allergies & Conditions Badges */}
                    <div className="space-y-1.5">
                      {patient.allergies && patient.allergies.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-400" /> {lang === 'fr' ? 'Allergies :' : 'Allergies:'}
                          </span>
                          {patient.allergies.map((allergy, i) => (
                            <span key={i} className="text-[10px] bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded border border-rose-800/40">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      )}

                      {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-amber-400 font-semibold">{lang === 'fr' ? 'Pathologies :' : 'Conditions:'}</span>
                          {patient.chronicConditions.map((cond, i) => (
                            <span key={i} className="text-[10px] bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded border border-amber-800/30">
                              {cond}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => onSelectPatient(patient)}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-teal-500/20 to-teal-500/10 hover:from-teal-500/30 hover:to-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Dossier Médical' : 'Medical History'}
                    </button>

                    {onEditPatient && (
                      <button
                        onClick={() => onEditPatient(patient)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 rounded-xl border border-teal-800/60 text-xs"
                        title={lang === 'fr' ? 'Modifier le Patient' : 'Edit Patient'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenNewConsultation(patient)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs"
                      title={lang === 'fr' ? 'Ajouter une Note de Consultation' : 'Add Consultation Note'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenNewAppointment(patient)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs"
                      title={lang === 'fr' ? 'Planifier un Rendez-vous' : 'Schedule Appointment'}
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {visibleCount < filteredPatients.length && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-800/60 rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-lg"
              >
                <ChevronDown className="w-4 h-4" />
                {lang === 'fr'
                  ? `Afficher 30 patients de plus (${filteredPatients.length - visibleCount} restants)`
                  : `Show 30 More Patients (${filteredPatients.length - visibleCount} remaining)`}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900 text-slate-400">
                  <tr>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Patient' : 'Patient Info'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'NIP / Naissance' : 'MRN / DOB'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Groupe & HTA' : 'Blood & Vitals'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Allergies & Pathologies' : 'Allergies & Conditions'}</th>
                    <th className="py-3 px-4 text-right">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {displayedPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{patient.lastName} {patient.firstName}</div>
                        <div className="text-xs text-slate-400">{patient.phone}{patient.email ? ` • ${patient.email}` : ''}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="text-teal-400">{patient.mrn}</div>
                        <div className="text-slate-400">{patient.dob} ({patient.age} {patient.ageUnit === 'months' ? (lang === 'fr' ? 'm' : 'm') : patient.ageUnit === 'days' ? (lang === 'fr' ? 'j' : 'd') : (lang === 'fr' ? 'ans' : 'y')})</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-bold text-slate-200">{lang === 'fr' ? 'Groupe' : 'Group'} {patient.bloodGroup || 'N/A'}</div>
                        <div className="text-slate-400">{patient.vitals?.bloodPressure}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                          patient.status === 'Critical'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : patient.status === 'Inpatient'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-teal-950 text-teal-400 border-teal-800'
                        }`}>
                          {patient.status === 'Inpatient' ? (lang === 'fr' ? 'Hospitalisé' : 'Inpatient') : patient.status === 'Critical' ? (lang === 'fr' ? 'Critique' : 'Critical') : (lang === 'fr' ? 'Actif' : 'Active')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs max-w-xs">
                        {patient.allergies && patient.allergies.length > 0 && (
                          <div className="text-rose-400 truncate">
                            Allergies: {patient.allergies.join(', ')}
                          </div>
                        )}
                        <div className="text-slate-400 truncate">
                          {(patient.chronicConditions && patient.chronicConditions.join(', ')) || (lang === 'fr' ? 'Aucune' : 'None')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {onEditPatient && (
                          <button
                            onClick={() => onEditPatient(patient)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-semibold border border-teal-800/60 transition inline-flex items-center gap-1"
                            title={lang === 'fr' ? 'Modifier le Patient' : 'Edit Patient'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 rounded-lg text-xs font-semibold border border-teal-500/30 transition inline-flex items-center gap-1"
                        >
                          {lang === 'fr' ? 'Historique' : 'History'} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Load More Button */}
          {visibleCount < filteredPatients.length && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-800/60 rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-lg"
              >
                <ChevronDown className="w-4 h-4" />
                {lang === 'fr'
                  ? `Afficher 30 patients de plus (${filteredPatients.length - visibleCount} restants)`
                  : `Show 30 More Patients (${filteredPatients.length - visibleCount} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
