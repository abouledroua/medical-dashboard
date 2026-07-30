import React, { useState, useEffect, useRef } from 'react';
import { Settings, CheckCircle2, AlertCircle, Building2, Phone, User, Clock, Users, CalendarCheck, Sliders, DollarSign, Printer, Image } from 'lucide-react';
import { translations } from '../translations';

export default function ClinicSettings({ onUpdateClinicInfo, currentUser, onLogout, lang = 'fr' }) {
  const t = translations[lang] || translations.fr;
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSection, setActiveSection] = useState('informations');
  const [logo, setLogo] = useState(null);
  const [header, setHeader] = useState(null);
  const [badge, setBadge] = useState(null);
  const [horaireRows, setHoraireRows] = useState([]);
  const [usersRows, setUsersRows] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userEditorOpen, setUserEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', type: '1' });
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debounceTimeout = useRef(null);
  const horaireDebounceRef = useRef(null);
  const authHeaders = currentUser?.id ? { 'x-user-id': String(currentUser.id) } : {};
  const [printRdvSlip, setPrintRdvSlip] = useState(() => localStorage.getItem('clinicPrintRdvSlip') === '1');
  const [printVisitSlip, setPrintVisitSlip] = useState(() => localStorage.getItem('clinicPrintVisitSlip') === '1');
  const [typePapierRdv, setTypePapierRdv] = useState(() => localStorage.getItem('clinicTypePapierRdv') || '1');

  const fetchHoraireRows = async () => {
    try {
      const res = await fetch('/api/horaire', { headers: authHeaders });
      if (!res.ok) return;
      const rows = await res.json();
      setHoraireRows(rows);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const fetchUsersRows = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/users', { headers: authHeaders });
      if (!res.ok) return;
      const rows = await res.json();
      setUsersRows(rows);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const refreshUsers = async () => {
    await fetchUsersRows();
  };

  useEffect(() => {
    const fetchClinicInfo = async () => {
      try {
        const res = await fetch('/api/clinic', { headers: authHeaders });
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setFormData(data);
        if(onUpdateClinicInfo) onUpdateClinicInfo(data);
      } catch (err) {
        setErrorMsg(err.message);
      }
    };
    fetchClinicInfo();

    const savedLogo = localStorage.getItem('clinicLogo');
    if (savedLogo) setLogo(savedLogo);
    const savedHeader = localStorage.getItem('clinicHeader');
    if (savedHeader) setHeader(savedHeader);
    const savedBadge = localStorage.getItem('clinicBadge');
    if (savedBadge) setBadge(savedBadge);
    setPrintRdvSlip(localStorage.getItem('clinicPrintRdvSlip') === '1');
    setPrintVisitSlip(localStorage.getItem('clinicPrintVisitSlip') === '1');
    setTypePapierRdv(localStorage.getItem('clinicTypePapierRdv') || '1');

    fetchHoraireRows();
    fetchUsersRows();
  }, []);

  const handleImageChange = (e, setImage, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImage(base64String);
        localStorage.setItem(key, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: t.updateErrorMsg }));
        throw new Error(errorData.error || t.updateErrorMsg);
      }
      
      const updated = await res.json();
      if (onUpdateClinicInfo) {
        onUpdateClinicInfo(updated);
      }

      setSuccessMsg(t.updateSuccessMsg);
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err) {
      setErrorMsg(err.message || 'Error saving settings');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert radio button values to integers for specific fields
    let finalValue = value;
    if (type === 'radio' && ['GEST_ORDONNANCE', 'GEST_BILAN', 'FREQ_MEDIC', 'MOTIF_RDV', 'NUM_RDV', 'IMPR_ORD', 'IMPR_ARRET', 'MODELE_ORD', 'IMPR_ORIENTATION', 'IMPR_PAPIER_PRE_IMPRIME', 'BAS_PAGE', 'IMPR_BILAN'].includes(name)) {
      finalValue = Number(value);
    } else if (type === 'number') {
      finalValue = parseFloat(value) || 0;
    }
    
    const newFormData = {
      ...formData,
      [name]: finalValue
    };
    setFormData(newFormData);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      handleSave(newFormData);
    }, 1500); // Debounce time: 1.5 seconds
  };

  const handleArabicFocus = (e) => {
    e.target.style.direction = 'rtl';
    e.target.style.unicodeBidi = 'bidi-override';
  };

  const handleArabicBlur = (e) => {
    e.target.style.direction = '';
    e.target.style.unicodeBidi = '';
  };

  const selectAllText = (e) => {
    e.target.select();
  };

  const formatTimeForInput = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 4).padStart(4, '0');
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  };

  const formatTimeForStorage = (value) => String(value || '').replace(/\D/g, '').slice(0, 4).padStart(4, '0');

  const translateDayLabel = (value) => {
    const normalized = String(value || '').trim().toUpperCase();
    const dayMap = {
      fr: {
        LUNDI: 'Lundi',
        MARDI: 'Mardi',
        MERCREDI: 'Mercredi',
        JEUDI: 'Jeudi',
        VENDREDI: 'Vendredi',
        SAMEDI: 'Samedi',
        DIMANCHE: 'Dimanche',
      },
      en: {
        LUNDI: 'Monday',
        MARDI: 'Tuesday',
        MERCREDI: 'Wednesday',
        JEUDI: 'Thursday',
        VENDREDI: 'Friday',
        SAMEDI: 'Saturday',
        DIMANCHE: 'Sunday',
      }
    };

    return dayMap[lang]?.[normalized] || value || '';
  };

  const scheduleHoraireSave = (row) => {
    if (horaireDebounceRef.current) {
      clearTimeout(horaireDebounceRef.current);
    }

    horaireDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/horaire', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            JOUR: row.JOUR,
            originalHEURE_DEBUT: row.originalHEURE_DEBUT,
            originalHEURE_FIN: row.originalHEURE_FIN,
            originalCONGE: row.originalCONGE,
            HEURE_DEBUT: row.CONGE === 1 ? '0000' : formatTimeForStorage(row.HEURE_DEBUT),
            HEURE_FIN: row.CONGE === 1 ? '0000' : formatTimeForStorage(row.HEURE_FIN),
            CONGE: Number(row.CONGE) === 1 ? 1 : 0
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update horaire table');
        }
        await fetchHoraireRows();
      } catch (err) {
        setErrorMsg(err.message || 'Error saving horaire');
        setTimeout(() => setErrorMsg(''), 5000);
      }
    }, 500);
  };

  const openUserEditor = (user = null) => {
    setEditingUser(user);
    setUserForm({
      username: user?.username || '',
      password: user?.password || '',
      type: user ? (Number(user?.type) === 1 ? '1' : '0') : '1',
    });
    setUserEditorOpen(true);
  };

  const closeUserEditor = () => {
    setUserEditorOpen(false);
    setEditingUser(null);
    setUserForm({ username: '', password: '', type: '1' });
    setShowUserPassword(false);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
  };

  const saveUser = async () => {
    try {
      const payload = {
        username: userForm.username.trim(),
        password: userForm.password,
        type: Number(userForm.type) === 1 ? 1 : 0,
      };

      const response = await fetch(editingUser ? `/api/users/${editingUser.id}` : '/api/users', {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save user');
      }

      await refreshUsers();
      closeUserEditor();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save user');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  const deleteUser = async (user) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE', headers: authHeaders });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete user');
      }
      await refreshUsers();
      if (Number(currentUser?.id) === Number(user.id)) {
        if (onLogout) onLogout();
        return;
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete user');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  const updateHoraireRow = (index, field, value) => {
    setHoraireRows((currentRows) => {
      const nextRows = currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const updatedRow = {
          ...row,
          [field]: field === 'CONGE' ? (value ? 1 : 0) : value
        };

        if (field === 'CONGE' && value) {
          updatedRow.HEURE_DEBUT = '0000';
          updatedRow.HEURE_FIN = '0000';
        } else if (field === 'CONGE' && !value) {
          updatedRow.HEURE_DEBUT = '0800';
          updatedRow.HEURE_FIN = '1600';
        } else if (field === 'HEURE_DEBUT' || field === 'HEURE_FIN') {
          updatedRow[field] = formatTimeForStorage(value);
        }
        scheduleHoraireSave(updatedRow);
        return updatedRow;
      });

      return nextRows;
    });
  };
  
  const sections = [
    { id: 'informations', label: t.sectionInformationsTab, icon: User },
    { id: 'print', label: t.sectionPrintTab, icon: Printer },
    { id: 'images_logo', label: t.sectionImagesLogo, icon: Image },
    { id: 'options', label: t.sectionOptionsTab, icon: Sliders },
    { id: 'users', label: t.sectionUsersTab, icon: Users },
    { id: 'appointments', label: t.sectionAppointmentsTab, icon: CalendarCheck },
    { id: 'pricing_working_hours', label: t.sectionPricingWorkingHoursTab, icon: DollarSign },
  ];

  const getStatusIndicator = () => {
    if (!formData) return null;
    if (saving) {
      return (
        <div className="flex items-center gap-2 text-xs text-yellow-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          {t.savingLabel}
        </div>
      );
    }
    if (successMsg) {
      return (
        <div className="flex items-center gap-2 text-xs text-green-400">
          <CheckCircle2 className="w-3 h-3" />
          {t.updateSuccessMsg}
        </div>
      );
    }
    if (errorMsg) {
        return (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" />
            {errorMsg}
          </div>
        );
      }
    return null;
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-lg text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
          {t.loadingSettings}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-400" />
            {t.clinicSettingsTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.clinicSettingsSubtitle}
          </p>
        </div>
        <div className="h-10 flex items-center justify-center">
            {getStatusIndicator()}
        </div>
      </div>

      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-2 justify-center sm:justify-start">
          {sections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeSection === section.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-800'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        {activeSection === 'informations' && (
          <>
            {/* 1. Identification Médicale */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-teal-400" />
                {t.sectionPhysicianIdentity}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.nomCabinetLabel}</label>
                  <input
                    type="text"
                    name="nomCabinet"
                    value={formData?.nomCabinet || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.doctorNameFrLabel}</label>
                  <input
                    type="text"
                    name="doctorNameFr"
                    value={formData?.doctorNameFr || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.doctorNameArLabel}</label>
                  <input
                    type="text"
                    name="doctorNameAr"
                    value={formData?.doctorNameAr || ''}
                    onChange={handleChange}
                    onFocus={handleArabicFocus}
                    onBlur={handleArabicBlur}
                    dir="rtl"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.specialtyFrLabel}</label>
                  <textarea
                    name="specialtyFr"
                    value={formData?.specialtyFr || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.specialtyArLabel}</label>
                  <textarea
                    name="specialtyAr"
                    value={formData?.specialtyAr || ''}
                    onChange={handleChange}
                    onFocus={handleArabicFocus}
                    onBlur={handleArabicBlur}
                    dir="rtl"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition text-right"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.detailsSpecialiteLabel}</label>
                  <input
                    type="text"
                    name="detailsSpecialite"
                    value={formData?.detailsSpecialite || ''}
                    onChange={handleChange}
                    onFocus={handleArabicFocus}
                    onBlur={handleArabicBlur}
                    dir="rtl"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.orderNumberLabel}</label>
                  <input
                    type="text"
                    name="ordre"
                    value={formData?.ordre || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>
            </div>
            
            {/* 2. Coordonnées et Contacts */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                <Phone className="w-4 h-4 text-teal-400" />
                {t.sectionContact}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.mobilePhoneLabel}</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData?.phone || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.landlinePhoneLabel}</label>
                  <input
                    type="text"
                    name="fixe"
                    value={formData?.fixe || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.proEmailLabel}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData?.email || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.facebookPageLabel}</label>
                  <input
                    type="text"
                    name="facebookPage"
                    value={formData?.facebookPage || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.websiteLabel}</label>
                  <input
                    type="text"
                    name="website"
                    value={formData?.website || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* 3. Adresse & Localisation */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                <Building2 className="w-4 h-4 text-teal-400" />
                {t.sectionLocation}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.addressFrLabel}</label>
                  <textarea
                    name="addressFr"
                    value={formData?.addressFr || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.addressArLabel}</label>
                  <textarea
                    name="addressAr"
                    value={formData?.addressAr || ''}
                    onChange={handleChange}
                    onFocus={handleArabicFocus}
                    onBlur={handleArabicBlur}
                    dir="rtl"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition text-right"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.cityLabel}</label>
                  <input
                    type="text"
                    name="city"
                    value={formData?.city || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>
            </div>
            
            {/* 4. Messages d'Impression */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                <Sliders className="w-4 h-4 text-teal-400" /> {/* Using Sliders as a generic icon for settings */}
                {t.sectionPrescriptions}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.prescriptionSloganLabel}</label>
                  <textarea
                    name="msgOrd"
                    value={formData?.msgOrd || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.messageJauneLabel}</label>
                  <textarea
                    name="msgJaune"
                    value={formData?.msgJaune || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.messageClotureLabel}</label>
                  <textarea
                    name="msgCloture"
                    value={formData?.msgCloture || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'print' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Printer className="w-4 h-4 text-teal-400" />
              {t.printSectionTitle}
            </h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printOrdonnanceLabel}</h4>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_ORD" value="1" checked={String(formData?.IMPR_ORD ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_ORD', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printOrdonnanceA4}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_ORD" value="2" checked={String(formData?.IMPR_ORD ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_ORD', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printOrdonnanceHalf}</label>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printArretLabel}</h4>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_ARRET" value="1" checked={String(formData?.IMPR_ARRET ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_ARRET', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printArretA5}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_ARRET" value="2" checked={String(formData?.IMPR_ARRET ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_ARRET', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printArretA4}</label>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printOrdHeaderLabel}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((model) => (
                    <label key={model} className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                      <input type="radio" name="MODELE_ORD" value={model} checked={String(formData?.MODELE_ORD ?? '1') === String(model)} onChange={(e) => handleChange({ target: { name: 'MODELE_ORD', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
                      {`Modèle ${model}`}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printOrientationLabel}</h4>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_ORIENTATION" value="1" checked={String(formData?.IMPR_ORIENTATION ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_ORIENTATION', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printArretA5}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_ORIENTATION" value="2" checked={String(formData?.IMPR_ORIENTATION ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_ORIENTATION', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printArretA4}</label>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printPaperLabel}</h4>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_PAPIER_PRE_IMPRIME" value="1" checked={String(formData?.IMPR_PAPIER_PRE_IMPRIME ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_PAPIER_PRE_IMPRIME', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printPaperBlank}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_PAPIER_PRE_IMPRIME" value="2" checked={String(formData?.IMPR_PAPIER_PRE_IMPRIME ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_PAPIER_PRE_IMPRIME', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printPaperPrePrinted}</label>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printBottomPageLabel}</h4>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="BAS_PAGE" value="1" checked={String(formData?.BAS_PAGE ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'BAS_PAGE', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printBottomMessage}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="BAS_PAGE" value="2" checked={String(formData?.BAS_PAGE ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'BAS_PAGE', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printBottomContact}</label>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printRdvPaperLabel}</h4>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="TypePapierRDV" value="1" checked={String(typePapierRdv) === '1'} onChange={(e) => { setTypePapierRdv(e.target.value); localStorage.setItem('clinicTypePapierRdv', e.target.value); }} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printRdvA5}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="TypePapierRDV" value="2" checked={String(typePapierRdv) === '2'} onChange={(e) => { setTypePapierRdv(e.target.value); localStorage.setItem('clinicTypePapierRdv', e.target.value); }} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printRdvTicket}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="TypePapierRDV" value="3" checked={String(typePapierRdv) === '3'} onChange={(e) => { setTypePapierRdv(e.target.value); localStorage.setItem('clinicTypePapierRdv', e.target.value); }} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printRdvA4}</label>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printBilanLabel}</h4>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_BILAN" value="1" checked={String(formData?.IMPR_BILAN ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_BILAN', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printBilanA5}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_BILAN" value="2" checked={String(formData?.IMPR_BILAN ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_BILAN', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printBilanTicket}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_BILAN" value="3" checked={String(formData?.IMPR_BILAN ?? '1') === '3'} onChange={(e) => handleChange({ target: { name: 'IMPR_BILAN', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printBilanA4}</label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name="IMPR_BILAN" value="4" checked={String(formData?.IMPR_BILAN ?? '1') === '4'} onChange={(e) => handleChange({ target: { name: 'IMPR_BILAN', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />{t.printBilanA5Ticket}</label>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'images_logo' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Image className="w-4 h-4 text-teal-400" />
              {t.sectionImagesLogo}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-4">
                <label className="block text-sm font-semibold text-teal-300 mb-2">{t.logoLabel}</label>
                <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-teal-500 transition overflow-hidden bg-slate-900/50 flex items-center justify-center cursor-pointer group">
                  {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" /> : <div className="text-center p-4"><Image className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-xs text-slate-400">Cliquez pour ajouter</p></div>}
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setLogo, 'clinicLogo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {logo && <button type="button" onClick={() => { setLogo(null); localStorage.removeItem('clinicLogo'); }} className="text-xs text-red-400 hover:text-red-300 transition">Supprimer</button>}
              </div>
              <div className="flex flex-col items-center gap-4">
                <label className="block text-sm font-semibold text-teal-300 mb-2">{t.headerLabel}</label>
                <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-teal-500 transition overflow-hidden bg-slate-900/50 flex items-center justify-center cursor-pointer group">
                  {header ? <img src={header} alt="Entête Ordonnance" className="w-full h-full object-contain p-2" /> : <div className="text-center p-4"><Image className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-xs text-slate-400">Cliquez pour ajouter</p></div>}
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setHeader, 'clinicHeader')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {header && <button type="button" onClick={() => { setHeader(null); localStorage.removeItem('clinicHeader'); }} className="text-xs text-red-400 hover:text-red-300 transition">Supprimer</button>}
              </div>
              <div className="flex flex-col items-center gap-4">
                <label className="block text-sm font-semibold text-teal-300 mb-2">{t.badgeLabel}</label>
                <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-teal-500 transition overflow-hidden bg-slate-900/50 flex items-center justify-center cursor-pointer group">
                  {badge ? <img src={badge} alt="Image Verso Badge" className="w-full h-full object-contain p-2" /> : <div className="text-center p-4"><Image className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-xs text-slate-400">Cliquez pour ajouter</p></div>}
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBadge, 'clinicBadge')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {badge && <button type="button" onClick={() => { setBadge(null); localStorage.removeItem('clinicBadge'); }} className="text-xs text-red-400 hover:text-red-300 transition">Supprimer</button>}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'options' && (
          <div className="space-y-6">
            {/* Option disponible dans la consultation Section */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                <Sliders className="w-4 h-4 text-teal-400" />
                {t.consultationOptionsTitle}
              </h3>

              {/* Ordonnance */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ord"
                  name="ORD"
                  checked={formData?.ORD === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      ORD: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="ord" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.ordonnanceLabel}
                </label>
              </div>

              {/* Certificat Médical */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="cert_medic"
                  name="CERT_MEDIC"
                  checked={formData?.CERT_MEDIC === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      CERT_MEDIC: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="cert_medic" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.certMedicLabel}
                </label>
              </div>

              {/* Bilans */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="bilan"
                  name="BILAN"
                  checked={formData?.BILAN === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      BILAN: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="bilan" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.bilanLabel}
                </label>
              </div>

              {/* Lettre d'Orientation */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="let_or"
                  name="LET_OR"
                  checked={formData?.LET_OR === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      LET_OR: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="let_or" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.letOrLabel}
                </label>
              </div>

              {/* Arrêt de Travail */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="arret_trav"
                  name="ARRET_TRAV"
                  checked={formData?.ARRET_TRAV === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      ARRET_TRAV: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="arret_trav" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.arretTravLabel}
                </label>
              </div>

              {/* Document Médical */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="motif"
                  name="MOTIF"
                  checked={formData?.MOTIF === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      MOTIF: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="motif" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.documentMedicLabel}
                </label>
              </div>
            </div>

            {/* Activation des Options Section */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                <Sliders className="w-4 h-4 text-teal-400" />
                {t.activationOptionsTitle}
              </h3>

              {/* Gestion des Rendez-vous */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="gest_rdv"
                  name="GEST_RDV"
                  checked={formData?.GEST_RDV === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      GEST_RDV: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="gest_rdv" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.gestRdvLabel}
                </label>
              </div>

              {/* Résumer de la dernière consultation */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="resume_dern_cons"
                  name="RESUME_DERN_CONS"
                  checked={formData?.RESUME_DERN_CONS === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      RESUME_DERN_CONS: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="resume_dern_cons" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.resumeDernConsLabel}
                </label>
              </div>

              {/* Gestion des Images Médical */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="gest_image"
                  name="GEST_IMAGE"
                  checked={formData?.GEST_IMAGE === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      GEST_IMAGE: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="gest_image" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.gestImageLabel}
                </label>
              </div>

              {/* Aperçu avant impression */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="apercu"
                  name="APERCU"
                  checked={formData?.APERCU === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      APERCU: e.target.checked ? 1 : 0
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="apercu" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.apercuLabel}
                </label>
              </div>
            </div>

            {/* Gestion des Options Section */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                <Sliders className="w-4 h-4 text-teal-400" />
                {t.optionsManagementTitle}
              </h3>

              {/* Gestion des Ordonnances */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-200">{t.gestOrdonnancesLabel}</label>
              <div className="space-y-2 ml-4">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="gest_ord_selection"
                    name="GEST_ORDONNANCE"
                    value="1"
                    checked={formData?.GEST_ORDONNANCE === 1}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="gest_ord_selection" className="text-sm text-slate-300 cursor-pointer">
                    {t.gestOrdSelection}
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="gest_ord_saisie"
                    name="GEST_ORDONNANCE"
                    value="2"
                    checked={formData?.GEST_ORDONNANCE === 2}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="gest_ord_saisie" className="text-sm text-slate-300 cursor-pointer">
                    {t.gestOrdPrescription}
                  </label>
                </div>
              </div>
            </div>

            {/* Gestion des Bilans */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-200">{t.gestBilansLabel}</label>
              <div className="space-y-2 ml-4">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="gest_bilan_saisie"
                    name="GEST_BILAN"
                    value="1"
                    checked={formData?.GEST_BILAN === 1}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="gest_bilan_saisie" className="text-sm text-slate-300 cursor-pointer">
                    {t.gestBilanSaisie}
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="gest_bilan_case"
                    name="GEST_BILAN"
                    value="2"
                    checked={formData?.GEST_BILAN === 2}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="gest_bilan_case" className="text-sm text-slate-300 cursor-pointer">
                    {t.gestBilanCheckbox}
                  </label>
                </div>
              </div>
            </div>

            {/* Fréquence des médicaments */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-200">{t.freqMedicLabel}</label>
              <div className="space-y-2 ml-4">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="freq_medic_un"
                    name="FREQ_MEDIC"
                    value="1"
                    checked={formData?.FREQ_MEDIC === 1}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="freq_medic_un" className="text-sm text-slate-300 cursor-pointer">
                    {t.freqMedicOne}
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="freq_medic_tous"
                    name="FREQ_MEDIC"
                    value="2"
                    checked={formData?.FREQ_MEDIC === 2}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="freq_medic_tous" className="text-sm text-slate-300 cursor-pointer">
                    {t.freqMedicAll}
                  </label>
                </div>
              </div>
            </div>

            {/* Infos Supplémentaire Ordonnance */}
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="info_sup_ord"
                  name="INFO_SUP_ORD"
                  checked={formData?.INFO_SUP_ORD === 1}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      INFO_SUP_ORD: e.target.checked ? 1 : 2
                    };
                    setFormData(newFormData);
                    
                    if (debounceTimeout.current) {
                      clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(() => {
                      handleSave(newFormData);
                    }, 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor="info_sup_ord" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  {t.infoSupOrdLabel}
                </label>
              </div>
            </div>

          </div>
          </div>
        )}

        {activeSection === 'users' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            {!userEditorOpen ? (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-400" />
                      {t.usersContentTitle}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{t.usersContentSubtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openUserEditor()}
                    className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-700 text-sm font-semibold hover:bg-teal-500/30 transition"
                  >
                    {t.usersAddBtn}
                  </button>
                </div>

                {usersLoading ? (
                  <div className="text-sm text-slate-400">{t.usersLoading}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-300">
                          <th className="py-2 pr-4 font-semibold">{t.usersTableId}</th>
                          <th className="py-2 pr-4 font-semibold">{t.usersTableUsername}</th>
                          <th className="py-2 pr-4 font-semibold">{t.usersTablePassword}</th>
                          <th className="py-2 pr-4 font-semibold">{t.usersTableType}</th>
                          <th className="py-2 pr-4 font-semibold">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersRows.length > 0 ? usersRows.map((user) => (
                          <tr key={user.id} className="border-b border-slate-800 text-slate-100">
                            <td className="py-2 pr-4 font-mono text-slate-300">{user.id}</td>
                            <td className="py-2 pr-4">{user.username}</td>
                            <td className="py-2 pr-4 font-mono text-slate-300">{user.password}</td>
                            <td className="py-2 pr-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                user.type === 1
                                  ? 'bg-teal-500/15 text-teal-300 border border-teal-700'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-700'
                              }`}>
                                {user.type === 1 ? t.usersTypeDoctor : t.usersTypeReception}
                              </span>
                            </td>
                            <td className="py-2 pr-4">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => openUserEditor(user)}
                                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-700 text-xs font-semibold hover:bg-sky-500/25 transition"
                                  >
                                    {t.usersEditBtn}
                                  </button>
                                {Number(currentUser?.id) !== Number(user.id) &&
                                  usersRows.some(
                                    (otherUser) =>
                                      Number(otherUser.id) !== Number(user.id) &&
                                      Number(otherUser.type) === Number(user.type),
                                  ) && (
                                    <button
                                      type="button"
                                      onClick={() => setDeleteTarget(user)}
                                      className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-700 text-xs font-semibold hover:bg-rose-500/25 transition"
                                    >
                                      {t.usersDeleteBtn}
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-slate-400">
                              {t.usersEmpty}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-400" />
                      {editingUser ? t.usersFormTitleEdit : t.usersFormTitleAdd}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{t.usersFormSubtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeUserEditor}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold hover:bg-slate-700 transition"
                  >
                    {t.usersFormCancel}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{t.usersFormUsername}</label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm((current) => ({ ...current, username: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{t.usersFormPassword}</label>
                    <div className="relative">
                      <input
                        type={showUserPassword ? 'text' : 'password'}
                        value={userForm.password}
                        onChange={(e) => setUserForm((current) => ({ ...current, password: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 pr-24 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserPassword((current) => !current)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition"
                      >
                        {showUserPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">{t.usersFormType}</label>
                    <select
                      value={userForm.type}
                      onChange={(e) => setUserForm((current) => ({ ...current, type: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    >
                      <option value="1">{t.usersFormDoctor}</option>
                      <option value="0">{t.usersFormReception}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={saveUser}
                    className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-700 text-sm font-semibold hover:bg-teal-500/30 transition"
                  >
                    {t.usersFormSave}
                  </button>
                </div>
              </div>
            )}

            {deleteTarget && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
                <div className="w-full max-w-md rounded-2xl border border-rose-900 bg-slate-900 shadow-2xl shadow-black/40">
                  <div className="border-b border-slate-800 px-6 py-4">
                    <h4 className="text-base font-bold text-rose-300">{t.usersDeleteTitle || 'Delete user'}</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      {t.usersDeleteMessage || 'This action permanently removes the selected user.'}
                    </p>
                  </div>
                  <div className="px-6 py-5 space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                      <span className="text-slate-400">{t.usersFormUsername}: </span>
                      <span className="font-semibold">{deleteTarget.username}</span>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={closeDeleteDialog}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold hover:bg-slate-700 transition"
                      >
                        {t.usersFormCancel}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const target = deleteTarget;
                          closeDeleteDialog();
                          await deleteUser(target);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-700 text-sm font-semibold hover:bg-rose-500/30 transition"
                      >
                        {t.usersDeleteBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'appointments' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <CalendarCheck className="w-4 h-4 text-teal-400" />
              {t.sectionAppointmentsTab}
            </h3>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printRdvSlip}
                    onChange={(e) => {
                      setPrintRdvSlip(e.target.checked);
                      localStorage.setItem('clinicPrintRdvSlip', e.target.checked ? '1' : '0');
                    }}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer accent-teal-500"
                  />
                  {t.printRdvSlipLabel}
                </label>
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printVisitSlip}
                    onChange={(e) => {
                      setPrintVisitSlip(e.target.checked);
                      localStorage.setItem('clinicPrintVisitSlip', e.target.checked ? '1' : '0');
                    }}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer accent-teal-500"
                  />
                  {t.printVisitSlipLabel}
                </label>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">
                  {t.appointmentsModelLabel}
                </h4>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="MOTIF_RDV"
                    value="1"
                    checked={String(formData?.MOTIF_RDV ?? '1') === '1'}
                    onChange={(e) => handleChange({ target: { name: 'MOTIF_RDV', value: e.target.value, type: 'radio' } })}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700"
                  />
                  {t.appointmentsModelInput}
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="MOTIF_RDV"
                    value="2"
                    checked={String(formData?.MOTIF_RDV ?? '1') === '2'}
                    onChange={(e) => handleChange({ target: { name: 'MOTIF_RDV', value: e.target.value, type: 'radio' } })}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700"
                  />
                  {t.appointmentsModelDropdown}
                </label>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">
                  {t.appointmentsNumberLabel}
                </h4>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="NUM_RDV"
                    value="1"
                    checked={String(formData?.NUM_RDV ?? '1') === '1'}
                    onChange={(e) => handleChange({ target: { name: 'NUM_RDV', value: e.target.value, type: 'radio' } })}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700"
                  />
                  {t.appointmentsNumberContinuous}
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="NUM_RDV"
                    value="2"
                    checked={String(formData?.NUM_RDV ?? '1') === '2'}
                    onChange={(e) => handleChange({ target: { name: 'NUM_RDV', value: e.target.value, type: 'radio' } })}
                    className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700"
                  />
                  {t.appointmentsNumberByDay}
                </label>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'pricing_working_hours' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Clock className="w-4 h-4 text-teal-400" />
              {t.sectionPricingWorkingHoursTab}
            </h3>

            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">
                  {t.pricingGroupPriceTitle}
                </h4>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.consultationPriceLabel}</label>
                  <input
                    type="number"
                    name="prixConsultation"
                    value={formData?.prixConsultation || 0}
                    onChange={handleChange}
                    onFocus={selectAllText}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-700">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">
                  {t.pricingGroupWorkingHoursTitle}
                </h4>
                <div className="overflow-x-auto">
                  <div className="min-w-[640px] space-y-2">
                    <div className="grid grid-cols-4 gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">
                      <span>{t.workingHoursDayHeader}</span>
                      <span>{t.workingHoursStartHeader}</span>
                      <span>{t.workingHoursEndHeader}</span>
                      <span>{t.workingHoursCongeLabel}</span>
                    </div>
                    {horaireRows.map((row, index) => {
                      const isConge = Number(row.CONGE) === 1;
                      const dayLabel = translateDayLabel(row.JOUR) || `Day ${index + 1}`;
                      return (
                        <div
                          key={`${row.originalHEURE_DEBUT || row.HEURE_DEBUT}-${row.originalHEURE_FIN || row.HEURE_FIN}-${index}`}
                          className={`grid grid-cols-4 gap-3 items-center rounded-xl border px-3 py-2 ${
                            isConge
                              ? 'border-rose-800/60 bg-rose-950/25'
                              : 'border-emerald-800/40 bg-emerald-950/20'
                          }`}
                        >
                          <div className={`text-xs font-semibold ${isConge ? 'text-rose-300' : 'text-emerald-300'}`}>
                            {dayLabel}
                          </div>
                          <input
                            type="time"
                            step="60"
                            value={formatTimeForInput(row.HEURE_DEBUT)}
                            disabled={isConge}
                            onChange={(e) => updateHoraireRow(index, 'HEURE_DEBUT', e.target.value)}
                            className={`working-time-input w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none ${
                              isConge
                                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-teal-950/70 border-teal-500/50 text-teal-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 cursor-pointer'
                            }`}
                          />
                          <input
                            type="time"
                            step="60"
                            value={formatTimeForInput(row.HEURE_FIN)}
                            disabled={isConge}
                            onChange={(e) => updateHoraireRow(index, 'HEURE_FIN', e.target.value)}
                            className={`working-time-input w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none ${
                              isConge
                                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-teal-950/70 border-teal-500/50 text-teal-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 cursor-pointer'
                            }`}
                          />
                          <label className={`flex items-center gap-2 text-sm font-semibold ${isConge ? 'text-rose-300' : 'text-emerald-300'}`}>
                            <input
                              type="checkbox"
                              checked={isConge}
                              onChange={(e) => updateHoraireRow(index, 'CONGE', e.target.checked)}
                              className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer accent-teal-500"
                            />
                            {lang === 'fr' ? 'Congé' : 'Leave'}
                          </label>
                        </div>
                      );
                    })}
                    {horaireRows.length === 0 && (
                      <div className="text-sm text-slate-400 px-1">
                        {t.noWorkingHoursLabel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
