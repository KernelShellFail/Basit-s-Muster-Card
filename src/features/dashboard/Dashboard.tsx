import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { staggerContainer, slideUp } from '../../utils/animations';
import { useWorkers, useSites, useAttendance, usePayments } from '../../api/queries';

export const Dashboard = () => {
  const { activeSiteId, currentLanguage, selectedRole, currentUser } = useAppStore();
  const { data: workers = [] } = useWorkers();
  const { data: sites = [] } = useSites();
  const { data: attendance = [] } = useAttendance();
  const { data: payments = [] } = usePayments();
  const { t } = useTranslation(currentLanguage);
  const navigate = useNavigate();

  const siteWorkers = workers.filter(w => w.currentSiteId === activeSiteId && w.status === 'Active');
  const totalSiteWorkers = siteWorkers.length;

  const today = '2026-07-04';
  const todayRecords = attendance.filter((r: AttendanceRecord) => r.date === today && r.siteId === activeSiteId);
  const presentCount = todayRecords.filter((r: AttendanceRecord) => r.status === 'Present').length;
  const halfDayCount = todayRecords.filter((r: AttendanceRecord) => r.status === 'Half-Day').length;
  const absentCount = todayRecords.filter((r: AttendanceRecord) => r.status === 'Absent').length;

  const isAttendanceMarkedToday = todayRecords.length > 0;

  const calculateSiteWages = () => {
    let totalWages = 0;
    let pendingWages = 0;
    
    siteWorkers.forEach((worker: Worker) => {
      const workerAttendance = attendance.filter((r: AttendanceRecord) => 
        r.workerId === worker.id && r.date.startsWith('2026-07')
      );

      let earned = 0;
      workerAttendance.forEach((att: AttendanceRecord) => {
        if (att.status === 'Present') earned += worker.dailyWage;
        else if (att.status === 'Half-Day') earned += worker.dailyWage * 0.5;
        if (att.overtimeHours > 0) earned += att.overtimeHours * worker.overtimeRate;
        if (att.isNightShift) earned += 150; 
      });

      const paid = payments
        .filter((p: any) => p.workerId === worker.id && p.date.startsWith('2026-07'))
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      totalWages += earned;
      pendingWages += Math.max(0, earned - paid);
    });

    return { totalWages, pendingWages };
  };

  const { totalWages, pendingWages } = calculateSiteWages();

  const auditLogs = localStorage.getItem('mm_auditLogs') 
    ? JSON.parse(localStorage.getItem('mm_auditLogs') || '[]').slice(0, 5)
    : [
        { id: '1', timestamp: '2026-07-04T12:00:00Z', details: 'Satish Kamble finalized attendance for Site 01 today.' },
        { id: '2', timestamp: '2026-07-04T10:05:00Z', details: 'Ramesh Yadav submitted a medical leave request for 3 days.' },
        { id: '3', timestamp: '2026-07-03T18:30:00Z', details: 'Wages calculation sheet for Sector 10 Metro approved.' }
      ];

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '10:00 AM';
    }
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning (शुभ प्रभात)';
    if (hrs < 17) return 'Good Afternoon (शुभ दोपहर)';
    return 'Good Evening (शुभ संध्या)';
  };

  if (selectedRole === 'labour') {
    const labourWorker = workers.find(w => w.phone === currentUser?.phone) || workers[0];
    const labourAttendance = attendance.filter((r: AttendanceRecord) => r.workerId === labourWorker?.id);
    const workerPayments = payments.filter((p: any) => p.workerId === labourWorker?.id);

    const monthlyPresent = labourAttendance.filter((r: AttendanceRecord) => r.status === 'Present' && r.date.startsWith('2026-07')).length;
    const monthlyHalf = labourAttendance.filter((r: AttendanceRecord) => r.status === 'Half-Day' && r.date.startsWith('2026-07')).length;
    
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
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-[80px]">
        {/* Banner */}
        <motion.div variants={slideUp} className="p-10 rounded-[28px] bg-card text-foreground relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-20 translate-x-4 -translate-y-4 mix-blend-overlay">
            <HardHat className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <h1 className="text-[60px] font-medium tracking-[-1.8px] leading-[1]">{getGreeting()}, {labourWorker?.name}!</h1>
            <p className="text-[16px] text-muted-foreground mt-4 font-medium">Here is your digital Muster Card summary for this month.</p>
            <div className="mt-8 flex flex-wrap gap-4 text-[14px] font-medium tracking-wide uppercase">
              <span className="border border-border px-6 py-2 rounded-full">Site: {sites.find(s => s.id === labourWorker?.currentSiteId)?.name}</span>
              <span className="border border-border px-6 py-2 rounded-full">Daily Wage: ₹{labourWorker?.dailyWage}</span>
              <span className="border border-border px-6 py-2 rounded-full">Trade: {labourWorker?.trade}</span>
            </div>
          </div>
        </motion.div>

        {/* Labour Metrics */}
        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Present Days', value: monthlyPresent, sub: 'Status: Regular', border: 'border-border' },
            { label: 'Half Days', value: monthlyHalf, sub: 'July 2026 logs', border: 'border-border' },
            { label: 'Gross Wages Earned', value: `₹${grossWage}`, sub: 'Based on attendance', border: 'border-border' },
            { label: 'Pending Balance', value: `₹${pendingWage}`, sub: 'To be paid by site admin', border: 'border-foreground' },
          ].map((stat, i) => (
            <motion.div key={i} variants={slideUp}>
              <Card className={`border ${stat.border}`}>
                <CardHeader>
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-[0.1em]">{stat.label}</p>
                </CardHeader>
                <CardContent>
                  <h3 className="text-[60px] font-medium tracking-[-1.8px] leading-[1] text-foreground">{stat.value}</h3>
                  <p className="text-[14px] font-medium mt-4 text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Muster Card Table */}
        <motion.div variants={slideUp}>
          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between p-6 sm:p-8">
              <CardTitle>Recent Attendance Logs</CardTitle>
              <button onClick={() => navigate('/leaves')} className="text-xs font-bold text-brand-500 hover:text-brand-400 hover:underline transition-all">
                Request Leave
              </button>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Night Shift</th>
                      <th className="py-3 px-4">OT Hours</th>
                      <th className="py-3 px-4 text-right">Estimated Wage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {labourAttendance.slice(-10).reverse().map((rec: AttendanceRecord) => {
                      let wage = 0;
                      if (rec.status === 'Present') wage += labourWorker.dailyWage;
                      else if (rec.status === 'Half-Day') wage += labourWorker.dailyWage * 0.5;
                      if (rec.overtimeHours > 0) wage += rec.overtimeHours * labourWorker.overtimeRate;
                      if (rec.isNightShift) wage += 150;

                      return (
                        <motion.tr whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }} key={rec.id} className="transition-colors">
                          <td className="py-3 px-4 font-semibold">{rec.date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                              rec.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' :
                              rec.status === 'Half-Day' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-destructive/10 text-destructive'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{rec.isNightShift ? 'Yes' : 'No'}</td>
                          <td className="py-3 px-4 font-medium">{rec.overtimeHours} hrs</td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">₹{wage}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // Owner/Admin view
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-[80px]">
      
      {/* Welcome Banner */}
      <motion.div variants={slideUp} className="p-10 rounded-[28px] bg-card text-foreground relative overflow-hidden border border-border">
        <div className="absolute right-0 top-0 opacity-5 translate-x-4 -translate-y-4 mix-blend-overlay">
          <HardHat className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <h1 className="text-[60px] font-medium tracking-[-1.8px] leading-[1]">{getGreeting()}, {currentUser?.name || 'User'}!</h1>
          <p className="text-[16px] text-muted-foreground mt-4 max-w-2xl font-medium">Real-time overview of labor attendance, muster card balances, and payments flow.</p>
          <div className="mt-8 flex flex-wrap gap-4 text-[14px] font-medium uppercase tracking-wide">
            <span className="border border-border px-6 py-2 rounded-full">Current Site: {sites.find(s => s.id === activeSiteId)?.name}</span>
            <span className="border border-border px-6 py-2 rounded-full">GSTIN Status: Registered</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('totalWorkers'), value: totalSiteWorkers, sub: 'Registered under active site', icon: Users, color: 'text-foreground', bg: 'bg-background' },
          { label: t('presentToday'), value: isAttendanceMarkedToday ? presentCount : 0, max: totalSiteWorkers, sub: isAttendanceMarkedToday ? `${presentCount} Present • ${halfDayCount} Half` : 'No records yet', icon: UserCheck, color: 'text-foreground', bg: 'bg-primary' },
          { label: 'Earned Wages (July)', value: `₹${totalWages}`, sub: 'Gross cost for active site', icon: IndianRupee, color: 'text-foreground', bg: 'bg-background' },
          { label: t('pendingWages'), value: `₹${pendingWages}`, sub: 'Awaiting bank/cash logs', icon: Coins, color: 'text-foreground', bg: 'bg-background' },
        ].map((stat, i) => (
          <motion.div key={i} variants={slideUp}>
            <Card className="h-full border border-border transition-colors">
              <CardContent className="p-10 flex items-center justify-between h-full">
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-[0.1em] mb-4">{stat.label}</p>
                  <h3 className="text-[60px] font-medium tracking-[-1.8px] leading-[1] text-foreground">
                    {stat.value}
                    {stat.max !== undefined && <span className="text-[28px] font-medium text-muted-foreground ml-1">/ {stat.max}</span>}
                  </h3>
                  <p className="text-[14px] font-medium text-muted-foreground mt-4">{stat.sub}</p>
                </div>
                <div className={`w-12 h-12 rounded-[28px] ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[80px]">
        {/* Attendance Breakdown SVG Chart */}
        <motion.div variants={slideUp} className="lg:col-span-2">
          <Card className="h-full border border-border">
            <CardHeader>
              <CardTitle className="text-[28px] font-medium flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-foreground" />
                {t('attendanceTrend')} <span className="text-[14px] text-muted-foreground font-medium uppercase tracking-wide">(Past 5 Days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-8 h-60 w-full relative">
                <svg viewBox="0 0 500 220" className="w-full h-full text-[12px]">
                  <line x1="40" y1="20" x2="480" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" className="text-border" />
                  <line x1="40" y1="70" x2="480" y2="70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" className="text-border" />
                  <line x1="40" y1="120" x2="480" y2="120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" className="text-border" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="currentColor" strokeWidth="0.5" className="text-border" />

                  <text x="15" y="24" className="fill-muted-foreground font-medium">100%</text>
                  <text x="15" y="74" className="fill-muted-foreground font-medium">75%</text>
                  <text x="15" y="124" className="fill-muted-foreground font-medium">50%</text>
                  <text x="15" y="174" className="fill-muted-foreground font-medium">0%</text>

                  {/* Bars */}
                  <rect x="80" y="50" width="30" height="120" rx="4" className="fill-foreground hover:fill-muted-foreground transition-colors cursor-pointer" />
                  <rect x="112" y="140" width="12" height="30" rx="2" className="fill-muted" />
                  <text x="85" y="195" className="fill-muted-foreground font-medium uppercase tracking-[0.1em]">30 Jun</text>

                  <rect x="160" y="40" width="30" height="130" rx="4" className="fill-foreground hover:fill-muted-foreground transition-colors cursor-pointer" />
                  <rect x="192" y="150" width="12" height="20" rx="2" className="fill-muted" />
                  <text x="168" y="195" className="fill-muted-foreground font-medium uppercase tracking-[0.1em]">01 Jul</text>

                  <rect x="240" y="60" width="30" height="110" rx="4" className="fill-foreground hover:fill-muted-foreground transition-colors cursor-pointer" />
                  <rect x="272" y="130" width="12" height="40" rx="2" className="fill-muted" />
                  <text x="248" y="195" className="fill-muted-foreground font-medium uppercase tracking-[0.1em]">02 Jul</text>

                  <rect x="320" y="30" width="30" height="140" rx="4" className="fill-foreground hover:fill-muted-foreground transition-colors cursor-pointer" />
                  <rect x="352" y="155" width="12" height="15" rx="2" className="fill-muted" />
                  <text x="328" y="195" className="fill-muted-foreground font-medium uppercase tracking-[0.1em]">03 Jul</text>

                  <rect x="400" y="45" width="30" height="125" rx="4" className="fill-foreground hover:fill-muted-foreground transition-colors cursor-pointer" />
                  <rect x="432" y="145" width="12" height="25" rx="2" className="fill-muted" />
                  <text x="408" y="195" className="fill-muted-foreground font-medium uppercase tracking-[0.1em]">04 Jul</text>
                </svg>

                <div className="absolute right-4 bottom-14 flex items-center gap-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-foreground rounded-[4px]" /> Present</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-muted rounded-[4px]" /> Absent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div variants={slideUp}>
          <Card className="h-full flex flex-col border border-border">
            <CardHeader>
              <CardTitle className="text-[28px] font-medium">{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="flex flex-col gap-4 mt-4">
                {[
                  { id: 'attendance', label: t('markAttendance'), desc: 'Record shifts, Night hours, and OT', icon: ClipboardCheck },
                  { id: 'workers', label: t('addWorker'), desc: 'Add Aadhaar, Pan, and Daily Wages', icon: Users },
                  { id: 'payments', label: t('processPayout'), desc: 'Calculate net wages & register signatures', icon: IndianRupee },
                ].map(action => (
                  <button 
                    key={action.id}
                    onClick={() => navigate(`/${action.id}`)}
                    className="group w-full flex items-center justify-between p-5 rounded-[28px] border border-border bg-background hover:bg-muted/50 text-left transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-12 h-12 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0">
                        <action.icon className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-[16px] font-medium text-foreground">{action.label}</p>
                        <p className="text-[14px] text-muted-foreground mt-1">{action.desc}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-border/50 text-[12px] uppercase tracking-widest text-muted-foreground text-center font-medium">
                July billing cycle ends in <span className="font-bold text-foreground">27 days</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[80px]">
        {/* Recent Audit Logs */}
        <motion.div variants={slideUp} className="lg:col-span-2">
          <Card className="h-full border border-border">
            <CardHeader>
              <CardTitle className="text-[28px] font-medium flex items-center gap-2">
                <Clock className="w-6 h-6 text-foreground" />
                {t('recentActivities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flow-root mt-6">
                <ul className="-mb-8">
                  {auditLogs.map((log: any, logIdx: number) => (
                    <li key={log.id}>
                      <div className="relative pb-10">
                        {logIdx !== auditLogs.length - 1 ? (
                          <span className="absolute top-6 left-5 -ml-px h-full w-[1px] bg-border" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-6 items-start">
                          <div>
                            <span className="h-10 w-10 rounded-full bg-background flex items-center justify-center shrink-0 ring-4 ring-card border border-border">
                              <Clock className="w-5 h-5 text-foreground" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-2 flex justify-between space-x-4">
                            <div>
                              <p className="text-[14px] font-medium text-foreground">{log.details}</p>
                            </div>
                            <div className="text-right text-[12px] uppercase tracking-widest font-medium text-muted-foreground whitespace-nowrap">
                              {formatTime(log.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Site Details List */}
        <motion.div variants={slideUp}>
          <Card className="h-full border border-border">
            <CardHeader>
              <CardTitle className="text-[28px] font-medium flex items-center gap-2">
                <MapPin className="w-6 h-6 text-foreground" />
                {t('sites')} Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-6">
                {sites.map(site => (
                  <div key={site.id} className="group flex items-center justify-between p-5 rounded-[28px] border border-border bg-background hover:bg-muted/50 transition-colors">
                    <div>
                      <h4 className="text-[16px] font-medium text-foreground truncate max-w-[150px]">{site.name}</h4>
                      <p className="text-[14px] text-muted-foreground truncate max-w-[150px] mt-1">{site.address}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-medium px-3 py-1.5 rounded-full uppercase tracking-[0.1em] ${
                        site.status === 'active' ? 'bg-primary/20 text-foreground' :
                        site.status === 'on-hold' ? 'bg-muted text-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {site.status}
                      </span>
                      <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-widest mt-2">{site.workersCount} Workers</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
