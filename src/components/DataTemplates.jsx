import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sliders, Pill, FileText, Files, Beaker, Award, PlusCircle, Edit, Trash2, Upload, CheckCircle2, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { translations } from '../translations';
import ConfirmDialog from './ConfirmDialog';
import { useConfirm } from '../context/ConfirmDialogContext';
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

const CrudView = ({ title, data, columns, onAdd, onBulkAdd, bulkAddBtnLabel, onEdit, onDelete, onActivate, onDeactivate, renderForm, lang = 'fr', hideEditBtn = false, hideAddBtn = false, fullScreenModal = false, modalWidth = 'max-w-lg' }) => {
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
        {isFormOpen && fullScreenModal ? (
            <div className="flex flex-col w-full h-[calc(100vh-200px)] animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-white mb-4">
                    {editingItem ? t.editBtn : t.addBtn} - {title}
                </h3>
                {(() => {
                    const FormComponent = renderForm;
                    return <FormComponent
                        item={editingItem}
                        onClose={closeForm}
                        onSave={(itemData) => {
                            if (editingItem) onEdit(itemData);
                            else onAdd(itemData);
                            closeForm();
                        }}
                        lang={lang}
                    />;
                })()}
            </div>
        ) : (
            <>
                <div className="flex justify-between items-center animate-in fade-in duration-200">
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
                        {!hideAddBtn && (
                            <button
                            type="button"
                            onClick={() => openForm()}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center gap-2 text-xs transition"
                            >
                                <PlusCircle className="w-4 h-4" />
                                {t.addBtn}
                            </button>
                        )}
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

                {isFormOpen && !fullScreenModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className={`bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full ${modalWidth} mx-4`}>
                            <h3 className="text-lg font-bold text-white mb-4">
                                {editingItem ? t.editBtn : t.addBtn} - {title}
                            </h3>
                            {(() => {
                                const FormComponent = renderForm;
                                return <FormComponent
                                    item={editingItem}
                                    onClose={closeForm}
                                    onSave={(itemData) => {
                                        if (editingItem) onEdit(itemData);
                                        else onAdd(itemData);
                                        closeForm();
                                    }}
                                    lang={lang}
                                />;
                            })()}
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto overflow-y-auto max-h-[600px] animate-in fade-in duration-200">
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
                                      : col.render ? col.render(item) : item[col.key]}
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
                    <div className="flex justify-between items-center mt-4 animate-in fade-in duration-200">
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
            </>
        )}
      </div>
    );
}

const MedicamentForm = ({ item, onClose, onSave, lang }) => {
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


const PrescriptionPForm = ({ item, onClose, onSave, lang }) => {
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

const DocumentForm = ({ item, onClose, onSave, lang }) => {
    const t = translations[lang] || translations.fr;
    const [formData, setFormData] = useState(item || { libelle: '', prix: '', content: '', hasAttachedDocument: false, tags: [] });
    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
    const [fileUploaded, setFileUploaded] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const confirm = useConfirm();

    useEffect(() => {
        if (item && item.content && formData.hasAttachedDocument === false) {
             setFormData(prev => ({...prev, hasAttachedDocument: true}));
        }
    }, [item]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
    };

    const handleSave = async () => {
        if (!formData.libelle || formData.libelle.trim() === '') {
            confirm({ title: 'Information', message: t.designationRequired || "Designation is required", variant: 'warning', cancelText: null, confirmText: 'OK' });
            return;
        }
        
        if (selectedFile) {
            try {
                const formDataPayload = new FormData();
                formDataPayload.append('file', selectedFile);
                formDataPayload.append('designation', formData.libelle);

                const response = await fetch('/api/motif/upload-draft', {
                    method: 'POST',
                    body: formDataPayload
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || "Failed to upload file");
                }
            } catch (error) {
                console.error("Upload error:", error);
                confirm({ title: 'Erreur', message: "Error uploading file: " + error.message, variant: 'danger', cancelText: null, confirmText: 'OK' });
                return;
            }
        }
        
        let finalData = { ...formData };
        if (finalData.hasAttachedDocument && !((item && item.hasAttachedDocument) || fileUploaded)) {
            finalData.hasAttachedDocument = false;
        }
        
        onSave(finalData);
    };

    const handleCancel = () => {
        onClose();
    };

    const handleSelectModel = () => {
        if (!formData.libelle || formData.libelle.trim() === '') {
            confirm({ title: 'Information', message: t.designationRequired || "Please enter a designation first before selecting a model.", variant: 'warning', cancelText: null, confirmText: 'OK' });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setSelectedFile(file);
        setFileUploaded(true);
        e.target.value = null;
    };

    const handleOpenModel = async () => {
        if (!formData.libelle || formData.libelle.trim() === '') {
            confirm({ title: 'Information', message: t.designationRequired || "Designation is missing", variant: 'warning', cancelText: null, confirmText: 'OK' });
            return;
        }

        try {
            window.open(`/api/motif/download/${encodeURIComponent(formData.libelle)}`, '_blank');
        } catch (error) {
            console.error("Download error:", error);
            confirm({ title: 'Erreur', message: "Error downloading file.", variant: 'danger', cancelText: null, confirmText: 'OK' });
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <input 
                name="libelle" 
                value={formData.libelle} 
                onChange={handleChange} 
                placeholder={t.libelle} 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white" 
            />
            <input 
                name="prix"
                type="number"
                value={formData.prix} 
                onChange={handleChange} 
                onFocus={(e) => e.target.select()}
                placeholder={t.prix} 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white" 
            />
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="hasAttachedDocument" 
                        name="hasAttachedDocument" 
                        checked={formData.hasAttachedDocument} 
                        onChange={handleChange}
                        className="w-4 h-4 text-teal-600 bg-slate-900 border-slate-700 rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <label htmlFor="hasAttachedDocument" className="text-sm font-medium text-slate-200">
                        {t.wordDocument}
                    </label>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCancel} className="px-4 py-1.5 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition">{t.cancelBtn}</button>
                    <button onClick={handleSave} className="px-4 py-1.5 text-sm rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition">{t.saveBtn}</button>
                </div>
            </div>

            {formData.hasAttachedDocument && (
                <div className="flex gap-2 p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                    <input type="file" ref={fileInputRef} accept=".docx,.doc,.rtf" className="hidden" onChange={handleFileChange} />
                    <button onClick={handleSelectModel} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition">
                        <FileText className="w-4 h-4" /> {t.selectModelBtn}
                    </button>
                    {((item && item.hasAttachedDocument) && !selectedFile) && (
                        <button onClick={handleOpenModel} className="flex items-center gap-2 px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 text-sm rounded-lg transition border border-sky-500/30">
                            <Edit className="w-4 h-4" /> {t.openModelBtn}
                        </button>
                    )}
                </div>
            )}
            
            {formData.hasAttachedDocument && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-xs text-slate-300">
                    <p className="font-semibold text-slate-200 mb-2">
                        {lang === 'fr' ? 'Tags supportés dans le document Word :' : 'Supported tags in the Word document:'}
                    </p>
                    <p className="mb-3 text-slate-400">
                        {lang === 'fr'
                            ? "Veuillez inclure ces tags dans votre document Word si vous souhaitez que l'application injecte automatiquement les informations du patient."
                            : "Please include these tags in your Word document if you want the app to automatically inject patient information."}
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4">
                        <li><strong className="text-teal-400">[%NOM%]</strong> : {lang === 'fr' ? 'Nom du patient' : 'Patient last name'}</li>
                        <li><strong className="text-teal-400">[%PRENOM%]</strong> : {lang === 'fr' ? 'Prénom du patient' : 'Patient first name'}</li>
                        <li><strong className="text-teal-400">[%FULLNAME%]</strong> : {lang === 'fr' ? 'Nom complet' : 'Patient full name'}</li>
                        <li><strong className="text-teal-400">[%AGE%]</strong> : {lang === 'fr' ? 'Age du patient' : 'Patient age'}</li>
                        <li><strong className="text-teal-400">[%ANTCD%]</strong> : {lang === 'fr' ? 'Antécédents' : 'Patient antecedents'}</li>
                        <li><strong className="text-teal-400">[%GS%]</strong> : {lang === 'fr' ? 'Groupe sanguin' : 'Blood group'}</li>
                        <li><strong className="text-teal-400">[%DN%]</strong> : {lang === 'fr' ? 'Date de naissance' : 'Date of birth'}</li>
                        <li><strong className="text-teal-400">[%DC%]</strong> : {lang === 'fr' ? 'Date de consultation' : 'Consultation date'}</li>
                        <li><strong className="text-teal-400">[%VILLE%]</strong> : {lang === 'fr' ? 'Ville' : 'City'}</li>
                    </ul>
                </div>
            )}
        </div>
    )
};

const BilanForm = ({ item, onClose, onSave, lang }) => {
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

const CertificatForm = ({ item, onClose, onSave, lang }) => {
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

export default function DataTemplates({ lang = 'fr' }) {
  const t = translations[lang] || translations.fr;
  const [activeSection, setActiveSection] = useState('medicaments');
  const confirm = useConfirm();
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
  
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/motif');
      if (!response.ok) {
        setDocuments([]);
        return;
      }
      const data = await response.json();
      // Map database fields to frontend fields
      const mapped = data.map(m => ({
          id: m.ID_MOTIF,
          libelle: m.DESIGNATION,
          prix: m.PRIX,
          hasAttachedDocument: m.INT_WORD === 1,
          content: m.content || '',
          etat: m.ETAT
      }));
      setDocuments(mapped);
    } catch (error) {
      setDocuments([]);
    }
  }, []);

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

  const fetchBilans = useCallback(async () => {
    try {
      const response = await fetch('/api/bilan');
      if (!response.ok) {
        setBilans([]);
        return;
      }
      const data = await response.json();
      const mapped = data.map(b => ({
          id: b.ID_BILAN,
          libelle: b.DESIGNATION,
          etat: b.ETAT
      }));
      setBilans(mapped);
    } catch (error) {
      setBilans([]);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'medicaments') {
      fetchMedicaments();
    } else if (activeSection === 'prescriptions') {
      fetchPrescriptionsP();
    } else if (activeSection === 'documents') {
      fetchDocuments();
    } else if (activeSection === 'bilans') {
      fetchBilans();
    }
  }, [activeSection, fetchMedicaments, fetchPrescriptionsP, fetchDocuments, fetchBilans]);

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

  const handleAddDocument = async (item) => {
    try {
      const payload = {
          designation: item.libelle,
          prix: item.prix,
          hasAttachedDocument: item.hasAttachedDocument,
          content: item.content
      };
      await fetch('/api/motif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchDocuments();
      setSuccessMsg(t.documentSaved);
    } catch (error) {
      console.error('Failed to add document:', error);
    }
  };

  const handleEditDocument = async (item) => {
    try {
      const payload = {
          designation: item.libelle,
          prix: item.prix,
          hasAttachedDocument: item.hasAttachedDocument,
          content: item.content
      };
      await fetch(`/api/motif/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchDocuments();
      setSuccessMsg(t.documentUpdated);
    } catch (error) {
      console.error('Failed to edit document:', error);
    }
  };

  const handleDeleteDocument = async (id) => {
    const confirmed = await confirm({
      title: t.confirmDeletion,
      message: t.sureDeleteMed,
      variant: 'danger'
    });
    if (confirmed) {
        try {
          await fetch(`/api/motif/${id}`, { method: 'DELETE' });
          fetchDocuments();
          setSuccessMsg(t.documentDeleted);
        } catch (error) {
          console.error("Delete Error:", error);
          setErrorMsg(t.errorDeletingMed);
        }
    }
  };

  const handleToggleDocument = async (id) => {
    const document = documents.find(d => d.id === id);
    const actionText = document && document.etat === 1 ? 'désactiver' : 'activer';
    const confirmed = await confirm({
      title: 'Confirmation',
      message: `Voulez-vous vraiment ${actionText} ce document ?`,
      variant: 'warning'
    });
    
    if (confirmed) {
      try {
        await fetch(`/api/motif/${id}/toggle`, { method: 'PATCH' });
        fetchDocuments();
      } catch (error) {
        console.error('Failed to toggle document:', error);
      }
    }
  };

  const handleAddBilan = async (item) => {
    try {
      await fetch('/api/bilan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designation: item.libelle }),
      });
      fetchBilans();
      setSuccessMsg(t.savedSuccessfully || 'Saved successfully');
    } catch (error) {
      console.error('Failed to add bilan:', error);
    }
  };

  const handleEditBilan = async (item) => {
    try {
      await fetch(`/api/bilan/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designation: item.libelle }),
      });
      fetchBilans();
      setSuccessMsg(t.updatedSuccessfully || 'Updated successfully');
    } catch (error) {
      console.error('Failed to edit bilan:', error);
    }
  };

  const handleDeleteBilan = async (id) => {
    const confirmed = await confirm({
      title: t.confirmDeletion,
      message: 'Voulez-vous vraiment supprimer ce bilan ?',
      variant: 'danger'
    });
    if (confirmed) {
        try {
          const res = await fetch(`/api/bilan/${id}`, { method: 'DELETE' });
          if (!res.ok) {
            const data = await res.json();
            if (data.code === 'CONSTRAINT_VIOLATION') {
               setErrorMsg(data.error);
               return;
            }
            throw new Error('Delete failed');
          }
          fetchBilans();
          setSuccessMsg(t.deletedSuccessfully || 'Deleted successfully');
        } catch (error) {
          console.error("Delete Error:", error);
          setErrorMsg(t.errorDeletingMed || 'Error deleting');
        }
    }
  };

  const handleToggleBilan = async (id) => {
    const bilan = bilans.find(b => b.id === id);
    const actionText = bilan && bilan.etat === 1 ? 'désactiver' : 'activer';
    const confirmed = await confirm({
      title: 'Confirmation',
      message: `Voulez-vous vraiment ${actionText} ce bilan ?`,
      variant: 'warning'
    });
    
    if (confirmed) {
      try {
        await fetch(`/api/bilan/${id}/toggle`, { method: 'PATCH' });
        fetchBilans();
      } catch (error) {
        console.error('Failed to toggle bilan:', error);
      }
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
            confirm({
              title: t.warning,
              message: t.noValidMedsExcel,
              variant: 'warning'
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

  const handleDeleteMedicament = async (id) => {
    const confirmed = await confirm({
      title: t.confirmDeletion,
      message: t.sureDeleteMed,
      variant: 'danger'
    });
    if (confirmed) {
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
  };

  const handleActivateMedicament = async (id) => {
    const confirmed = await confirm({
      title: t.confirmActivation,
      message: t.sureActivateMed,
      variant: 'danger'
    });
    if (confirmed) {
        try {
          await fetch(`/api/medications/${id}/activate`, { method: 'PUT' });
          setMedicaments(prev => prev.map(m => m.id === id ? { ...m, etat: 1 } : m));
        } catch (error) {
          console.error('Failed to activate medicament:', error);
        }
    }
  };

  const handleDeactivateMedicament = async (id) => {
    const confirmed = await confirm({
      title: t.confirmDeactivation,
      message: t.sureDeactivateMed,
      variant: 'danger'
    });
    if (confirmed) {
        try {
          await fetch(`/api/medications/${id}/deactivate`, { method: 'PUT' });
          setMedicaments(prev => prev.map(m => m.id === id ? { ...m, etat: 0 } : m));
        } catch (error) {
          console.error('Failed to deactivate medicament:', error);
        }
    }
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

  const handleDeletePrescriptionP = async (id) => {
    const confirmed = await confirm({
      title: t.confirmDeletion,
      message: t.sureDeletePrescription,
      variant: 'danger'
    });
    if (confirmed) {
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
  };

  const handleActivatePrescriptionP = async (id) => {
    const confirmed = await confirm({
      title: t.confirmActivation,
      message: t.sureActivatePrescription,
      variant: 'danger'
    });
    if (confirmed) {
        try {
          await fetch(`/api/medications/p/${id}/activate`, { method: 'PUT' });
          setPrescriptionsP(prev => prev.map(m => m.id === id ? { ...m, etat: 1 } : m));
        } catch (error) {}
    }
  };

  const handleDeactivatePrescriptionP = async (id) => {
    const confirmed = await confirm({
      title: t.confirmDeactivation,
      message: t.sureDeactivatePrescription,
      variant: 'danger'
    });
    if (confirmed) {
        try {
          await fetch(`/api/medications/p/${id}/deactivate`, { method: 'PUT' });
          setPrescriptionsP(prev => prev.map(m => m.id === id ? { ...m, etat: 0 } : m));
        } catch (error) {}
    }
  };

  const sections = [
    { id: 'medicaments', label: t.medicaments, icon: Pill },
    { id: 'prescriptions', label: t.prescriptionTab, icon: FileText },
    { id: 'documents', label: t.medicalDocuments, icon: Files },
    { id: 'bilans', label: t.bilan, icon: Beaker },
    { id: 'certificats', label: t.medicalCertificates, icon: Award },
  ];




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
          renderForm={MedicamentForm}
        lang={lang}
        hideEditBtn={true}
        hideAddBtn={true}
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
          renderForm={PrescriptionPForm}
        lang={lang}
        hideEditBtn={true}
        hideAddBtn={true}
      />}

    {activeSection === 'documents' && <CrudView 
          title={t.medicalDocuments}
          data={documents}
          columns={[
              {key: 'libelle', label: t.libelle},
              {
                  key: 'prix', 
                  label: t.prix,
                  render: (item) => item.prix === 0 || !item.prix ? '' : item.prix
              },
              {
                  key: 'hasAttachedDocument', 
                  label: t.fichier, 
                  render: (item) => item.hasAttachedDocument ? <FileText className="w-5 h-5 text-teal-400" /> : null
              },
              {key: 'etat', label: t.etat || 'État'}
          ]}
          onAdd={handleAddDocument}
          onEdit={handleEditDocument}
          onDelete={handleDeleteDocument}
          onActivate={handleToggleDocument}
          onDeactivate={handleToggleDocument}
            renderForm={DocumentForm}
          fullScreenModal={false}
          modalWidth="max-w-3xl"
          lang={lang}
      />}

    {activeSection === 'bilans' && <CrudView 
        title={t.bilan}
        data={bilans}
        columns={[{key: 'libelle', label: t.libelle}, {key: 'etat', label: t.etat || 'État'}]}
        onAdd={handleAddBilan}
        onEdit={handleEditBilan}
        onDelete={handleDeleteBilan}
        onActivate={handleToggleBilan}
        onDeactivate={handleToggleBilan}
        renderForm={BilanForm}
        lang={lang}
    />}

    {activeSection === 'certificats' && <CrudView 
        title={t.medicalCertificates}
        data={certificats}
        columns={[{key: 'libelle', label: t.libelle}, {key: 'type', label: t.type}]}
        onAdd={(item) => setCertificats([...certificats, {...item, id: Date.now()}])}
        onEdit={(edited) => setCertificats(certificats.map(c => c.id === edited.id ? edited : c))}
        onDelete={async (id) => {
            const confirmed = await confirm({ title: t.confirmDeletion, message: 'Voulez-vous vraiment supprimer ?', variant: 'danger' });
            if (confirmed) setCertificats(certificats.filter(c => c.id !== id));
        }}
          renderForm={CertificatForm}
        lang={lang}
    />}


      
      <TimedAlert message={successMsg} type="success" onClose={() => setSuccessMsg('')} />
      <TimedAlert message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
    </div>
  );
}

