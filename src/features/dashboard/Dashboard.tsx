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
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
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
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
        {/* Banner */}
        <motion.div 
          variants={slideUp} 
          className="p-10 rounded-[32px] bg-gradient-to-br from-card via-card to-background text-foreground relative overflow-hidden border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)]"
        >
          <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4 mix-blend-overlay pointer-events-none">
            <HardHat className="w-64 h-64 text-primary" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium tracking-[-0.03em] leading-[1.1]">{getGreeting()}, {labourWorker?.name}!</h1>
            <p className="text-[16px] text-muted-foreground mt-4 font-medium max-w-2xl">Here is your digital Muster Card summary for this month.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-[12px] font-semibold tracking-wider uppercase">
              <span className="bg-background border border-border/60 px-5 py-2 rounded-full shadow-sm hover:border-foreground/30 transition-colors">Site: {sites.find(s => s.id === labourWorker?.currentSiteId)?.name}</span>
              <span className="bg-background border border-border/60 px-5 py-2 rounded-full shadow-sm hover:border-foreground/30 transition-colors">Daily Wage: ₹{labourWorker?.dailyWage}</span>
              <span className="bg-background border border-border/60 px-5 py-2 rounded-full shadow-sm hover:border-foreground/30 transition-colors">Trade: {labourWorker?.trade}</span>
            </div>
          </div>
        </motion.div>

        {/* Labour Metrics */}
        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Present Days', value: monthlyPresent, sub: 'Status: Regular', border: 'border-border/80 hover:border-foreground/30' },
            { label: 'Half Days', value: monthlyHalf, sub: 'July 2026 logs', border: 'border-border/80 hover:border-foreground/30' },
            { label: 'Gross Wages Earned', value: `₹${grossWage}`, sub: 'Based on attendance', border: 'border-border/80 hover:border-foreground/30' },
            { label: 'Pending Balance', value: `₹${pendingWage}`, sub: 'To be paid by site admin', border: 'border-primary/50 shadow-[0_0_15px_-3px_rgba(190,255,80,0.15)] hover:border-primary' },
          ].map((stat, i) => (
            <motion.div key={i} variants={slideUp} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Card className={`h-full border transition-all duration-300 ${stat.border}`}>
                <CardHeader className="p-8 pb-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{stat.label}</p>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-0">
                  <h3 className="text-4xl sm:text-5xl lg:text-[52px] font-medium tracking-tight leading-[1] text-foreground">{stat.value}</h3>
                  <p className="text-[13px] font-medium mt-4 text-muted-foreground min-h-[30px] leading-relaxed">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Muster Card Table */}
        <motion.div variants={slideUp}>
          <Card className="border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-border/50">
              <CardTitle className="text-[22px] font-medium">Recent Attendance Logs</CardTitle>
              <button 
                onClick={() => navigate('/leaves')} 
                className="text-[13px] font-semibold text-foreground px-4 py-2 rounded-full border border-border hover:bg-muted transition-all"
              >
                Request Leave
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground font-semibold text-[11px] uppercase tracking-[0.1em] bg-muted/20">
                      <th className="py-4 px-8">Date</th>
                      <th className="py-4 px-8">Status</th>
                      <th className="py-4 px-8">Night Shift</th>
                      <th className="py-4 px-8">OT Hours</th>
                      <th className="py-4 px-8 text-right">Estimated Wage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {labourAttendance.slice(-10).reverse().map((rec: AttendanceRecord) => {
                      let wage = 0;
                      if (rec.status === 'Present') wage += labourWorker.dailyWage;
                      else if (rec.status === 'Half-Day') wage += labourWorker.dailyWage * 0.5;
                      if (rec.overtimeHours > 0) wage += rec.overtimeHours * labourWorker.overtimeRate;
                      if (rec.isNightShift) wage += 150;

                      return (
                        <motion.tr whileHover={{ backgroundColor: 'var(--color-card)' }} key={rec.id} className="transition-colors">
                          <td className="py-4 px-8 font-semibold text-foreground">{rec.date}</td>
                          <td className="py-4 px-8">
                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              rec.status === 'Present' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              rec.status === 'Half-Day' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                              'bg-destructive/10 text-destructive'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-4 px-8 text-muted-foreground font-medium">{rec.isNightShift ? 'Yes (+₹150)' : 'No'}</td>
                          <td className="py-4 px-8 font-medium text-foreground">{rec.overtimeHours > 0 ? `${rec.overtimeHours} hrs` : '-'}</td>
                          <td className="py-4 px-8 text-right font-bold text-foreground">₹{wage}</td>
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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      {/* Welcome Banner */}
      <motion.div 
        variants={slideUp} 
        className="p-10 rounded-[32px] bg-gradient-to-br from-card via-card to-background text-foreground relative overflow-hidden border border-border shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)]"
      >
        <div className="absolute right-0 top-0 opacity-5 translate-x-4 -translate-y-4 mix-blend-overlay pointer-events-none">
          <HardHat className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium tracking-[-0.03em] leading-[1.1]">{getGreeting()}, {currentUser?.name || 'User'}!</h1>
          <p className="text-[16px] text-muted-foreground mt-4 max-w-2xl font-medium leading-relaxed">Real-time overview of labor attendance, muster card balances, and payments flow.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-[12px] font-semibold uppercase tracking-wider">
            <span className="bg-background border border-border/60 px-5 py-2 rounded-full shadow-sm">Current Site: {sites.find(s => s.id === activeSiteId)?.name}</span>
            <span className="bg-background border border-border/60 px-5 py-2 rounded-full shadow-sm text-primary-foreground bg-primary border-primary/20">GSTIN Status: Registered</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('totalWorkers'), value: totalSiteWorkers, sub: 'Registered under active site', icon: Users, color: 'text-foreground', bg: 'bg-card border-border/80' },
          { label: t('presentToday'), value: isAttendanceMarkedToday ? presentCount : 0, max: totalSiteWorkers, sub: isAttendanceMarkedToday ? `${presentCount} Present • ${halfDayCount} Half` : 'No records yet', icon: UserCheck, color: 'text-primary-foreground', bg: 'bg-primary border-primary/20 shadow-[0_8px_25px_-5px_rgba(190,255,80,0.3)]' },
          { label: 'Earned Wages (July)', value: `₹${totalWages}`, sub: 'Gross cost for active site', icon: IndianRupee, color: 'text-foreground', bg: 'bg-card border-border/80' },
          { label: t('pendingWages'), value: `₹${pendingWages}`, sub: 'Awaiting bank/cash logs', icon: Coins, color: 'text-foreground', bg: 'bg-card border-border/80' },
        ].map((stat, i) => (
          <motion.div key={i} variants={slideUp} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className={`h-full border transition-all duration-300 ${stat.bg}`}>
              <CardContent className="p-10 flex items-center justify-between h-full">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-4">{stat.label}</p>
                  <h3 className="text-4xl sm:text-5xl lg:text-[52px] font-medium tracking-tight leading-[1] text-foreground">
                    {stat.value}
                    {stat.max !== undefined && <span className="text-[24px] font-medium text-muted-foreground ml-1">/ {stat.max}</span>}
                  </h3>
                  <p className="text-[13px] font-medium text-muted-foreground mt-4 min-h-[30px] leading-relaxed">{stat.sub}</p>
                </div>
                <div className={`w-12 h-12 rounded-[22px] flex items-center justify-center shrink-0 shadow-inner ${
                  stat.bg.includes('bg-primary') ? 'bg-black/10 text-black' : 'bg-background text-foreground border border-border/60'
                }`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16 lg:gap-20">
        {/* Attendance Breakdown SVG Chart */}
        <motion.div variants={slideUp} className="lg:col-span-2">
          <Card className="h-full border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[22px] font-medium flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-foreground" />
                {t('attendanceTrend')} <span className="text-[13px] text-muted-foreground font-normal uppercase tracking-wide ml-2">(Past 5 Days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-0">
              <div className="mt-8 h-60 w-full relative">
                <svg viewBox="0 0 500 220" className="w-full h-full text-[11px] font-medium">
                  <defs>
                    <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-electric-lime)" stopOpacity="1" />
                      <stop offset="100%" stopColor="var(--color-electric-lime)" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="absentGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-smoke)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="var(--color-smoke)" stopOpacity="0.1" />
                    </linearGradient>
                    <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--color-electric-lime)" floodOpacity="0.25" />
                    </filter>
                  </defs>

                  <line x1="40" y1="20" x2="480" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" className="text-border/50" />
                  <line x1="40" y1="70" x2="480" y2="70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" className="text-border/50" />
                  <line x1="40" y1="120" x2="480" y2="120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" className="text-border/50" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="currentColor" strokeWidth="0.5" className="text-border" />

                  <text x="10" y="24" className="fill-muted-foreground">100%</text>
                  <text x="10" y="74" className="fill-muted-foreground">75%</text>
                  <text x="10" y="124" className="fill-muted-foreground">50%</text>
                  <text x="10" y="174" className="fill-muted-foreground">0%</text>

                  {/* Bars */}
                  {/* 30 Jun */}
                  <rect x="80" y="50" width="28" height="120" rx="6" fill="url(#barGlow)" filter="url(#shadowFilter)" className="cursor-pointer hover:opacity-90 transition-opacity" />
                  <rect x="112" y="140" width="10" height="30" rx="3" fill="url(#absentGlow)" />
                  <text x="82" y="195" className="fill-muted-foreground uppercase tracking-wider font-semibold">30 Jun</text>

                  {/* 01 Jul */}
                  <rect x="160" y="40" width="28" height="130" rx="6" fill="url(#barGlow)" filter="url(#shadowFilter)" className="cursor-pointer hover:opacity-90 transition-opacity" />
                  <rect x="192" y="150" width="10" height="20" rx="3" fill="url(#absentGlow)" />
                  <text x="162" y="195" className="fill-muted-foreground uppercase tracking-wider font-semibold">01 Jul</text>

                  {/* 02 Jul */}
                  <rect x="240" y="60" width="28" height="110" rx="6" fill="url(#barGlow)" filter="url(#shadowFilter)" className="cursor-pointer hover:opacity-90 transition-opacity" />
                  <rect x="272" y="130" width="10" height="40" rx="3" fill="url(#absentGlow)" />
                  <text x="242" y="195" className="fill-muted-foreground uppercase tracking-wider font-semibold">02 Jul</text>

                  {/* 03 Jul */}
                  <rect x="320" y="30" width="28" height="140" rx="6" fill="url(#barGlow)" filter="url(#shadowFilter)" className="cursor-pointer hover:opacity-90 transition-opacity" />
                  <rect x="352" y="155" width="10" height="15" rx="3" fill="url(#absentGlow)" />
                  <text x="322" y="195" className="fill-muted-foreground uppercase tracking-wider font-semibold">03 Jul</text>

                  {/* 04 Jul */}
                  <rect x="400" y="45" width="28" height="125" rx="6" fill="url(#barGlow)" filter="url(#shadowFilter)" className="cursor-pointer hover:opacity-90 transition-opacity" />
                  <rect x="432" y="145" width="10" height="25" rx="3" fill="url(#absentGlow)" />
                  <text x="402" y="195" className="fill-muted-foreground uppercase tracking-wider font-semibold">04 Jul</text>
                </svg>

                <div className="absolute right-4 bottom-14 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]" /> Present</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-muted rounded-full" /> Absent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div variants={slideUp}>
          <Card className="h-full flex flex-col border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[22px] font-medium">{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-0 flex-1 flex flex-col justify-between">
              <div className="flex flex-col gap-4 mt-6">
                {[
                  { id: 'attendance', label: t('markAttendance'), desc: 'Record shifts, Night hours, and OT', icon: ClipboardCheck },
                  { id: 'workers', label: t('addWorker'), desc: 'Add Aadhaar, Pan, and Daily Wages', icon: Users },
                  { id: 'payments', label: t('processPayout'), desc: 'Calculate net wages & register signatures', icon: IndianRupee },
                ].map(action => (
                  <button 
                    key={action.id}
                    onClick={() => navigate(`/${action.id}`)}
                    className="group w-full flex items-center justify-between p-5 rounded-2xl border border-border/60 bg-background hover:bg-card hover:border-foreground/20 hover:shadow-sm text-left transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-12 h-12 rounded-2xl bg-muted text-foreground flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <action.icon className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-[15px] font-bold text-foreground">{action.label}</p>
                        <p className="text-[13px] text-muted-foreground mt-1 leading-normal">{action.desc}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </button>
                ))}
              </div>
              <div className="mt-8 p-4.5 rounded-2xl border border-border/40 bg-muted/20 text-[11px] uppercase tracking-widest text-muted-foreground text-center font-bold">
                July billing cycle ends in <span className="font-extrabold text-foreground">27 days</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16 lg:gap-20">
        {/* Recent Audit Logs */}
        <motion.div variants={slideUp} className="lg:col-span-2">
          <Card className="h-full border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[22px] font-medium flex items-center gap-2">
                <Clock className="w-6 h-6 text-foreground" />
                {t('recentActivities')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-0">
              <div className="flow-root mt-8">
                <ul className="-mb-8">
                  {auditLogs.map((log: any, logIdx: number) => (
                    <li key={log.id}>
                      <div className="relative pb-10">
                        {logIdx !== auditLogs.length - 1 ? (
                          <span className="absolute top-6 left-5 -ml-px h-full w-[1px] bg-border/50" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-6 items-start">
                          <div>
                            <span className="h-10 w-10 rounded-full bg-background flex items-center justify-center shrink-0 ring-4 ring-card border border-border/50">
                              <Clock className="w-4 h-4 text-foreground" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-2 flex justify-between space-x-4">
                            <div>
                              <p className="text-[14px] font-semibold text-foreground leading-relaxed">{log.details}</p>
                            </div>
                            <div className="text-right text-[10px] uppercase tracking-widest font-bold text-muted-foreground/80 whitespace-nowrap pt-0.5">
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
          <Card className="h-full border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[22px] font-medium flex items-center gap-2">
                <MapPin className="w-6 h-6 text-foreground" />
                {t('sites')} Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-0">
              <div className="space-y-4 mt-6">
                {sites.map(site => (
                  <div key={site.id} className="group flex items-center justify-between p-5 rounded-2xl border border-border/60 bg-background hover:bg-card hover:border-foreground/20 transition-all duration-300">
                    <div>
                      <h4 className="text-[15px] font-bold text-foreground truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[250px] md:max-w-[150px] lg:max-w-[200px] xl:max-w-xs">{site.name}</h4>
                      <p className="text-[13px] text-muted-foreground truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[250px] md:max-w-[150px] lg:max-w-[200px] xl:max-w-xs mt-1 leading-normal">{site.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        site.status === 'active' ? 'bg-primary/10 text-primary-foreground' :
                        site.status === 'on-hold' ? 'bg-muted text-muted-foreground border border-border/50' :
                        'bg-muted text-muted-foreground/60'
                      }`}>
                        {site.status}
                      </span>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{site.workersCount} Workers</p>
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
