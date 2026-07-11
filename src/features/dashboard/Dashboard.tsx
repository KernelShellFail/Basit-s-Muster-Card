import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  IndianRupee, 
  MapPin, 
  Clock, 
  ArrowUpRight,
  ClipboardCheck,
  Coins,
  HardHat
} from 'lucide-react';
import type { AttendanceRecord, Worker } from '../../services/db';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const Dashboard = ({ setCurrentTab }: DashboardProps) => {
  const { workers, sites, activeSiteId, currentLanguage, selectedRole, currentUser } = useAppStore();
  const { t } = useTranslation(currentLanguage);

  // Filter workers assigned to active site
  const siteWorkers = workers.filter(w => w.currentSiteId === activeSiteId && w.status === 'Active');
  const totalSiteWorkers = siteWorkers.length;

  // Mock attendance status calculation for today (2026-07-04)
  const today = '2026-07-04';
  const localAttendance = localStorage.getItem('mm_attendance') 
    ? JSON.parse(localStorage.getItem('mm_attendance') || '[]') 
    : [];

  const todayRecords = localAttendance.filter((r: AttendanceRecord) => r.date === today && r.siteId === activeSiteId);

  const presentCount = todayRecords.filter((r: AttendanceRecord) => r.status === 'Present').length;
  const halfDayCount = todayRecords.filter((r: AttendanceRecord) => r.status === 'Half-Day').length;
  const absentCount = todayRecords.filter((r: AttendanceRecord) => r.status === 'Absent').length;

  // Fallback if attendance is not marked today
  const isAttendanceMarkedToday = todayRecords.length > 0;

  // Monthly Wage Calculation for active site
  const calculateSiteWages = () => {
    let totalWages = 0;
    let pendingWages = 0;
    
    const payments = localStorage.getItem('mm_payments') 
      ? JSON.parse(localStorage.getItem('mm_payments') || '[]') 
      : [];

    siteWorkers.forEach((worker: Worker) => {
      // Find all attendance for this worker in July 2026
      const workerAttendance = localAttendance.filter((r: AttendanceRecord) => 
        r.workerId === worker.id && r.date.startsWith('2026-07')
      );

      let earned = 0;
      workerAttendance.forEach((att: AttendanceRecord) => {
        if (att.status === 'Present') {
          earned += worker.dailyWage;
        } else if (att.status === 'Half-Day') {
          earned += worker.dailyWage * 0.5;
        }
        // Overtime rate addition
        if (att.overtimeHours > 0) {
          earned += att.overtimeHours * worker.overtimeRate;
        }
        // Night shift allowance bonus
        if (att.isNightShift) {
          earned += 150; // Flat Night Shift Allowance
        }
      });

      // Find payments made to this worker in July
      const paid = payments
        .filter((p: any) => p.workerId === worker.id && p.date.startsWith('2026-07'))
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      totalWages += earned;
      pendingWages += Math.max(0, earned - paid);
    });

    return { totalWages, pendingWages };
  };

  const { totalWages, pendingWages } = calculateSiteWages();

  // Audit Logs (recent activity)
  const auditLogs = localStorage.getItem('mm_auditLogs') 
    ? JSON.parse(localStorage.getItem('mm_auditLogs') || '[]').slice(0, 5)
    : [
        { id: '1', timestamp: '2026-07-04T12:00:00Z', details: 'Satish Kamble finalized attendance for Site 01 today.' },
        { id: '2', timestamp: '2026-07-04T10:05:00Z', details: 'Ramesh Yadav submitted a medical leave request for 3 days.' },
        { id: '3', timestamp: '2026-07-03T18:30:00Z', details: 'Wages calculation sheet for Sector 10 Metro approved.' }
      ];

  // Helper for human-readable time
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '10:00 AM';
    }
  };

  // Render Owner/Admin Dashboard or Labour view
  if (selectedRole === 'labour') {
    // Labour Specific Dashboard
    const labourWorker = workers.find(w => w.phone === currentUser?.phone) || workers[0];
    const labourAttendance = localAttendance.filter((r: AttendanceRecord) => r.workerId === labourWorker?.id);
    const workerPayments = (localStorage.getItem('mm_payments') ? JSON.parse(localStorage.getItem('mm_payments') || '[]') : [])
      .filter((p: any) => p.workerId === labourWorker?.id);

    const monthlyPresent = labourAttendance.filter((r: AttendanceRecord) => r.status === 'Present' && r.date.startsWith('2026-07')).length;
    const monthlyHalf = labourAttendance.filter((r: AttendanceRecord) => r.status === 'Half-Day' && r.date.startsWith('2026-07')).length;
    
    // Calculate gross wages
    let grossWage = 0;
    labourAttendance.filter((r: AttendanceRecord) => r.date.startsWith('2026-07')).forEach((att: AttendanceRecord) => {
      if (att.status === 'Present') grossWage += labourWorker.dailyWage;
      else if (att.status === 'Half-Day') grossWage += labourWorker.dailyWage * 0.5;
      if (att.overtimeHours > 0) grossWage += att.overtimeHours * labourWorker.overtimeRate;
      if (att.isNightShift) grossWage += 150;
    });

    const receivedWage = workerPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const pendingWage = Math.max(0, grossWage - receivedWage);

    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-construction-900 to-construction-850 text-white relative overflow-hidden shadow-lg border border-construction-800">
          <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
            <HardHat className="w-64 h-64" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold">नमस्कार, {labourWorker?.name}!</h1>
          <p className="text-sm text-construction-300 mt-1">Here is your digital Muster Card summary for this month.</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold">
            <span className="bg-white/10 px-3 py-1 rounded-full">Site: {sites.find(s => s.id === labourWorker?.currentSiteId)?.name}</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Daily Wage: ₹{labourWorker?.dailyWage}</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Trade: {labourWorker?.trade}</span>
          </div>
        </div>

        {/* Labour Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm">
            <p className="text-xs font-bold text-construction-500 uppercase tracking-wider">Present Days</p>
            <h3 className="text-2xl font-extrabold text-construction-800 dark:text-white mt-1.5">{monthlyPresent}</h3>
            <p className="text-[11px] text-emerald-500 font-bold mt-1">Status: Regular</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm">
            <p className="text-xs font-bold text-construction-500 uppercase tracking-wider">Half Days</p>
            <h3 className="text-2xl font-extrabold text-construction-800 dark:text-white mt-1.5">{monthlyHalf}</h3>
            <p className="text-[11px] text-construction-400 mt-1">July 2026 logs</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm">
            <p className="text-xs font-bold text-construction-500 uppercase tracking-wider">Gross Wages Earned</p>
            <h3 className="text-2xl font-extrabold text-construction-800 dark:text-white mt-1.5">₹{grossWage}</h3>
            <p className="text-[11px] text-emerald-500 font-bold mt-1">Based on attendance</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm">
            <p className="text-xs font-bold text-construction-500 uppercase tracking-wider">Pending Balance</p>
            <h3 className="text-2xl font-extrabold text-amber-500 mt-1.5">₹{pendingWage}</h3>
            <p className="text-[11px] text-construction-400 mt-1">To be paid by site admin</p>
          </div>
        </div>

        {/* Muster Card Table */}
        <div className="p-6 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-construction-800 dark:text-white">Recent Attendance Logs</h3>
            <button 
              onClick={() => setCurrentTab('leaves')}
              className="text-xs font-bold text-safety-600 dark:text-safety-500 hover:underline"
            >
              Request Leave
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-construction-100 dark:border-construction-800 text-construction-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Night Shift</th>
                  <th className="py-2.5">OT Hours</th>
                  <th className="py-2.5 text-right">Estimated Wage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-construction-100 dark:divide-construction-800/40">
                {labourAttendance.slice(-10).reverse().map((rec: AttendanceRecord) => {
                  let wage = 0;
                  if (rec.status === 'Present') wage += labourWorker.dailyWage;
                  else if (rec.status === 'Half-Day') wage += labourWorker.dailyWage * 0.5;
                  if (rec.overtimeHours > 0) wage += rec.overtimeHours * labourWorker.overtimeRate;
                  if (rec.isNightShift) wage += 150;

                  return (
                    <tr key={rec.id} className="text-construction-700 dark:text-construction-300 font-medium">
                      <td className="py-3 font-bold">{rec.date}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present' ? 'bg-emerald-500/10 text-emerald-600' :
                          rec.status === 'Half-Day' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3">{rec.isNightShift ? 'Yes' : 'No'}</td>
                      <td className="py-3 font-semibold text-construction-900 dark:text-white">{rec.overtimeHours} hrs</td>
                      <td className="py-3 text-right font-bold text-construction-900 dark:text-white">₹{wage}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Owner/Admin view
  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-construction-900 to-construction-850 text-white relative overflow-hidden shadow-lg border border-construction-800">
        <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
          <HardHat className="w-64 h-64" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold">MusterMate Command Dashboard</h1>
        <p className="text-sm text-construction-300 mt-1">Real-time overview of labor attendance, muster card balances, and payments flow.</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold">
          <span className="bg-white/10 px-3 py-1 rounded-full">Current Site: {sites.find(s => s.id === activeSiteId)?.name}</span>
          <span className="bg-white/10 px-3 py-1 rounded-full">GSTIN Status: Registered</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-construction-500 uppercase tracking-wider">{t('totalWorkers')}</p>
            <h3 className="text-2xl font-extrabold text-construction-800 dark:text-white mt-1.5">{totalSiteWorkers}</h3>
            <p className="text-[11px] text-construction-400 mt-1">Registered under active site</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-construction-100 dark:bg-construction-800 text-construction-700 dark:text-construction-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Present Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-construction-500 uppercase tracking-wider">{t('presentToday')}</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-500 mt-1.5">
              {isAttendanceMarkedToday ? presentCount : 0}
              <span className="text-xs font-semibold text-construction-400 ml-1">/ {totalSiteWorkers}</span>
            </h3>
            <p className="text-[11px] text-construction-400 mt-1">
              {isAttendanceMarkedToday 
                ? `${presentCount} Present • ${halfDayCount} Half • ${absentCount} Absent` 
                : 'No records yet for today'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Gross Wages July */}
        <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-construction-500 uppercase tracking-wider">Earned Wages (July)</p>
            <h3 className="text-2xl font-extrabold text-construction-800 dark:text-white mt-1.5">₹{totalWages}</h3>
            <p className="text-[11px] text-construction-400 mt-1">Gross cost for active site</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-construction-100 dark:bg-construction-800 text-construction-700 dark:text-construction-300 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-construction-500 uppercase tracking-wider">{t('pendingWages')}</p>
            <h3 className="text-2xl font-extrabold text-amber-500 mt-1.5">₹{pendingWages}</h3>
            <p className="text-[11px] text-construction-400 mt-1">Awaiting bank/cash logs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Charts Section using Lightweight Inline SVG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Breakdown SVG Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm">
          <h3 className="text-sm font-bold text-construction-850 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-safety-500" />
            {t('attendanceTrend')} (Past 5 Days)
          </h3>
          
          <div className="mt-6 h-60 w-full relative">
            {/* SVG Visualizing 5-day attendance trend */}
            <svg viewBox="0 0 500 220" className="w-full h-full text-xs">
              {/* Y Axis Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3,3" className="dark:stroke-construction-800" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3,3" className="dark:stroke-construction-800" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3,3" className="dark:stroke-construction-800" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="0.5" className="dark:stroke-construction-700" />

              {/* Y Axis labels */}
              <text x="15" y="24" className="fill-construction-500 font-bold">100%</text>
              <text x="15" y="74" className="fill-construction-500 font-bold">75%</text>
              <text x="15" y="124" className="fill-construction-500 font-bold">50%</text>
              <text x="15" y="174" className="fill-construction-500 font-bold">0%</text>

              {/* Data Bars for 5 days */}
              {/* Day 1: 30 June */}
              <rect x="80" y="50" width="30" height="120" rx="4" className="fill-emerald-500/85 hover:fill-emerald-500 transition-colors" />
              <rect x="112" y="140" width="12" height="30" rx="2" className="fill-red-400" />
              <text x="85" y="195" className="fill-construction-650 dark:fill-construction-400 font-bold">30 Jun</text>

              {/* Day 2: 1 July */}
              <rect x="160" y="40" width="30" height="130" rx="4" className="fill-emerald-500/85 hover:fill-emerald-500" />
              <rect x="192" y="150" width="12" height="20" rx="2" className="fill-red-400" />
              <text x="168" y="195" className="fill-construction-650 dark:fill-construction-400 font-bold">01 Jul</text>

              {/* Day 3: 2 July */}
              <rect x="240" y="60" width="30" height="110" rx="4" className="fill-emerald-500/85 hover:fill-emerald-500" />
              <rect x="272" y="130" width="12" height="40" rx="2" className="fill-red-400" />
              <text x="248" y="195" className="fill-construction-650 dark:fill-construction-400 font-bold">02 Jul</text>

              {/* Day 4: 3 July */}
              <rect x="320" y="30" width="30" height="140" rx="4" className="fill-emerald-500/85 hover:fill-emerald-500" />
              <rect x="352" y="155" width="12" height="15" rx="2" className="fill-red-400" />
              <text x="328" y="195" className="fill-construction-650 dark:fill-construction-400 font-bold">03 Jul</text>

              {/* Day 5: 4 July */}
              <rect x="400" y="45" width="30" height="125" rx="4" className="fill-emerald-500/85 hover:fill-emerald-500" />
              <rect x="432" y="145" width="12" height="25" rx="2" className="fill-red-400" />
              <text x="408" y="195" className="fill-construction-650 dark:fill-construction-400 font-bold">04 Jul</text>
            </svg>

            {/* Legend overlay */}
            <div className="absolute right-4 bottom-14 flex items-center gap-3 text-[10px] font-bold text-construction-600 dark:text-construction-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> Present</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-400 rounded" /> Absent</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-construction-850 dark:text-white">{t('quickActions')}</h3>
            <div className="mt-4 flex flex-col gap-3">
              <button 
                onClick={() => setCurrentTab('attendance')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-construction-150 dark:border-construction-800 hover:bg-safety-500/10 dark:hover:bg-safety-500/5 hover:border-safety-400 text-left transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-construction-800 dark:text-white">{t('markAttendance')}</p>
                    <p className="text-[10px] text-construction-500">Record shifts, Night hours, and OT</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-construction-400" />
              </button>

              <button 
                onClick={() => setCurrentTab('workers')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-construction-150 dark:border-construction-800 hover:bg-safety-500/10 dark:hover:bg-safety-500/5 hover:border-safety-400 text-left transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-construction-800 dark:text-white">{t('addWorker')}</p>
                    <p className="text-[10px] text-construction-500">Add Aadhaar, Pan, and Daily Wages</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-construction-400" />
              </button>

              <button 
                onClick={() => setCurrentTab('payments')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-construction-150 dark:border-construction-800 hover:bg-safety-500/10 dark:hover:bg-safety-500/5 hover:border-safety-400 text-left transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-construction-800 dark:text-white">{t('processPayout')}</p>
                    <p className="text-[10px] text-construction-500">Calculate net wages & register signatures</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-construction-400" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-construction-100 dark:border-construction-800 text-[10px] text-construction-400 text-center font-semibold">
            July billing cycle ends in 27 days
          </div>
        </div>
      </div>

      {/* Bottom Layout: Activity Logs and Site Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Audit Logs */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm">
          <h3 className="text-sm font-bold text-construction-850 dark:text-white flex items-center gap-1.5 mb-4">
            <Clock className="w-4 h-4 text-construction-500" />
            {t('recentActivities')}
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {auditLogs.map((log: any, logIdx: number) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {logIdx !== auditLogs.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-construction-200 dark:bg-construction-800" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-construction-100 dark:bg-construction-800 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-construction-600 dark:text-construction-400" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs font-medium text-construction-700 dark:text-construction-300">{log.details}</p>
                        </div>
                        <div className="text-right text-[10px] font-bold text-construction-500 whitespace-nowrap">
                          {formatTime(log.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Site Details List */}
        <div className="p-6 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm">
          <h3 className="text-sm font-bold text-construction-850 dark:text-white flex items-center gap-1.5 mb-4">
            <MapPin className="w-4 h-4 text-construction-500" />
            {t('sites')} Overview
          </h3>
          <div className="space-y-4">
            {sites.map(site => (
              <div key={site.id} className="flex items-center justify-between p-3 rounded-xl border border-construction-100 dark:border-construction-800 bg-construction-50/30 dark:bg-construction-950/20">
                <div>
                  <h4 className="text-xs font-bold text-construction-800 dark:text-white truncate max-w-[150px]">{site.name}</h4>
                  <p className="text-[10px] text-construction-500 truncate max-w-[150px] mt-0.5">{site.address}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    site.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                    site.status === 'on-hold' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-slate-500/10 text-slate-600'
                  }`}>
                    {site.status}
                  </span>
                  <p className="text-[10px] font-bold text-construction-700 dark:text-construction-350 mt-1">{site.workersCount} Workers</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
