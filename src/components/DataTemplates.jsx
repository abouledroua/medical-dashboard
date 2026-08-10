import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Pill, FileText, Beaker, Award, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { translations } from '../translations';

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

const CrudView = ({ title, data, columns, onAdd, onEdit, onDelete, onActivate, onDeactivate, renderForm, lang = 'fr' }) => {
    const t = translations[lang] || translations.fr;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

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
            <button
            type="button"
            onClick={() => openForm()}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center gap-2 text-xs transition"
            >
                <PlusCircle className="w-4 h-4" />
                {t.addBtn}
            </button>
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

        <div className="overflow-x-auto">
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
              {data.map((item) => (
                <tr key={item.id} className="border-b border-slate-800 text-slate-100">
                  {columns.map(col => <td key={col.key} className="py-2 pr-4">{item[col.key]}</td>)}
                  <td className="py-2 pr-4 flex gap-2">
                    <button onClick={() => openForm(item)} className="p-1.5 text-sky-400 hover:text-sky-300" title={t.editBtn}><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-300" title={t.deleteBtn}><Trash2 className="w-4 h-4" /></button>
                    {item.status === 0 ? (
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
      </div>
    );
}

export default function DataTemplates({ lang = 'fr' }) {
  const t = translations[lang] || translations.fr;
  const [activeSection, setActiveSection] = useState('medicaments');

  const [medicaments, setMedicaments] = useState([]);
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

  useEffect(() => {
    if (activeSection === 'medicaments') {
      fetchMedicaments();
    }
  }, [activeSection, fetchMedicaments]);

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
    try {
      await fetch(`/api/medications/${id}`, {
        method: 'DELETE',
      });
      setMedicaments(medicaments.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete medicament:', error);
    }
  };

  const handleActivateMedicament = async (id) => {
    try {
      await fetch(`/api/medications/${id}/activate`, { method: 'PUT' });
      setMedicaments(medicaments.map(m => m.id === id ? { ...m, status: 1 } : m));
    } catch (error) {
      console.error('Failed to activate medicament:', error);
    }
  };

  const handleDeactivateMedicament = async (id) => {
    try {
      await fetch(`/api/medications/${id}/deactivate`, { method: 'PUT' });
      setMedicaments(medicaments.map(m => m.id === id ? { ...m, status: 0 } : m));
    } catch (error) {
      console.error('Failed to deactivate medicament:', error);
    }
  };

  const sections = [
    { id: 'medicaments', label: t.medicaments, icon: Pill },
    { id: 'documents', label: t.medicalDocuments, icon: null },
    { id: 'bilans', label: t.bilan, icon: Beaker },
    { id: 'certificats', label: t.medicalCertificates, icon: null },
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
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
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
      
      {activeSection === 'medicaments' && <CrudView 
        title={t.medicaments}
        data={medicaments}
        columns={[
            {key: 'designation', label: t.medicament},
            {key: 'format', label: t.forme},
            {key: 'dosage', label: t.dosage},
            {key: 'status', label: t.etat}
        ]}
        onAdd={handleAddMedicament}
        onEdit={handleEditMedicament}
        onDelete={handleDeleteMedicament}
        onActivate={handleActivateMedicament}
        onDeactivate={handleDeactivateMedicament}
        renderForm={renderMedicamentForm}
        lang={lang}
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

    </div>
  );
}

