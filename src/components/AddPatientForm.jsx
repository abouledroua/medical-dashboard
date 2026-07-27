import React, { useState } from 'react';
import { UserPlus, Save, AlertCircle, CheckCircle2, Shield, Heart, Phone, MapPin, User, Briefcase, Mail } from 'lucide-react';
import { translations } from '../translations';

export default function AddPatientForm({ onAddPatient, onUpdatePatient, patientToEdit, onCancel, lang = 'fr' }) {
  const t = translations[lang] || translations.fr;
  const isEditMode = Boolean(patientToEdit);

  const calculateAgeDetailsFromDob = (dobString) => {
    if (!dobString) return { age: '', ageUnit: 'years' };
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return { age: '', ageUnit: 'years' };
    const today = new Date();

    const diffTime = today.getTime() - birthDate.getTime();
    if (diffTime < 0) return { age: '0', ageUnit: 'days' };

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 31) {
      return { age: String(diffDays), ageUnit: 'days' };
    }

    let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }
    if (months < 24) {
      return { age: String(months), ageUnit: 'months' };
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }
    return { age: String(Math.max(0, years)), ageUnit: 'years' };
  };

  const calculateDobFromAgeAndUnit = (ageVal, unit) => {
    if (!ageVal || isNaN(ageVal)) return '';
    const num = parseInt(ageVal, 10);
    if (num < 0) return '';
    const today = new Date();

    if (unit === 'days') {
      const d = new Date(today);
      d.setDate(d.getDate() - num);
      return d.toISOString().split('T')[0];
    } else if (unit === 'months') {
      const d = new Date(today);
      d.setMonth(d.getMonth() - num);
      return d.toISOString().split('T')[0];
    } else {
      // Set to 1st of January of calculated birth year (YYYY-01-01)
      const birthYear = today.getFullYear() - num;
      return `${birthYear}-01-01`;
    }
  };

  const [formData, setFormData] = useState({
    firstName: patientToEdit ? patientToEdit.firstName : '',
    lastName: patientToEdit ? patientToEdit.lastName : '',
    gender: patientToEdit ? patientToEdit.gender : 'Female',
    dob: patientToEdit ? (patientToEdit.dob || '1990-01-01') : '1990-01-01',
    age: patientToEdit ? String(patientToEdit.age) : '36',
    ageUnit: patientToEdit ? (patientToEdit.ageUnit || 'years') : 'years',
    isPresumed: patientToEdit ? Boolean(patientToEdit.isPresumed) : false,
    phone: patientToEdit ? (patientToEdit.phone === 'N/A' ? '' : patientToEdit.phone) : '',
    email: patientToEdit ? patientToEdit.email : '',
    profession: patientToEdit ? patientToEdit.profession : '',
    address: patientToEdit ? (patientToEdit.address === 'El Bouni, Annaba' ? '' : patientToEdit.address) : '',
    bloodGroup: patientToEdit ? patientToEdit.bloodGroup : '',
    allergies: '',
    chronicConditions: '',
    emergencyName: '',
    emergencyRelation: 'Conjoint(e)',
    emergencyPhone: '',
    insuranceProvider: 'CNAS',
    insurancePolicy: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'dob') {
      const { age: derivedAge, ageUnit: derivedUnit } = calculateAgeDetailsFromDob(value);
      setFormData(prev => ({
        ...prev,
        dob: value,
        age: derivedAge,
        ageUnit: derivedUnit
      }));
    } else if (name === 'age') {
      const derivedDob = calculateDobFromAgeAndUnit(value, formData.ageUnit);
      setFormData(prev => ({
        ...prev,
        age: value,
        dob: derivedDob || prev.dob
      }));
    } else if (name === 'ageUnit') {
      const derivedDob = calculateDobFromAgeAndUnit(formData.age, value);
      setFormData(prev => ({
        ...prev,
        ageUnit: value,
        dob: derivedDob || prev.dob
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.gender || (!formData.dob && !formData.age)) {
      setError(
        lang === 'fr'
          ? 'Veuillez remplir les champs obligatoires : Nom, Prénom, Genre et (Date de Naissance ou Âge).'
          : 'Please fill in all mandatory fields: First Name, Last Name, Gender, and (DOB or Age).'
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        dob: formData.dob || calculateDobFromAgeAndUnit(formData.age, formData.ageUnit),
        age: Number(formData.age) || 0,
        ageUnit: formData.ageUnit,
        isPresumed: formData.isPresumed,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        profession: formData.profession.trim(),
        address: formData.address.trim(),
        bloodGroup: formData.bloodGroup
      };

      const url = isEditMode ? `/api/patients/${patientToEdit.id}` : '/api/patients';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || (lang === 'fr' ? "Échec de la sauvegarde du dossier patient." : 'Failed to save patient record.'));
      }

      const savedPatient = await res.json();
      setSuccessMsg(
        isEditMode
          ? (lang === 'fr' ? `Dossier du patient ${savedPatient.lastName} ${savedPatient.firstName} mis à jour avec succès !` : `Patient ${savedPatient.lastName} ${savedPatient.firstName} updated successfully!`)
          : (lang === 'fr' ? `Patient ${savedPatient.lastName} ${savedPatient.firstName} (${savedPatient.mrn}) enregistré avec succès !` : `Patient ${savedPatient.lastName} ${savedPatient.firstName} (${savedPatient.mrn}) registered successfully!`)
      );

      setTimeout(() => {
        if (isEditMode && onUpdatePatient) {
          onUpdatePatient(savedPatient);
        } else if (onAddPatient) {
          onAddPatient(savedPatient);
        }
      }, 1000);

    } catch (err) {
      setError(err.message || (lang === 'fr' ? 'Erreur serveur lors de la sauvegarde.' : 'Server error occurred while saving.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-400" /> {isEditMode ? (lang === 'fr' ? `Modification du Dossier : ${formData.lastName} ${formData.firstName}` : `Edit Patient Record: ${formData.lastName} ${formData.firstName}`) : (t.regTitle || (lang === 'fr' ? 'Inscription d\'un Nouveau Patient' : 'New Patient Registration'))}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isEditMode ? (lang === 'fr' ? 'Mettre à jour les informations du patient dans la base de données.' : 'Update patient demographic and clinical details in the database.') : (t.regSubtitle || (lang === 'fr' ? 'Créer un dossier informatique (DPI) pour un nouveau patient.' : 'Register a new patient into the EHR database.'))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-teal-400 bg-teal-950/80 border border-teal-800 px-3 py-1 rounded-lg font-mono">
            {isEditMode ? `NIP: ${patientToEdit.mrn || patientToEdit.id}` : (lang === 'fr' ? 'Génération NIP Automatique' : 'Auto MRN Generation')}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics & Personal Info */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
            <User className="w-4 h-4 text-teal-400" /> {lang === 'fr' ? '1. Informations Personnelles & Contact' : '1. Personal Information & Contact'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.lastName || (lang === 'fr' ? 'Nom' : 'Last Name')} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                required
                placeholder={lang === 'fr' ? 'ex: BOUAZIZ' : 'e.g. Smith'}
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.firstName || (lang === 'fr' ? 'Prénom' : 'First Name')} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                required
                placeholder={lang === 'fr' ? 'ex: SIDRET ELMOUNTAHA' : 'e.g. Eleanor'}
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.gender || (lang === 'fr' ? 'Genre' : 'Gender')} <span className="text-rose-400">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none"
              >
                <option value="Male">{lang === 'fr' ? 'Masculin' : 'Male'}</option>
                <option value="Female">{lang === 'fr' ? 'Féminin' : 'Female'}</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.dob || (lang === 'fr' ? 'Date de Naissance' : 'Date of Birth')}
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="checkbox"
                  id="isPresumed"
                  name="isPresumed"
                  checked={formData.isPresumed}
                  onChange={handleChange}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500/20 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="isPresumed" className="text-xs text-teal-300 font-medium cursor-pointer select-none">
                  {lang === 'fr' ? 'Présumé' : 'Presumed DOB'}
                </label>
              </div>
            </div>

            {/* Age & Unit Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'fr' ? 'Âge & Unité' : 'Age & Unit'}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="age"
                  min="0"
                  max="150"
                  placeholder={lang === 'fr' ? 'ex: 35' : 'e.g. 35'}
                  value={formData.age}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  className="w-1/2 px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none"
                />
                <select
                  name="ageUnit"
                  value={formData.ageUnit}
                  onChange={handleChange}
                  className="w-1/2 px-2 py-2 text-xs bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none font-semibold"
                >
                  <option value="years">{lang === 'fr' ? 'Ans' : 'Years'}</option>
                  <option value="months">{lang === 'fr' ? 'Mois' : 'Months'}</option>
                  <option value="days">{lang === 'fr' ? 'Jours' : 'Days'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.phone || (lang === 'fr' ? 'Téléphone' : 'Phone Number')}
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="0661000000"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t.email || (lang === 'fr' ? 'Email' : 'Email Address')}</label>
              <input
                type="email"
                name="email"
                placeholder="patient@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{lang === 'fr' ? 'Profession' : 'Profession'}</label>
              <input
                type="text"
                name="profession"
                placeholder={lang === 'fr' ? 'ex: Enseignant, Ingénieur, Retraité...' : 'e.g. Teacher, Engineer...'}
                value={formData.profession}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t.bloodGroup || (lang === 'fr' ? 'Groupe Sanguin' : 'Blood Group')}</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none font-semibold text-teal-300"
              >
                <option value="">{lang === 'fr' ? 'Non Spécifié' : 'Not Specified'}</option>
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.address || (lang === 'fr' ? 'Adresse Résidentielle' : 'Residential Address')}</label>
            <input
              type="text"
              name="address"
              placeholder={lang === 'fr' ? 'Adresse, Ville, Cité' : 'Street Address, City, State'}
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold border border-slate-700 transition"
            >
              {t.cancelBtn || (lang === 'fr' ? 'Annuler' : 'Cancel')}
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20 transition disabled:opacity-50"
          >
            {loading ? (
              <span>{lang === 'fr' ? 'Enregistrement du patient...' : 'Registering Patient...'}</span>
            ) : (
              <>
                <Save className="w-4 h-4 stroke-[2.5]" /> {t.savePatientBtn || (lang === 'fr' ? 'Enregistrer le Dossier Patient' : 'Register Patient Record')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
