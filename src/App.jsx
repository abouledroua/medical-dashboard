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
import DeviceNameModal from './components/DeviceNameModal';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext';

function getOrCreateDeviceId() {
  try {
    let devId = localStorage.getItem('el_iyada_device_id');
    // If devId is missing, contains 'DEV-', or length is not between 8 and 10 chars, re-generate clean 8-char ID
    if (!devId || devId.startsWith('DEV-') || devId.length < 8 || devId.length > 10) {
      devId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()
        : Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('el_iyada_device_id', devId);
    }
    return devId;
  } catch (e) {
    return 'A1B2C3D4';
  }
}

export default function App() {
  const [deviceId] = useState(getOrCreateDeviceId);
  const [deviceName, setDeviceName] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  const checkDevicePoste = async (devId, triggerModalOnMissing = false) => {
    if (!devId) return;
    try {
      const res = await fetch(`/api/poste/${devId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setDeviceName(data.nomDevice || '');
        } else {
          setDeviceName(null);
          if (triggerModalOnMissing) {
            setShowDeviceModal(true);
          }
        }
      }
    } catch (e) {
      console.error('Failed to check device in poste table:', e);
    }
  };

  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('el_iyada_lang') || 'fr';
    } catch (e) {
      return 'fr';
    }
  });

  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('el_iyada_theme');
      if (savedTheme) {
        if (savedTheme === 'dark') return 'dark-emerald';
        if (savedTheme === 'light') return 'light-medical';
        return savedTheme;
      }
      return 'dark-emerald';
    } catch (e) {
      return 'dark-emerald';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.dataset.theme = theme;
    } catch (e) {}
  }, [theme]);

  const setLang = (newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('el_iyada_lang', newLang);
    } catch (e) {
      // ignore
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('el_iyada_theme', newTheme);
      document.documentElement.dataset.theme = newTheme;
    } catch (e) {}
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
      if (hash && ['overview', 'patients', 'add-patient', 'add-consultation', 'medical-history', 'appointments', 'settings'].includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('el_iyada_active_tab');
      if (saved && ['overview', 'patients', 'add-patient', 'add-consultation', 'medical-history', 'appointments', 'settings'].includes(saved)) {
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
      if (hash && ['overview', 'patients', 'add-patient', 'add-consultation', 'medical-history', 'appointments', 'settings'].includes(hash)) {
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

  useEffect(() => {
    try {
      if (!localStorage.getItem('el_iyada_theme')) {
        localStorage.setItem('el_iyada_theme', 'dark');
      }
      document.documentElement.dataset.theme = theme;
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    if (deviceId && currentUser) {
      checkDevicePoste(deviceId, true);
    }
  }, [deviceId, currentUser]);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [clinicInfo, setClinicInfo] = useState(null);
  const [selectedPatient, setSelectedPatientState] = useState(null);

  const setSelectedPatient = (patient) => {
    setSelectedPatientState(patient);
    if (patient) {
      const patId = patient.id || patient.codeBarre || patient.mrn;
      if (patId) {
        try {
          localStorage.setItem('el_iyada_selected_patient_id', String(patId));
        } catch (e) {}
      }
    }
  };

  const [editingPatient, setEditingPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [appointmentDefaultPatient, setAppointmentDefaultPatient] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [ongoingConsultations, setOngoingConsultations] = useState(() => {
    try {
      const saved = localStorage.getItem('el_iyada_ongoing_consultations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeConsultationPatientId, setActiveConsultationPatientId] = useState(() => {
    try {
      return localStorage.getItem('el_iyada_active_consultation_patient_id') || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('el_iyada_ongoing_consultations', JSON.stringify(ongoingConsultations));
    } catch (e) {}
  }, [ongoingConsultations]);

  useEffect(() => {
    try {
      if (activeConsultationPatientId) {
        localStorage.setItem('el_iyada_active_consultation_patient_id', activeConsultationPatientId);
      } else {
        localStorage.removeItem('el_iyada_active_consultation_patient_id');
      }
    } catch (e) {}
  }, [activeConsultationPatientId]);

  useEffect(() => {
    if (patients && patients.length > 0 && ongoingConsultations.length > 0) {
      setOngoingConsultations(prev => prev.map(draft => {
        const freshPatient = patients.find(p => String(p.id) === String(draft.patientId) || String(p.codeBarre) === String(draft.patientId));
        return freshPatient ? { ...draft, patient: freshPatient } : draft;
      }));
    }
  }, [patients]);

  const openEditAppointmentModal = (apt) => {
    setEditingAppointment(apt);
    setAppointmentDefaultPatient(null);
    setIsAppointmentModalOpen(true);
  };

  const [previousTab, setPreviousTab] = useState('patients');

  const handleEditPatient = (patient) => {
    setPreviousTab(activeTab);
    setEditingPatient(patient);
    setActiveTab('add-patient');
  };

  const handlePatientUpdated = (updatedPatient) => {
    setPatients(prev => prev.map(p => (p.id === updatedPatient.id ? updatedPatient : p)));
    if (selectedPatient && (selectedPatient.id === updatedPatient.id || selectedPatient.codeBarre === updatedPatient.codeBarre)) {
      setSelectedPatient(updatedPatient);
    }
    setEditingPatient(null);
    setActiveTab(previousTab || 'medical-history');
  };


  const isSyncingRef = React.useRef(false);

  // Silent background sync for Multi-PC multi-user real-time updates (appointments & stats)
  const fetchSilentSync = async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const [statsRes, aptsRes, patientsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/appointments'),
        fetch('/api/patients?limit=60')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (aptsRes.ok) {
        const aptsData = await aptsRes.json();
        setAppointments(aptsData);
      }

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
      }
    } catch (err) {
      // Ignore background sync errors silently
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Fetch initial data from Node REST API
  const fetchAllData = async () => {
    try {
      fetch('/api/clinic')
        .then(res => res.ok && res.json())
        .then(data => data && setClinicInfo(prev => prev || data))
        .catch(() => {});

      const [patientsRes, statsRes, aptsRes, clinicRes] = await Promise.all([
        fetch('/api/patients?limit=60'),
        fetch('/api/stats'),
        fetch('/api/appointments'),
        fetch('/api/clinic')
      ]);

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);

        const savedPatId = localStorage.getItem('el_iyada_selected_patient_id');
        if (savedPatId) {
          const matched = patientsData.find(p => String(p.id) === String(savedPatId) || String(p.codeBarre) === String(savedPatId) || String(p.mrn) === String(savedPatId));
          if (matched) {
            setSelectedPatientState(prev => prev || matched);
          } else {
            fetch(`/api/patients/${encodeURIComponent(savedPatId)}`)
              .then(res => res.json())
              .then(patData => {
                if (patData && !patData.error) {
                  setSelectedPatientState(prev => prev || patData);
                }
              })
              .catch(() => {});
          }
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

  // Automatic Real-Time Multi-PC Sync (10-second silent polling + focus/visibility triggers)
  useEffect(() => {
    // 1. Initial fetch on mount or tab change
    fetchAllData();

    // 2. 10s silent background polling for instant multi-PC appointments sync
    const syncInterval = setInterval(() => {
      fetchSilentSync();
    }, 10000);

    // 3. Instant sync when regaining window focus or switching back to browser tab
    const handleSyncTrigger = () => {
      fetchSilentSync();
    };

    window.addEventListener('focus', handleSyncTrigger);
    document.addEventListener('visibilitychange', handleSyncTrigger);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleSyncTrigger);
      document.removeEventListener('visibilitychange', handleSyncTrigger);
    };
  }, [activeTab]);

  // Live debounced search querying table dynamically
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const url = searchQuery.trim()
          ? `/api/patients?search=${encodeURIComponent(searchQuery.trim())}&limit=100`
          : '/api/patients?limit=60';
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
        const updated = await res.json();
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, time: updated.time || a.time } : a));
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  const handleEditAppointment = async (id, updateData) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updateData } : a));
        fetchAllData();
      }
    } catch (err) {
      console.error('Error updating appointment details:', err);
    }
  };

  const handleUpdateConsultationDraft = (updatedDraft) => {
    if (!updatedDraft || !updatedDraft.patientId) return;
    setOngoingConsultations(prev => {
      const pIdStr = String(updatedDraft.patientId);
      const exists = prev.some(c => String(c.patientId) === pIdStr);
      if (exists) {
        return prev.map(c => (String(c.patientId) === pIdStr ? { ...c, ...updatedDraft } : c));
      } else {
        return [...prev, updatedDraft];
      }
    });
  };

  const handleCancelConsultation = (patientIdToCancel, isCompleted = false) => {
    const pId = patientIdToCancel || activeConsultationPatientId;
    const targetDraft = ongoingConsultations.find(c => String(c.patientId) === String(pId));

    const isValide = Number(targetDraft?.etat) === 1 || Number(targetDraft?.ETAT) === 1;

    // Immediately update local UI state so modal closes and tab changes instantly
    setOngoingConsultations(prev => {
      const remaining = prev.filter(c => String(c.patientId) !== String(pId));
      if (remaining.length > 0) {
        const next = remaining[remaining.length - 1];
        setActiveConsultationPatientId(next.patientId);
        setSelectedPatient(next.patient);
      } else {
        setActiveConsultationPatientId(null);
        setActiveTab(previousTab || 'medical-history');
      }
      return remaining;
    });

    // Fire server cleanup asynchronously in the background
    if (!isCompleted && !isValide && (targetDraft || pId)) {
      fetch('/api/consultations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idConsultation: targetDraft?.idConsultation,
          exercice: targetDraft?.exercice || String(new Date().getFullYear()),
          idVersement: targetDraft?.idVersement,
          patientId: pId
        })
      }).catch(e => {
        console.error('Failed to cancel ongoing consultation on server:', e);
      });
    }
  };

  const handleSelectConsultationDraft = (pId, pObj) => {
    setActiveConsultationPatientId(pId);
    if (pObj) setSelectedPatient(pObj);
    setActiveTab('add-consultation');
  };

  const handleConsultationAdded = (newConsultation, patientIdSaved) => {
    if (selectedPatient) {
      setSelectedPatient(prev => ({
        ...prev,
        consultations: [newConsultation, ...(prev.consultations || [])]
      }));
    }
    fetchAllData();
    handleCancelConsultation(patientIdSaved || activeConsultationPatientId, true);
  };

  const openAppointmentForPatient = (patient = null) => {
    setAppointmentDefaultPatient(patient || null);
    setIsAppointmentModalOpen(true);
  };

  const openConsultationForPatient = async (patient = null) => {
    setPreviousTab(activeTab);
    const targetPatient = patient || selectedPatient || (patients && patients.length > 0 ? patients[0] : null);
    if (targetPatient) {
      const pId = targetPatient.id || targetPatient.codeBarre;
      setSelectedPatient(targetPatient);
      setActiveConsultationPatientId(pId);

      const existingDraft = ongoingConsultations.find(c => String(c.patientId) === String(pId));
      if (!existingDraft) {
        let dbRef = {};
        try {
          const res = await fetch('/api/consultations/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId: pId, deviceId })
          });
          if (res.ok) {
            const data = await res.json();
            dbRef = {
              idConsultation: data.idConsultation,
              idVersement: data.idVersement,
              exercice: data.exercice,
              prixConsultation: data.prixConsultation,
              isExisting: !!data.isExisting
            };
          }
        } catch (e) {
          console.error('Failed to start ongoing consultation on server:', e);
        }

        const newDraft = {
          patientId: pId,
          patient: targetPatient,
          chiefComplaint: '',
          diagnosis: '',
          clinicalNotes: '',
          vitalsAtVisit: `BP: ${targetPatient.vitals?.bloodPressure || '120/80'} | HR: ${targetPatient.vitals?.heartRate || '72 bpm'}`,
          doctor: clinicInfo?.doctorNameFr || '',
          department: targetPatient.department || 'ORL',
          prescriptions: [{ name: '', dosage: '', frequency: 'Once daily', duration: '30 days' }],
          ...dbRef
        };

        setOngoingConsultations(prev => [...prev, newDraft]);
      }
    }
    setActiveTab('add-consultation');
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('el_iyada_user', JSON.stringify(user));
    } catch (e) {}
    checkDevicePoste(deviceId, true);
  };

  const handleSaveDeviceName = async (enteredName) => {
    try {
      const res = await fetch('/api/poste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, nomDevice: enteredName })
      });
      if (res.ok) {
        const data = await res.json();
        setDeviceName(data.nomDevice || '');
      } else {
        setDeviceName(enteredName || '');
      }
    } catch (e) {
      console.error('Failed to save device name:', e);
      setDeviceName(enteredName || '');
    } finally {
      setShowDeviceModal(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedPatientState(null);
    setPatients([]);
    setAppointments([]);
    setStats({});
    setEditingPatient(null);
    setEditingAppointment(null);
    setAppointmentDefaultPatient(null);
    setActiveTabState('overview');
    try {
      localStorage.removeItem('el_iyada_user');
      localStorage.removeItem('el_iyada_selected_patient_id');
      localStorage.removeItem('el_iyada_active_tab');
      window.history.pushState(null, '', window.location.pathname || '/');
    } catch (e) {}
  };

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const headers = new Headers(init.headers || {});
      try {
        if (deviceId) {
          headers.set('x-device-id', deviceId);
        }
        const savedUser = localStorage.getItem('el_iyada_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser?.id) {
            headers.set('x-user-id', String(parsedUser.id));
          }
        }
      } catch (e) {}

      const response = await originalFetch(input, { ...init, headers });
      if (response.status === 401) {
        handleLogout();
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [deviceId]);

  // If user is not authenticated, show Login Screen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} lang={lang} setLang={setLang} />;
  }

  return (
    <ConfirmDialogProvider>
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
          theme={theme}
          setTheme={setTheme}
          clinicInfo={clinicInfo}
          onRefreshData={fetchAllData}
          deviceId={deviceId}
          deviceName={deviceName}
        />

        {/* Main Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedPatient={selectedPatient}
            ongoingConsultations={ongoingConsultations}
            activeConsultationPatientId={activeConsultationPatientId}
            onSelectConsultationDraft={handleSelectConsultationDraft}
            lang={lang}
          />

          {/* Dynamic Main Workspace Content */}
          <main className={`flex-1 p-4 md:p-6 overflow-y-auto w-full ${['add-consultation', 'medical-history'].includes(activeTab) ? 'max-w-none' : 'max-w-7xl mx-auto'}`}>
            {loading ? (
              <div className="space-y-6">
                {/* Progress Bar Header */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
                      <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                      {lang === 'fr' ? 'Chargement des données en cours...' : 'Loading database records...'}
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {clinicInfo?.dbName || stats?.dbName ? `MySQL ${clinicInfo?.dbName || stats?.dbName}` : 'MySQL'}
                    </span>
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
                      setActiveTab(previousTab || 'patients');
                    }}
                    lang={lang}
                  />
                )}

                {activeTab === 'add-consultation' && (() => {
                  const activeDraft = ongoingConsultations.find(c => String(c.patientId) === String(activeConsultationPatientId)) || ongoingConsultations[0];
                  return (
                    <AddConsultationModal
                      key={activeDraft ? activeDraft.patientId : 'default-consultation'}
                      draft={activeDraft}
                      patient={activeDraft?.patient || selectedPatient}
                      patients={patients}
                      clinicInfo={clinicInfo}
                      onSelectPatient={(p) => {
                        setSelectedPatient(p);
                        setActiveConsultationPatientId(p.id || p.codeBarre);
                      }}
                      onUpdateDraft={handleUpdateConsultationDraft}
                      onConsultationAdded={handleConsultationAdded}
                      onCancel={handleCancelConsultation}
                      onEditPatient={handleEditPatient}
                      onOpenNewConsultation={() => openConsultationForPatient()}
                      lang={lang}
                    />
                  );
                })()}

                {activeTab === 'medical-history' && (
                  <PatientMedicalHistory
                    selectedPatient={selectedPatient}
                    onSelectPatient={setSelectedPatient}
                    allPatients={patients}
                    onOpenNewConsultation={() => openConsultationForPatient()}
                    onOpenNewAppointment={() => openAppointmentForPatient()}
                    onEditPatient={handleEditPatient}
                    lang={lang}
                    clinicInfo={clinicInfo}
                    onSelectTab={setActiveTab}
                  />
                )}

                {activeTab === 'appointments' && (
                  <AppointmentsList
                    appointments={appointments}
                    patients={patients}
                    onOpenNewAppointment={openAppointmentForPatient}
                    onOpenEditAppointment={openEditAppointmentModal}
                    onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                    onEditAppointment={handleEditAppointment}
                    onSelectPatient={handleSelectPatient}
                    lang={lang}
                  />
                )}

                {activeTab === 'settings' && (
                  <ClinicSettings
                    clinicInfo={clinicInfo}
                    onUpdateClinicInfo={setClinicInfo}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    lang={lang}
                    currentTheme={theme}
                    onThemeChange={setTheme}
                  />
                )}
              </>
            )}
          </main>
        </div>

        {/* Global Modals */}
        <NewAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setEditingAppointment(null);
          }}
          patients={patients}
          defaultPatient={appointmentDefaultPatient}
          appointmentToEdit={editingAppointment}
          onAppointmentCreated={handleAppointmentCreated}
          onAppointmentUpdated={handleEditAppointment}
          lang={lang}
          clinicInfo={clinicInfo}
        />

        <DeviceNameModal
          isOpen={showDeviceModal}
          onClose={() => setShowDeviceModal(false)}
          onSave={handleSaveDeviceName}
          currentDeviceId={deviceId}
          lang={lang}
        />
      </div>
    </ConfirmDialogProvider>
  );
}
