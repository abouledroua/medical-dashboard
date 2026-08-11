import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sliders, Pill, FileText, Files, Beaker, Award, PlusCircle, Edit, Trash2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { translations } from '../translations';
import ConfirmDialog from './ConfirmDialog';
import * as XLSX from 'xlsx';

const ProgressOverlay = ({ isOpen, progress, estimatedTime, current, total, t }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4 text-center">{t.uploadingMedications}</h3>
        <div className="w-full bg-slate-800 rounded-full h-4 mb-4 overflow-hidden relative">
          <div 
            className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>{current} / {total} {t.records}</span>
          <span className="font-bold text-white">{Math.round(progress)}%</span>
        </div>
        <div className="text-center text-slate-300 text-sm mt-4">
          {t.estimatedTimeRemaining} <span className="font-bold text-teal-400">{estimatedTime}</span>
        </div>
      </div>
    </div>
  );
};

const TimedAlert = ({ message, type, onClose }) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onCloseRef.current) onCloseRef.current();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 overflow-hidden bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col min-w-[300px]"
      style={{ zIndex: 99999 }}
    >
      <div className="p-4 flex items-center gap-3 text-sm font-medium">
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-400" />
        )}
        <span className="text-white">{message}</span>
      </div>
      <div className="h-1 w-full bg-slate-800">
        <div 
          className={`h-full ${type === 'success' ? 'bg-green-400' : 'bg-red-400'}`} 
          style={{ animation: 'shrink 3s linear forwards' }}
        ></div>
      </div>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

const SectionButton = ({ id, label, icon: Icon, activeSection, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
      activeSection === id
        ? 'bg-teal-500/20 text-teal-300 border border-teal-800'
        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {label && <span>{label}</span>}
  </button>
);

const CrudView = ({ title, data, columns, onAdd, onBulkAdd, bulkAddBtnLabel, onEdit, onDelete, onActivate, onDeactivate, renderForm, lang = 'fr', hideEditBtn = false }) => {
    const t = translations[lang] || translations.fr;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const itemsPerPage = 50;

    const filteredData = (data || []).filter(item => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return columns.some(col => {
            const val = item[col.key];
            return val !== null && val !== undefined && String(val).toLowerCase().includes(lowerQuery);
        });
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const openForm = (item = null) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingItem(null);
    };
    
    return(
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider">{title}</h3>
            <div className="flex items-center gap-3">
                <input 
                    type="text" 
                    placeholder={t.searchPlaceholderShort}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500 w-48 sm:w-64"
                />
                <button
                type="button"
                onClick={() => openForm()}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center gap-2 text-xs transition"
                >
                    <PlusCircle className="w-4 h-4" />
                    {t.addBtn}
                </button>
                {onBulkAdd && (
                    <button 
                        onClick={onBulkAdd}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-sm font-medium transition"
                    >
                        <Upload className="w-4 h-4" />
                        {bulkAddBtnLabel || t.loadMedicationsListBtn || 'Upload List'}
                    </button>
                )}
            </div>
        </div>
        
        {isFormOpen && renderForm({
            item: editingItem,
            onClose: closeForm,
            onSave: (itemData) => {
                if (editingItem) {
                    onEdit(itemData);
                } else {
                    onAdd(itemData);
                }
                closeForm();
            },
            lang: lang
        })}

        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-300">
                {columns.map(col => <th key={col.key} className="py-2 pr-4 font-semibold">{col.label}</th>)}
                <th className="py-2 pr-4 font-semibold">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="py-4 text-slate-400 text-center">
                    {t.noDataYet}
                  </td>
                </tr>
              )}
              {paginatedData.map((item) => (
                <tr key={item.id} className={`border-b border-slate-800 text-slate-100 ${item.etat === 0 ? 'opacity-50 grayscale' : ''}`}>
                  {columns.map(col => (
                      <td key={col.key} className="py-2 pr-4">
                          {col.key === 'etat'
                              ? (item[col.key] === 1 ? t.activated : t.deactivated)
                              : item[col.key]}
                      </td>
                  ))}
                  <td className="py-2 pr-4 flex gap-2">
                    {!hideEditBtn && (
                        <button onClick={() => openForm(item)} className="p-1.5 text-sky-400 hover:text-sky-300" title={t.editBtn}><Edit className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => onDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-300" title={t.deleteBtn}><Trash2 className="w-4 h-4" /></button>
                    {item.etat === 0 ? (
                        <button onClick={() => onActivate(item.id)} className="p-1.5 text-green-400 hover:text-green-300" title={t.activateBtn}>
                            <PlusCircle className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={() => onDeactivate(item.id)} className="p-1.5 text-yellow-400 hover:text-yellow-300" title={t.deactivateBtn}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
                <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1 bg-slate-700 disabled:opacity-50 rounded text-slate-200 hover:bg-slate-600 transition"
                >
                    &laquo; {t.previous}
                </button>
                <span className="text-sm text-slate-300">
                    {t.page} {currentPage} / {totalPages}
                </span>
                <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1 bg-slate-700 disabled:opacity-50 rounded text-slate-200 hover:bg-slate-600 transition"
                >
                    {t.next} &raquo;
                </button>
            </div>
        )}
      </div>
    );
}

export default function DataTemplates({ lang = 'fr' }) {
  const t = translations[lang] || translations.fr;
  const [activeSection, setActiveSection] = useState('medicaments');
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, variant: 'danger' });
  const fileInputRef = useRef(null);
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    estimatedTime: 'Calculating...',
    current: 0,
    total: 0
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [medicaments, setMedicaments] = useState([]);
  const [prescriptionsP, setPrescriptionsP] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bilans, setBilans] = useState([]);
  const [certificats, setCertificats] = useState([]);
  
  const fetchMedicaments = useCallback(async () => {
    try {
      const response = await fetch('/api/medications');
      if (!response.ok) {
        console.error('Failed to fetch medicaments:', response.status, response.statusText);
        setMedicaments([]);
        return;
      }
      const data = await response.json();
      setMedicaments(data);
    } catch (error) {
      console.error('Failed to fetch medicaments:', error);
      setMedicaments([]);
    }
  }, []);
  
  const fetchPrescriptionsP = useCallback(async () => {
    try {
      const response = await fetch('/api/medications/p');
      if (!response.ok) {
        setPrescriptionsP([]);
        return;
      }
      const data = await response.json();
      setPrescriptionsP(data);
    } catch (error) {
      setPrescriptionsP([]);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'medicaments') {
      fetchMedicaments();
    } else if (activeSection === 'prescriptions') {
      fetchPrescriptionsP();
    }
  }, [activeSection, fetchMedicaments, fetchPrescriptionsP]);

  const handleAddMedicament = async (item) => {
    try {
      const response = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const newItem = await response.json();
      setMedicaments([...medicaments, newItem]);
    } catch (error) {
      console.error('Failed to add medicament:', error);
    }
  };

  const handleAddPrescriptionP = async (item) => {
    try {
      const response = await fetch('/api/medications/p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const newItem = await response.json();
      setPrescriptionsP([...prescriptionsP, newItem]);
    } catch (error) {
      console.error('Failed to add prescription:', error);
    }
  };

  const handleBulkAddMedicaments = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find header row index
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(20, json.length); i++) {
            const rowStr = json[i].map(c => String(c).toLowerCase()).join(' ');
            if (rowStr.includes('n°') || json[i].some(c => String(c).trim().toUpperCase() === 'N°')) {
                headerRowIdx = i;
                break;
            }
        }

        const headers = headerRowIdx !== -1 ? json[headerRowIdx] : [];
        const dataRows = headerRowIdx !== -1 ? json.slice(headerRowIdx + 1) : json;

        const getColIndex = (keyStrs) => {
            for (const keyStr of keyStrs) {
                const idx = headers.findIndex(h => String(h).toLowerCase().includes(keyStr.toLowerCase()));
                if (idx !== -1) return idx;
            }
            return -1;
        };

        const idxDesignation = getColIndex(['nom de marque']);
        const idxFormat = getColIndex(['forme']);
        const idxCond = getColIndex(['dosage']);
        const idxDci = getColIndex(['dci', 'principe actif']);

        const mapped = dataRows.map(row => ({
            designation: idxDesignation !== -1 ? row[idxDesignation] : '',
            format: idxFormat !== -1 ? row[idxFormat] : '',
            conditionnement: idxCond !== -1 ? row[idxCond] : '',
            dci: idxDci !== -1 ? row[idxDci] : ''
        })).filter(m => m.designation);

        if (mapped.length === 0) {
            setConfirmConfig({
              isOpen: true,
              title: t.warning,
              message: t.noValidMedsExcel,
              variant: 'warning',
              onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        const total = mapped.length;
        const chunkSize = 500;
        const chunks = [];
        for (let i = 0; i < total; i += chunkSize) {
            chunks.push(mapped.slice(i, i + chunkSize));
        }

        setUploadState({
            isUploading: true,
            progress: 0,
            estimatedTime: t.calculating,
            current: 0,
            total
        });

        const startTime = Date.now();
        let currentProcessed = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            const response = await fetch('/api/medications/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medications: chunk })
            });

            if (!response.ok) {
                const err = await response.json();
                let errMsg = err.error || t.failedBulkInsert;
                if (err.code === 'INVALID_FORMAT') {
                     errMsg = t.invalidDataFormatExcel;
                } else if (err.code === 'NO_VALID_MEDS') {
                     errMsg = t.noValidMedsInsert;
                } else if (err.code === 'INSERT_FAILED') {
                     errMsg = t.failedBulkInsert;
                }
                throw new Error(errMsg);
            }

            currentProcessed += chunk.length;
            const elapsed = Date.now() - startTime;
            const avgTimePerChunk = elapsed / (i + 1);
            const remainingChunks = chunks.length - (i + 1);
            const msRemaining = avgTimePerChunk * remainingChunks;
            
            let estimatedTime = t.almostDone;
            if (msRemaining > 60000) {
                estimatedTime = `${Math.ceil(msRemaining / 60000)} ${t.minutes}`;
            } else if (msRemaining > 0) {
                estimatedTime = `${Math.ceil(msRemaining / 1000)} ${t.seconds}`;
            }

            setUploadState({
                isUploading: true,
                progress: (currentProcessed / total) * 100,
                estimatedTime,
                current: currentProcessed,
                total
            });
        }

        // Small delay at 100% for visual completion
        await new Promise(resolve => setTimeout(resolve, 500));
        setUploadState(prev => ({ ...prev, isUploading: false }));
        
        setSuccessMsg(t.uploadSuccessMeds);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchMedicaments();
    } catch (error) {
        setUploadState(prev => ({ ...prev, isUploading: false }));
        console.error('Error uploading excel:', error);
        setErrorMsg(error.message);
        setTimeout(() => setErrorMsg(''), 5000);
    } finally {
        event.target.value = null;
    }
  };

  const handleEditMedicament = async (item) => {
    try {
      await fetch(`/api/medications/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      setMedicaments(medicaments.map(m => m.id === item.id ? item : m));
    } catch (error) {
      console.error('Failed to edit medicament:', error);
    }
  };

  const handleDeleteMedicament = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t.confirmDeletion,
      message: t.sureDeleteMed,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/medications/${id}`, { method: 'DELETE' });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            setErrorMsg(errData.error || t.failedDeleteMed || 'Failed to delete medication');
            return;
          }
          fetchMedicaments();
          setSuccessMsg(lang === 'en' ? 'Medication deleted successfully' : 'Médicament supprimé avec succès');
        } catch (error) {
          console.error("Delete Error:", error);
          setErrorMsg(t.errorDeletingMed);
        }
      }
    });
  };

  const handleActivateMedicament = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t.confirmActivation,
      message: t.sureActivateMed,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/medications/${id}/activate`, { method: 'PUT' });
          setMedicaments(prev => prev.map(m => m.id === id ? { ...m, etat: 1 } : m));
        } catch (error) {
          console.error('Failed to activate medicament:', error);
        }
      }
    });
  };

  const handleDeactivateMedicament = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t.confirmDeactivation,
      message: t.sureDeactivateMed,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/medications/${id}/deactivate`, { method: 'PUT' });
          setMedicaments(prev => prev.map(m => m.id === id ? { ...m, etat: 0 } : m));
        } catch (error) {
          console.error('Failed to deactivate medicament:', error);
        }
      }
    });
  };

  const handleEditPrescriptionP = async (item) => {
    try {
      await fetch(`/api/medications/p/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      setPrescriptionsP(prescriptionsP.map(m => m.id === item.id ? item : m));
    } catch (error) {}
  };

  const handleDeletePrescriptionP = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t.confirmDeletion,
      message: t.sureDeletePrescription,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/medications/p/${id}`, { method: 'DELETE' });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            setErrorMsg(errData.error || (lang === 'en' ? 'Failed to delete prescription' : 'Échec de la suppression de la prescription'));
            return;
          }
          fetchPrescriptionsP();
          setSuccessMsg(lang === 'en' ? 'Prescription deleted successfully' : 'Prescription supprimée avec succès');
        } catch (error) {
          console.error("Delete Error:", error);
          setErrorMsg(lang === 'en' ? "Error deleting prescription" : "Erreur lors de la suppression de la prescription");
        }
      }
    });
  };

  const handleActivatePrescriptionP = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t.confirmActivation,
      message: t.sureActivatePrescription,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/medications/p/${id}/activate`, { method: 'PUT' });
          setPrescriptionsP(prev => prev.map(m => m.id === id ? { ...m, etat: 1 } : m));
        } catch (error) {}
      }
    });
  };

  const handleDeactivatePrescriptionP = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t.confirmDeactivation,
      message: t.sureDeactivatePrescription,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/medications/p/${id}/deactivate`, { method: 'PUT' });
          setPrescriptionsP(prev => prev.map(m => m.id === id ? { ...m, etat: 0 } : m));
        } catch (error) {}
      }
    });
  };

  const sections = [
    { id: 'medicaments', label: t.medicaments, icon: Pill },
    { id: 'prescriptions', label: t.prescriptionTab, icon: FileText },
    { id: 'documents', label: t.medicalDocuments, icon: Files },
    { id: 'bilans', label: t.bilan, icon: Beaker },
    { id: 'certificats', label: t.medicalCertificates, icon: Award },
  ];

  const renderMedicamentForm = ({ item, onClose, onSave, lang }) => {
    const t = translations[lang] || translations.fr;
    const [formData, setFormData] = useState(item || { designation: '', format: '', conditionnement: '', dci: '' });
    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
    return (
        <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input name="designation" value={formData.designation} onChange={handleChange} placeholder={t.designation} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm" />
                <input name="format" value={formData.format} onChange={handleChange} placeholder={t.format} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm" />
                <input name="conditionnement" value={formData.conditionnement} onChange={handleChange} placeholder={t.conditionnement} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm" />
                <input name="dci" value={formData.dci} onChange={handleChange} placeholder={t.dci} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-3 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600">{t.cancelBtn}</button>
                <button onClick={() => onSave(formData)} className="px-3 py-1 text-xs rounded-md bg-teal-600 hover:bg-teal-500">{t.saveBtn}</button>
            </div>
        </div>
    )
  };

  const renderPrescriptionPForm = ({ item, onClose, onSave, lang }) => {
    const t = translations[lang] || translations.fr;
    const [formData, setFormData] = useState(item || { prescription: '' });
    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
    return (
        <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 gap-3">
                <input name="prescription" value={formData.prescription} onChange={handleChange} placeholder={t.prescriptionTab} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-3 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600">{t.cancelBtn}</button>
                <button onClick={() => onSave(formData)} className="px-3 py-1 text-xs rounded-md bg-teal-600 hover:bg-teal-500">{t.saveBtn}</button>
            </div>
        </div>
    )
  };
  
    const renderDocumentForm = ({ item, onClose, onSave, lang }) => {
        const t = translations[lang] || translations.fr;
        const [formData, setFormData] = useState(item || { libelle: '', content: '' });
        const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
        return (
            <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
                <input name="libelle" value={formData.libelle} onChange={handleChange} placeholder={t.libelle} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm" />
                <textarea name="content" value={formData.content} onChange={handleChange} placeholder={t.content} className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm"></textarea>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600">{t.cancelBtn}</button>
                    <button onClick={() => onSave(formData)} className="px-3 py-1 text-xs rounded-md bg-teal-600 hover:bg-teal-500">{t.saveBtn}</button>
                </div>
            </div>
        )
    };

    const renderBilanForm = ({ item, onClose, onSave, lang }) => {
        const t = translations[lang] || translations.fr;
        const [formData, setFormData] = useState(item || { libelle: '' });
        const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
        return (
            <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
                <input name="libelle" value={formData.libelle} onChange={handleChange} placeholder={t.libelle} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600">{t.cancelBtn}</button>
                    <button onClick={() => onSave(formData)} className="px-3 py-1 text-xs rounded-md bg-teal-600 hover:bg-teal-500">{t.saveBtn}</button>
                </div>
            </div>
        )
    };

    const renderCertificatForm = ({ item, onClose, onSave, lang }) => {
        const t = translations[lang] || translations.fr;
        const [formData, setFormData] = useState(item || { libelle: '', content: '', type: 'aptitude' });
        const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
        return (
            <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
                <input name="libelle" value={formData.libelle} onChange={handleChange} placeholder={t.libelle} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm" />
                <textarea name="content" value={formData.content} onChange={handleChange} placeholder={t.content} className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm"></textarea>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm">
                    <option value="aptitude">{t.certTypeAptitude}</option>
                    <option value="vierge">{t.certTypeVierge}</option>
                    <option value="prolongation">{t.certTypeProlongation}</option>
                </select>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600">{t.cancelBtn}</button>
                    <button onClick={() => onSave(formData)} className="px-3 py-1 text-xs rounded-md bg-teal-600 hover:bg-teal-500">{t.saveBtn}</button>
                </div>
            </div>
        )
    };


  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <ProgressOverlay isOpen={uploadState.isUploading} {...uploadState} />
      
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            {t.dataTemplatesTitle}
          </h2>
          <div className="p-2 mt-4 rounded-2xl flex flex-wrap gap-2 justify-start">
              {sections.map(section => (
                  <SectionButton key={section.id} {...section} activeSection={activeSection} onClick={setActiveSection} />
              ))}
          </div>
        </div>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleBulkAddMedicaments} 
      />

      {activeSection === 'medicaments' && <CrudView 
        title={t.medicaments}
        data={medicaments}
        columns={[
            {key: 'designation', label: t.medicament},
            {key: 'forme', label: t.forme},
            {key: 'dosage', label: t.dosage},
            {key: 'etat', label: t.etat}
        ]}
        onAdd={handleAddMedicament}
        onBulkAdd={() => fileInputRef.current?.click()}
        onEdit={handleEditMedicament}
        onDelete={handleDeleteMedicament}
        onActivate={handleActivateMedicament}
        onDeactivate={handleDeactivateMedicament}
        renderForm={renderMedicamentForm}
        lang={lang}
        hideEditBtn={true}
      />}

      {activeSection === 'prescriptions' && <CrudView 
        title={t.prescriptionTab}
        data={prescriptionsP}
        columns={[
            {key: 'prescription', label: t.prescriptionTab},
            {key: 'etat', label: t.etat}
        ]}
        onAdd={handleAddPrescriptionP}
        onEdit={handleEditPrescriptionP}
        onDelete={handleDeletePrescriptionP}
        onActivate={handleActivatePrescriptionP}
        onDeactivate={handleDeactivatePrescriptionP}
        renderForm={renderPrescriptionPForm}
        lang={lang}
        hideEditBtn={true}
      />}

    {activeSection === 'documents' && <CrudView 
        title={t.medicalDocuments}
        data={documents}
        columns={[{key: 'libelle', label: t.libelle}]}
        onAdd={(item) => setDocuments([...documents, {...item, id: Date.now()}])}
        onEdit={(edited) => setDocuments(documents.map(d => d.id === edited.id ? edited : d))}
        onDelete={(id) => setDocuments(documents.filter(d => d.id !== id))}
        renderForm={renderDocumentForm}
        lang={lang}
    />}

    {activeSection === 'bilans' && <CrudView 
        title={t.bilan}
        data={bilans}
        columns={[{key: 'libelle', label: t.libelle}]}
        onAdd={(item) => setBilans([...bilans, {...item, id: Date.now()}])}
        onEdit={(edited) => setBilans(bilans.map(b => b.id === edited.id ? edited : b))}
        onDelete={(id) => setBilans(bilans.filter(b => b.id !== id))}
        renderForm={renderBilanForm}
        lang={lang}
    />}

    {activeSection === 'certificats' && <CrudView 
        title={t.medicalCertificates}
        data={certificats}
        columns={[{key: 'libelle', label: t.libelle}, {key: 'type', label: t.type}]}
        onAdd={(item) => setCertificats([...certificats, {...item, id: Date.now()}])}
        onEdit={(edited) => setCertificats(certificats.map(c => c.id === edited.id ? edited : c))}
        onDelete={(id) => setCertificats(certificats.filter(c => c.id !== id))}
        renderForm={renderCertificatForm}
        lang={lang}
    />}

      <ConfirmDialog 
          {...confirmConfig} 
          onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} 
          lang={lang} 
      />
      
      <TimedAlert message={successMsg} type="success" onClose={() => setSuccessMsg('')} />
      <TimedAlert message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
    </div>
  );
}

