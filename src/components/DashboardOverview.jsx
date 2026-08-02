import React from 'react';
import { Users, Calendar, AlertTriangle, Activity, UserPlus, ArrowUpRight, Search, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { translations } from '../translations';

export default function DashboardOverview({
  stats,
  patients,
  appointments,
  clinicInfo,
  onSelectPatient,
  onOpenNewAppointment,
  onSelectTab,
  onUpdateAppointmentStatus,
  lang = 'fr'
}) {
  const t = translations[lang] || translations.fr;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const recentPatients = patients.slice(0, 5);
  const todaysAppointments = appointments.filter(a => a.date === todayStr);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950/40 p-6 border border-slate-800 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{lang === 'fr' ? "Aperçu des Opérations Cliniques" : "Clinical Operations Overview"}</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              {lang === 'fr' ? (
                <>Bienvenue. Vous avez <span className="text-teal-400 font-semibold">{stats.todayAppointments || 0} rendez-vous</span> aujourd'hui.</>
              ) : (
                <>Welcome back. You have <span className="text-teal-400 font-semibold">{stats.todayAppointments || 0} appointments</span> scheduled for today.</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('add-patient')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-semibold border border-slate-700 flex items-center gap-2 transition shadow-md"
            >
              <UserPlus className="w-4 h-4 text-teal-400" />
              {t.newPatientBtn}
            </button>
            <button
              onClick={() => onOpenNewAppointment()}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-teal-500/20"
            >
              <Calendar className="w-4 h-4 stroke-[2.5]" />
              {t.newApptBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total Patients */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">{t.metricTotalPatients}</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">{stats.totalPatients || 0}</span>
            <span className="text-xs font-semibold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
              {t.statusActive}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>+{stats.newPatientsThisMonth || 0} {lang === 'fr' ? 'nouveaux dossiers ce mois' : 'new records this month'}</span>
          </div>
        </div>

        {/* Card 2: Today's Appointments */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">{t.metricTodayAppts}</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">{stats.todayAppointments || 0}</span>
            <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              {t.todaySchedule}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {stats.nextAppointment ? (
              `${lang === 'fr' ? 'Prochain RDV' : 'Next visit'}: ${stats.nextAppointment.time} (${stats.nextAppointment.patientName})`
            ) : (
              lang === 'fr' ? 'Aucun RDV prévu pour aujourd\'hui' : 'No appointments scheduled for today'
            )}
          </div>
        </div>



        {/* Card 4: Active Treatments */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">{t.metricActiveTreatments}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">{stats.activeTreatments || 0}</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Ongoing
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            100% EHR compliance rate
          </div>
        </div>
      </div>

      {/* Clinic Parameters Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-teal-950/30 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full">
                {lang === 'fr' ? 'Configuration Cabinet' : 'Cabinet Configuration'}
              </span>
              {clinicInfo?.ordre && (
                <span className="text-[11px] font-mono text-slate-400">
                  Ordre: <strong className="text-slate-200">{clinicInfo.ordre}</strong>
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {clinicInfo?.doctorNameFr || ''}
              {clinicInfo?.doctorNameAr && (
                <span className="text-sm font-semibold text-teal-400 font-serif mr-2" dir="rtl">
                  ({clinicInfo.doctorNameAr})
                </span>
              )}
            </h3>
            {clinicInfo?.specialtyFr && (
              <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-3xl">
                {clinicInfo.specialtyFr}
              </p>
            )}
            {clinicInfo?.msgOrd && (
              <div className="mt-2 text-xs italic text-teal-300 bg-teal-950/40 border border-teal-800/50 px-3 py-1.5 rounded-xl inline-block">
                💬 "{clinicInfo.msgOrd}"
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-1.5 text-xs text-slate-400 shrink-0">
            {clinicInfo?.addressFr && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">📍</span>
                <span className="text-slate-200 font-semibold">{clinicInfo.addressFr}</span>
              </div>
            )}
            {clinicInfo?.phone && (
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-slate-500">📞</span>
                <span className="text-teal-400 font-bold">{clinicInfo.phone}</span>
              </div>
            )}
            {clinicInfo?.email && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-500">✉️</span>
                <span className="text-slate-300">{clinicInfo.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Patients & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Patient Registry Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" /> Recent Patient Directory
              </h3>
              <p className="text-xs text-slate-400">Quick access to patient charts & medical history</p>
            </div>
            <button
              onClick={() => onSelectTab('patients')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
            >
              View All Patients ({patients.length}) <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 rounded-lg">
                <tr>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">MRN / Age</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Primary Condition</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentPatients.map((patient) => {
                  let statusColor = 'bg-teal-950 text-teal-400 border-teal-800';
                  if (patient.status === 'Critical') statusColor = 'bg-rose-950 text-rose-400 border-rose-800';
                  if (patient.status === 'Inpatient') statusColor = 'bg-amber-950 text-amber-400 border-amber-800';

                  return (
                    <tr key={patient.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{patient.lastName} {patient.firstName}</div>
                        <div className="text-xs text-slate-400">{patient.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-xs text-slate-300">{patient.mrn}</div>
                        <div className="text-xs text-slate-400">{patient.age} yrs • {patient.gender} • <span className="text-teal-300 font-bold">{patient.bloodGroup}</span></div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-slate-300 block truncate max-w-[140px]">
                          {patient.chronicConditions.length > 0 ? patient.chronicConditions[0] : 'None recorded'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 rounded-lg text-xs font-medium border border-teal-500/30 transition inline-flex items-center gap-1"
                        >
                          View History <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Upcoming Schedule & Critical Alerts */}
        <div className="space-y-6">


          {/* Today's Schedule */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> Today's Appointments
              </h3>
              <button
                onClick={() => onSelectTab('appointments')}
                className="text-xs text-cyan-400 hover:underline"
              >
                Full Calendar
              </button>
            </div>

            <div className="space-y-3">
              {todaysAppointments.map((apt, index) => (
                <div key={apt.id || index} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 font-mono font-black border border-teal-500/40 rounded-lg text-xs shadow-sm">
                        N° {apt.num_rdv || (index + 1)}
                      </span>
                      {apt.time ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/15 text-amber-300 font-mono font-black border border-amber-400/40 rounded-lg text-xs shadow-sm">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          {apt.time}
                        </span>
                      ) : null}
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      apt.status === 'Completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : apt.status === 'In Progress'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {apt.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-white">{apt.patientName}</div>
                    <div className="text-xs text-slate-400">{apt.reason} • <span className="text-slate-300">{apt.department}</span></div>
                  </div>

                  {apt.status !== 'Completed' && (
                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => onUpdateAppointmentStatus(apt.id, 'Completed')}
                        className="text-[11px] px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30 flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark Completed
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
