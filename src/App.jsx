import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import PatientList from './components/PatientList';
import AddPatientForm from './components/AddPatientForm';
import PatientMedicalHistory from './components/PatientMedicalHistory';
import AppointmentsList from './components/AppointmentsList';
import ClinicSettings from './components/ClinicSettings';
import NewAppointmentModal from './components/NewAppointmentModal';
import AddConsultationModal from './components/AddConsultationModal';

export default function App() {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('el_iyada_lang') || 'fr';
    } catch (e) {
      return 'fr';
    }
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('el_iyada_lang', newLang);
    } catch (e) {
      // ignore
    }
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('el_iyada_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const getInitialTab = () => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && ['overview', 'patients', 'add-patient', 'medical-history', 'appointments', 'settings'].includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('el_iyada_active_tab');
      if (saved && ['overview', 'patients', 'add-patient', 'medical-history', 'appointments', 'settings'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'overview';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('el_iyada_active_tab', tab);
      if (window.location.hash !== `#${tab}`) {
        window.history.pushState(null, '', `#${tab}`);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && ['overview', 'patients', 'add-patient', 'medical-history', 'appointments', 'settings'].includes(hash)) {
        setActiveTabState(hash);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [clinicInfo, setClinicInfo] = useState(null);
  const [selectedPatient, setSelectedPatientState] = useState(null);

  const setSelectedPatient = (patient) => {
    setSelectedPatientState(patient);
    if (patient && patient.id) {
      try {
        localStorage.setItem('el_iyada_selected_patient_id', patient.id);
      } catch (e) {}
    }
  };

  const [editingPatient, setEditingPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [appointmentDefaultPatient, setAppointmentDefaultPatient] = useState(null);

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setActiveTab('add-patient');
  };

  const handlePatientUpdated = (updatedPatient) => {
    setPatients(prev => prev.map(p => (p.id === updatedPatient.id ? updatedPatient : p)));
    if (selectedPatient && selectedPatient.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient);
    }
    setEditingPatient(null);
    setActiveTab('medical-history');
  };


  // Fetch initial data from Node REST API
  const fetchAllData = async () => {
    try {
      const [patientsRes, statsRes, aptsRes, clinicRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/stats'),
        fetch('/api/appointments'),
        fetch('/api/clinic')
      ]);

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);

        const savedPatId = localStorage.getItem('el_iyada_selected_patient_id');
        const matched = savedPatId ? patientsData.find(p => p.id === savedPatId || p.codeBarre === savedPatId || p.mrn === savedPatId) : null;
        if (matched) {
          setSelectedPatientState(matched);
        } else if (patientsData.length > 0) {
          setSelectedPatientState(patientsData[0]);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (aptsRes.ok) {
        const aptsData = await aptsRes.json();
        setAppointments(aptsData);
      }

      if (clinicRes.ok) {
        const clinicData = await clinicRes.json();
        setClinicInfo(clinicData);
      }
    } catch (err) {
      console.error('Failed to connect to backend REST API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Live debounced search querying table dynamically
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const url = searchQuery.trim()
          ? `/api/patients?search=${encodeURIComponent(searchQuery.trim())}&limit=200`
          : '/api/patients?limit=500';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch (err) {
        console.error('Failed to search patients from DB:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Selection handlers
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('medical-history');
  };

  const handlePatientAdded = (newPatient) => {
    setPatients(prev => [newPatient, ...prev]);
    setSelectedPatient(newPatient);
    setEditingPatient(null);
    fetchAllData();
    setActiveTab('medical-history');
  };

  const handleAppointmentCreated = (newApt) => {
    setAppointments(prev => [newApt, ...prev]);
    fetchAllData();
  };

  const handleUpdateAppointmentStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  const handleConsultationAdded = (newConsultation) => {
    // Refresh selected patient history
    if (selectedPatient) {
      setSelectedPatient(prev => ({
        ...prev,
        consultations: [newConsultation, ...(prev.consultations || [])]
      }));
    }
    fetchAllData();
  };

  const openAppointmentForPatient = (patient = null) => {
    setAppointmentDefaultPatient(patient || selectedPatient || patients[0]);
    setIsAppointmentModalOpen(true);
  };

  const openConsultationForPatient = (patient = null) => {
    if (patient) {
      setSelectedPatient(patient);
    }
    setIsConsultationModalOpen(true);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('el_iyada_user', JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('el_iyada_user');
    } catch (e) {}
  };

  // If user is not authenticated, show Login Screen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} lang={lang} setLang={setLang} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Animated Progress Bar */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-900 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 animate-pulse w-full"></div>
        </div>
      )}

      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectTab={setActiveTab}
        activeTab={activeTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        lang={lang}
        setLang={setLang}
        clinicInfo={clinicInfo}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedPatient={selectedPatient}
          lang={lang}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="space-y-6">
              {/* Progress Bar Header */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
                    <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                    {lang === 'fr' ? 'Chargement des données en cours...' : 'Loading database records...'}
                  </div>
                  <span className="text-xs font-mono text-slate-400">MySQL docteur4</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full w-2/3 animate-pulse"></div>
                </div>
              </div>

              {/* Skeleton Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-800"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-800/60 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-slate-900 rounded-xl"></div>
                    <div className="h-12 bg-slate-900/50 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <DashboardOverview
                  stats={stats}
                  patients={patients}
                  appointments={appointments}
                  clinicInfo={clinicInfo}
                  onSelectPatient={handleSelectPatient}
                  onOpenNewAppointment={() => openAppointmentForPatient()}
                  onSelectTab={setActiveTab}
                  onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  lang={lang}
                />
              )}

              {activeTab === 'patients' && (
                <PatientList
                  patients={patients}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSelectPatient={handleSelectPatient}
                  onOpenNewAppointment={openAppointmentForPatient}
                  onOpenNewConsultation={openConsultationForPatient}
                  onEditPatient={handleEditPatient}
                  onSelectTab={setActiveTab}
                  lang={lang}
                />
              )}

              {activeTab === 'add-patient' && (
                <AddPatientForm
                  patientToEdit={editingPatient}
                  onAddPatient={handlePatientAdded}
                  onUpdatePatient={handlePatientUpdated}
                  onCancel={() => {
                    setEditingPatient(null);
                    setActiveTab('patients');
                  }}
                  lang={lang}
                />
              )}

              {activeTab === 'medical-history' && (
                <PatientMedicalHistory
                  selectedPatient={selectedPatient}
                  onSelectPatient={setSelectedPatient}
                  allPatients={patients}
                  onOpenNewConsultation={() => openConsultationForPatient()}
                  onOpenNewAppointment={() => openAppointmentForPatient()}
                  onEditPatient={handleEditPatient}
                  lang={lang}
                  onSelectTab={setActiveTab}
                />
              )}

              {activeTab === 'appointments' && (
                <AppointmentsList
                  appointments={appointments}
                  patients={patients}
                  onOpenNewAppointment={openAppointmentForPatient}
                  onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  onSelectPatient={handleSelectPatient}
                  lang={lang}
                />
              )}

              {activeTab === 'settings' && (
                <ClinicSettings
                  clinicInfo={clinicInfo}
                  onUpdateClinicInfo={setClinicInfo}
                  lang={lang}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <NewAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        patients={patients}
        defaultPatient={appointmentDefaultPatient}
        onAppointmentCreated={handleAppointmentCreated}
        lang={lang}
      />

      <AddConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        patient={selectedPatient}
        onConsultationAdded={handleConsultationAdded}
        lang={lang}
      />
    </div>
  );
}
