import React, { useState, useEffect, useRef } from 'react';
import { Settings, CheckCircle2, AlertCircle, Building2, Phone, User, Clock, Users, CalendarCheck, Sliders, DollarSign, Printer, Image } from 'lucide-react';
import { translations } from '../translations';

export default function ClinicSettings({ onUpdateClinicInfo, lang = 'fr' }) {
  const t = translations[lang] || translations.fr;
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSection, setActiveSection] = useState('informations');
  const [logo, setLogo] = useState(null);
  const [header, setHeader] = useState(null);
  const [badge, setBadge] = useState(null);
  const [workFolder, setWorkFolder] = useState('');
  const debounceTimeout = useRef(null);

  const workFolderStorageKey = 'el_iyada_work_folder';
  const workFolderHandleKey = 'el_iyada_work_folder_handle';
  const workFolderInputRef = useRef(null);

  const saveWorkFolderHandle = async (handle) => {
    try {
      const db = await openWorkFolderDb();
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(handle, 'work-folder');
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      db.close();
    } catch (err) {
      console.error('Failed to persist work folder handle:', err);
    }
  };

  const openWorkFolderDb = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('el_iyada_settings', 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles');
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const loadSavedWorkFolderHandle = async () => {
    try {
      const db = await openWorkFolderDb();
      const tx = db.transaction('handles', 'readonly');
      const request = tx.objectStore('handles').get('work-folder');
      const handle = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return handle;
    } catch (err) {
      console.error('Failed to load work folder handle:', err);
      return null;
    }
  };

  const getFolderDisplayValue = async (handle) => {
    if (!handle) return '';
    if (handle?.name) return handle.name;
    return '';
  };

  useEffect(() => {
    const fetchClinicInfo = async () => {
      try {
        const res = await fetch('/api/clinic');
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

    const loadWorkFolder = async () => {
      try {
        const savedPath = localStorage.getItem(workFolderStorageKey);
        if (savedPath) {
          setWorkFolder(savedPath);
          return;
        }

        const savedHandle = await loadSavedWorkFolderHandle();
        if (savedHandle) {
          const displayValue = await getFolderDisplayValue(savedHandle);
          if (displayValue) {
            setWorkFolder(displayValue);
            localStorage.setItem(workFolderStorageKey, displayValue);
          }
        }
      } catch (err) {
        console.error('Failed to restore work folder:', err);
      }
    };

    loadWorkFolder();
  }, []);

  const handleWorkFolderBrowse = async () => {
    try {
      let handle = null;

      if (window.showDirectoryPicker) {
        handle = await window.showDirectoryPicker();
        await saveWorkFolderHandle(handle);
      } else if (workFolderInputRef.current) {
        workFolderInputRef.current.click();
        return;
      }

      if (handle) {
        const displayValue = await getFolderDisplayValue(handle);
        setWorkFolder(displayValue);
        localStorage.setItem(workFolderStorageKey, displayValue);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Failed to select work folder:', err);
      }
    }
  };

  const handleWorkFolderInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const relativePath = file.webkitRelativePath || file.name;
    const folderName = relativePath.includes('/') ? relativePath.split('/')[0] : file.name;
    setWorkFolder(folderName);
    localStorage.setItem(workFolderStorageKey, folderName);
    e.target.value = '';
  };

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
        headers: { 'Content-Type': 'application/json' },
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
      console.error('Settings submit error:', err);
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
    if (type === 'radio' && ['GEST_ORDONNANCE', 'GEST_BILAN', 'FREQ_MEDIC'].includes(name)) {
      finalValue = parseInt(value) || null;
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
  
  const sections = [
    { id: 'informations', label: t.sectionInformationsTab, icon: User },
    { id: 'print', label: t.sectionPrintTab, icon: Printer },
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
                    placeholder="Cabinet Dr. A. BENKERMI Ep. TATI"
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
                    placeholder="Dr. A. BENKERMI Ep. TATI"
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
                    placeholder="الحكيمة : أ, بن كرمي زوجة ططاي"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.specialtyFrLabel}</label>
                  <textarea
                    name="specialtyFr"
                    value={formData?.specialtyFr || ''}
                    onChange={handleChange}
                    placeholder="Spécialiste en ORL • Thyroïde • Audition"
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
                    placeholder="طبيبة مختصة في أمراض وجراحة الأذن"
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
                    placeholder="Ancien médecin ..."
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
                    placeholder="3876/23"
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
                    placeholder="0558 413 240"
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
                    placeholder="038 00 00 00"
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
                    placeholder="doctor@example.com"
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
                    placeholder="https://facebook.com/..."
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
                    placeholder="www.clinic.com"
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
                    placeholder="El Bouni ANNABA"
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
                    placeholder="البوني عنابة"
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
                    placeholder="El Bouni"
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
                    placeholder="Sauver des vies - Donnez de votre sang"
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
                    placeholder="Message Jaune Ordonnance"
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
                    placeholder="Message Clôture Ordonnance"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo */}
              <div className="flex flex-col items-center gap-4">
                <label className="block text-sm font-semibold text-teal-300 mb-2">{t.logoLabel}</label>
                <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-teal-500 transition overflow-hidden bg-slate-900/50 flex items-center justify-center cursor-pointer group">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center p-4">
                      <Image className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Cliquez pour ajouter</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setLogo, 'clinicLogo')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {logo && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogo(null);
                      localStorage.removeItem('clinicLogo');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Supprimer
                  </button>
                )}
              </div>

              {/* Entête Ordonnance */}
              <div className="flex flex-col items-center gap-4">
                <label className="block text-sm font-semibold text-teal-300 mb-2">{t.headerLabel}</label>
                <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-teal-500 transition overflow-hidden bg-slate-900/50 flex items-center justify-center cursor-pointer group">
                  {header ? (
                    <img src={header} alt="Entête Ordonnance" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center p-4">
                      <Image className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Cliquez pour ajouter</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setHeader, 'clinicHeader')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {header && (
                  <button
                    type="button"
                    onClick={() => {
                      setHeader(null);
                      localStorage.removeItem('clinicHeader');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Supprimer
                  </button>
                )}
              </div>

              {/* Image Verso Badge */}
              <div className="flex flex-col items-center gap-4">
                <label className="block text-sm font-semibold text-teal-300 mb-2">{t.badgeLabel}</label>
                <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-teal-500 transition overflow-hidden bg-slate-900/50 flex items-center justify-center cursor-pointer group">
                  {badge ? (
                    <img src={badge} alt="Image Verso Badge" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center p-4">
                      <Image className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Cliquez pour ajouter</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setBadge, 'clinicBadge')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {badge && (
                  <button
                    type="button"
                    onClick={() => {
                      setBadge(null);
                      localStorage.removeItem('clinicBadge');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Supprimer
                  </button>
                )}
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

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-200">Work Folder</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={workFolder}
                    readOnly
                    placeholder="No work folder selected"
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none cursor-default"
                  />
                  <button
                    type="button"
                    onClick={handleWorkFolderBrowse}
                    className="shrink-0 bg-teal-500/20 text-teal-300 border border-teal-800 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-teal-500/30 transition"
                  >
                    Browse
                  </button>
                </div>
                <input
                  ref={workFolderInputRef}
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  className="hidden"
                  onChange={handleWorkFolderInputChange}
                />
              </div>

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
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
            <Users className="w-10 h-10 text-teal-400 mx-auto mb-4" />
            <p className="text-sm text-slate-400">{t.usersContentPlaceholder}</p>
          </div>
        )}

        {activeSection === 'appointments' && (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
            <CalendarCheck className="w-10 h-10 text-teal-400 mx-auto mb-4" />
            <p className="text-sm text-slate-400">{t.appointmentsContentPlaceholder}</p>
          </div>
        )}

        {activeSection === 'pricing_working_hours' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Clock className="w-4 h-4 text-teal-400" />
              {t.sectionPricingWorkingHoursTab}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t.consultationPriceLabel}</label>
                <input
                  type="number"
                  name="prixConsultation"
                  value={formData?.prixConsultation || 0}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t.prescriptionPriceLabel}</label>
                <input
                  type="number"
                  name="prixOrdonnance"
                  value={formData?.prixOrdonnance || 0}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t.appointmentDurationLabel}</label>
                <input
                  type="number"
                  name="nbMinuteRdv"
                  value={formData?.nbMinuteRdv || 0}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t.maxAppointmentsLabel}</label>
                <input
                  type="number"
                  name="nbrRdv"
                  value={formData?.nbrRdv || 0}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
