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
import type { AttendanceRecord, Worker, SystemNotification } from '../../services/db';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { staggerContainer, slideUp } from '../../utils/animations';
import { useWorkers, useSites, useAttendance, usePayments, useNotifications } from '../../api/queries';
import { appConfig, formatCurrency } from '../../config/appConfig';

export const Dashboard = () => {
  const { activeSiteId, currentLanguage, selectedRole, currentUser } = useAppStore();
  const { data: workers = [] } = useWorkers();
  const { data: sites = [] } = useSites();
  const { data: attendance = [] } = useAttendance();
  const { data: payments = [] } = usePayments();
  const { data: notifications = [] } = useNotifications();
  const { t } = useTranslation(currentLanguage);
  const navigate = useNavigate();

  const siteWorkers = workers.filter(w => w.currentSiteId === activeSiteId && w.status === 'Active');
  const totalSiteWorkers = siteWorkers.length;

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long' });
  const todayRecords = attendance.filter((r: AttendanceRecord) => r.date === today && r.siteId === activeSiteId);
  const presentCount = todayRecords.filter((r: AttendanceRecord) => r.status === 'Present').length;
  const halfDayCount = todayRecords.filter((r: AttendanceRecord) => r.status === 'Half-Day').length;

  const isAttendanceMarkedToday = todayRecords.length > 0;

  const calculateSiteWages = () => {
    let totalWages = 0;
    let pendingWages = 0;

    siteWorkers.forEach((worker: Worker) => {
      const workerAttendance = attendance.filter((r: AttendanceRecord) =>
        r.workerId === worker.id && r.date.startsWith(currentMonth)
      );

      let earned = 0;
      workerAttendance.forEach((att: AttendanceRecord) => {
        if (att.status === 'Present') earned += worker.dailyWage;
        else if (att.status === 'Half-Day') earned += worker.dailyWage * 0.5;
        if (att.overtimeHours > 0) earned += att.overtimeHours * worker.overtimeRate;
        if (att.isNightShift) earned += appConfig.nightShiftAllowance;
      });

      const paid = payments
        .filter((p: any) => p.workerId === worker.id && p.date.startsWith(currentMonth))
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      totalWages += earned;
      pendingWages += Math.max(0, earned - paid);
    });

    return { totalWages, pendingWages };
  };

  const { totalWages, pendingWages } = calculateSiteWages();

  const last5Days = [...Array(5)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last5Days.map(date => {
    const dayRecords = attendance.filter((r: AttendanceRecord) => r.date === date && r.siteId === activeSiteId);
    const present = dayRecords.filter((r: AttendanceRecord) => r.status === 'Present').length;
    const absent = dayRecords.filter((r: AttendanceRecord) => r.status === 'Absent').length;
    return {
      date,
      present,
      absent,
      label: new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    };
  });
  const chartScale = (n: number) => totalSiteWorkers > 0 ? Math.round((n / totalSiteWorkers) * 130) : 0;
  const chartX = [80, 160, 240, 320, 400];

  const auditLogs = localStorage.getItem('mm_auditLogs')
    ? JSON.parse(localStorage.getItem('mm_auditLogs') || '[]').slice(0, 5)
    : notifications.slice(0, 5).map((n: SystemNotification) => ({
        id: n.id,
        timestamp: n.createdAt,
        details: n.message,
      }));

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
    const labourWorker = workers.find(w => w.id === currentUser?.workerId) || workers.find(w => w.phone === currentUser?.phone) || workers[0];
    const labourAttendance = attendance.filter((r: AttendanceRecord) => r.workerId === labourWorker?.id);
    const workerPayments = payments.filter((p: any) => p.workerId === labourWorker?.id);

    const monthlyPresent = labourAttendance.filter((r: AttendanceRecord) => r.status === 'Present' && r.date.startsWith(currentMonth)).length;
    const monthlyHalf = labourAttendance.filter((r: AttendanceRecord) => r.status === 'Half-Day' && r.date.startsWith(currentMonth)).length;

    let grossWage = 0;
    labourAttendance.filter((r: AttendanceRecord) => r.date.startsWith(currentMonth)).forEach((att: AttendanceRecord) => {
      if (att.status === 'Present') grossWage += labourWorker.dailyWage;
      else if (att.status === 'Half-Day') grossWage += labourWorker.dailyWage * 0.5;
      if (att.overtimeHours > 0) grossWage += att.overtimeHours * labourWorker.overtimeRate;
      if (att.isNightShift) grossWage += appConfig.nightShiftAllowance;
    });

    const receivedWage = workerPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const pendingWage = Math.max(0, grossWage - receivedWage);

    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-12">
        {/* Banner */}
        <motion.div variants={slideUp} className="relative overflow-hidden border-b border-border pb-10">
          <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4 mix-blend-overlay pointer-events-none">
            <HardHat className="w-56 h-56 text-shockingly-green" />
          </div>
          <div className="relative z-10">
            <PageHeader
              eyebrow="my muster card"
              eyebrowColor="text-shockingly-green"
              title={`${getGreeting()}, ${labourWorker?.name}!`}
              description="Here is your digital Muster Card summary for this month."
            />
            <div className="mt-8 flex flex-wrap gap-3 text-[12px] font-semibold tracking-wider uppercase">
              <span className="bg-card border border-border px-5 py-2 rounded-full text-surface-cream">Site: {sites.find(s => s.id === labourWorker?.currentSiteId)?.name}</span>
              <span className="bg-card border border-border px-5 py-2 rounded-full text-surface-cream">Daily Wage: {formatCurrency(labourWorker?.dailyWage || 0)}</span>
              <span className="bg-card border border-border px-5 py-2 rounded-full text-surface-cream">Trade: {labourWorker?.trade}</span>
            </div>
          </div>
        </motion.div>

        {/* Labour Metrics */}
        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Present Days', value: monthlyPresent, sub: 'Status: Regular' },
            { label: 'Half Days', value: monthlyHalf, sub: `${currentMonthLabel} logs` },
            { label: 'Gross Wages Earned', value: formatCurrency(grossWage), sub: 'Based on attendance' },
            { label: 'Pending Balance', value: formatCurrency(pendingWage), sub: 'To be paid by site admin', accent: true },
          ].map((stat, i) => (
            <StatCard
              key={i}
              label={stat.label}
              value={stat.value}
              sub={stat.sub}
              accent={stat.accent}
            />
          ))}
        </motion.div>

        {/* Muster Card Table */}
        <motion.div variants={slideUp}>
          <Card className="border border-border overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-border">
              <CardTitle className="text-[22px] font-semibold">Recent Attendance Logs</CardTitle>
              <button
                onClick={() => navigate('/leaves')}
                className="text-[13px] font-semibold text-surface-cream px-4 py-2 rounded-full btn-ghost-pill transition-all"
              >
                Request Leave
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-surface-50 font-semibold text-[11px] uppercase tracking-[0.1em]">
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Night Shift</th>
                      <th className="py-4 px-6">OT Hours</th>
                      <th className="py-4 px-6 text-right">Estimated Wage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {labourAttendance.slice(-10).reverse().map((rec: AttendanceRecord) => {
                      let wage = 0;
                      if (rec.status === 'Present') wage += labourWorker.dailyWage;
                      else if (rec.status === 'Half-Day') wage += labourWorker.dailyWage * 0.5;
                      if (rec.overtimeHours > 0) wage += rec.overtimeHours * labourWorker.overtimeRate;
                      if (rec.isNightShift) wage += appConfig.nightShiftAllowance;

                      return (
                        <motion.tr whileHover={{ backgroundColor: 'var(--color-card)' }} key={rec.id} className="transition-colors">
                          <td className="py-4 px-6 font-semibold text-surface-cream">{rec.date}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              rec.status === 'Present' ? 'bg-fn-success/10 text-fn-success' :
                              rec.status === 'Half-Day' ? 'bg-fn-warning/10 text-fn-warning' :
                              'bg-fn-error/10 text-fn-error'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-surface-50 font-medium">{rec.isNightShift ? `Yes (+${formatCurrency(appConfig.nightShiftAllowance)})` : 'No'}</td>
                          <td className="py-4 px-6 font-medium text-surface-cream">{rec.overtimeHours > 0 ? `${rec.overtimeHours} hrs` : '-'}</td>
                          <td className="py-4 px-6 text-right font-bold text-surface-cream">{formatCurrency(wage)}</td>
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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-12">

      {/* Welcome Banner */}
      <motion.div variants={slideUp} className="relative overflow-hidden border-b border-border pb-10">
        <div className="absolute right-0 top-0 opacity-5 translate-x-4 -translate-y-4 mix-blend-overlay pointer-events-none">
          <HardHat className="w-56 h-56 text-shockingly-green" />
        </div>
        <div className="relative z-10">
          <PageHeader
            eyebrow="dashboard"
            eyebrowColor="text-shockingly-green"
            title={`${getGreeting()}, ${currentUser?.name || 'User'}!`}
            description="Real-time overview of labor attendance, muster card balances, and payments flow."
          />
          <div className="mt-8 flex flex-wrap gap-3 text-[12px] font-semibold uppercase tracking-wider">
            <span className="bg-card border border-border px-5 py-2 rounded-full text-surface-cream">Current Site: {sites.find(s => s.id === activeSiteId)?.name}</span>
            <span className="bg-card border border-primary/40 px-5 py-2 rounded-full text-shockingly-green">GSTIN Status: Registered</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('totalWorkers'), value: totalSiteWorkers, sub: 'Registered under active site', icon: <Users className="w-5 h-5" /> },
          { label: t('presentToday'), value: isAttendanceMarkedToday ? presentCount : 0, max: totalSiteWorkers, sub: isAttendanceMarkedToday ? `${presentCount} Present • ${halfDayCount} Half` : 'No records yet', icon: <UserCheck className="w-5 h-5" />, accent: true },
          { label: 'Earned Wages', value: formatCurrency(totalWages), sub: `Gross cost for active site (${currentMonthLabel})`, icon: <IndianRupee className="w-5 h-5" /> },
          { label: t('pendingWages'), value: formatCurrency(pendingWages), sub: 'Awaiting bank/cash logs', icon: <Coins className="w-5 h-5" /> },
        ].map((stat, i) => (
          <StatCard
            key={i}
            label={stat.label}
            value={<>{stat.value}{stat.max !== undefined && <span className="text-[24px] font-medium text-surface-50 ml-1">/ {stat.max}</span>}</>}
            sub={stat.sub}
            icon={stat.icon}
            accent={stat.accent}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Attendance Breakdown SVG Chart */}
        <motion.div variants={slideUp} className="lg:col-span-2">
          <Card className="h-full border border-border">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-[22px] font-semibold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-shockingly-green" />
                {t('attendanceTrend')} <span className="text-[13px] text-surface-50 font-normal uppercase tracking-wide ml-2">(Past 5 Days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="mt-8 h-60 w-full relative">
                <svg viewBox="0 0 500 220" className="w-full h-full text-[11px] font-medium">
                  <defs>
                    <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fffce1" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#fffce1" stopOpacity="0.12" />
                    </linearGradient>
                    <linearGradient id="absentGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#42433d" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#42433d" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  <line x1="40" y1="20" x2="480" y2="20" stroke="#42433d" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="40" y1="70" x2="480" y2="70" stroke="#42433d" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="40" y1="120" x2="480" y2="120" stroke="#42433d" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="#42433d" strokeWidth="0.5" />

                  <text x="10" y="24" className="fill-surface-50">100%</text>
                  <text x="10" y="74" className="fill-surface-50">75%</text>
                  <text x="10" y="124" className="fill-surface-50">50%</text>
                  <text x="10" y="174" className="fill-surface-50">0%</text>

                  {/* Bars */}
                  {chartData.map((day, i) => {
                    const presentH = chartScale(day.present);
                    const absentH = chartScale(day.absent);
                    const x = chartX[i];
                    return (
                      <g key={day.date}>
                        {presentH > 0 && (
                          <rect x={x} y={170 - presentH} width="28" height={presentH} rx="6" fill="url(#barGlow)" className="cursor-pointer hover:opacity-90 transition-opacity">
                            <title>{day.present} present</title>
                          </rect>
                        )}
                        {absentH > 0 && (
                          <rect x={x + 32} y={170 - absentH} width="10" height={absentH} rx="3" fill="url(#absentGlow)">
                            <title>{day.absent} absent</title>
                          </rect>
                        )}
                        <text x={x + 2} y="195" className="fill-surface-50 uppercase tracking-wider font-semibold">{day.label}</text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute right-4 bottom-14 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-widest text-surface-50">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-surface-cream rounded-full" /> Present</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-surface-25 rounded-full" /> Absent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div variants={slideUp}>
          <Card className="h-full flex flex-col border border-border">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-[22px] font-semibold">{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 flex-1 flex flex-col justify-between">
              <div className="flex flex-col gap-4 mt-6">
                {[
                  { id: 'attendance', label: t('markAttendance'), desc: 'Record shifts, Night hours, and OT', icon: ClipboardCheck },
                  { id: 'workers', label: t('addWorker'), desc: 'Add Aadhaar, Pan, and Daily Wages', icon: Users },
                  { id: 'payments', label: t('processPayout'), desc: 'Calculate net wages & register signatures', icon: IndianRupee },
                ].map(action => (
                  <button
                    key={action.id}
                    onClick={() => navigate(`/${action.id}`)}
                    className="group w-full flex items-center justify-between p-5 rounded-[8px] border border-border bg-card hover:bg-muted text-left transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-12 h-12 rounded-full border border-border text-surface-cream flex items-center justify-center shrink-0 group-hover:border-primary/50 group-hover:text-shockingly-green transition-colors">
                        <action.icon className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-[15px] font-bold text-surface-cream">{action.label}</p>
                        <p className="text-[13px] text-surface-50 mt-1 leading-normal">{action.desc}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-surface-50 group-hover:text-surface-cream group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </button>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-[8px] border border-border bg-muted text-[11px] uppercase tracking-widest text-surface-50 text-center font-semibold">
                {currentMonthLabel} billing cycle ends in <span className="font-bold text-surface-cream">{(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate(); })()} days</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Audit Logs */}
        <motion.div variants={slideUp} className="lg:col-span-2">
          <Card className="h-full border border-border">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-[22px] font-semibold flex items-center gap-2">
                <Clock className="w-6 h-6 text-shockingly-green" />
                {t('recentActivities')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
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
                            <span className="h-10 w-10 rounded-full bg-card flex items-center justify-center shrink-0 ring-4 ring-just-black border border-border">
                              <Clock className="w-4 h-4 text-surface-cream" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-2 flex justify-between space-x-4">
                            <div>
                              <p className="text-[14px] font-semibold text-surface-cream leading-relaxed">{log.details}</p>
                            </div>
                            <div className="text-right text-[11px] uppercase tracking-widest font-bold text-surface-50/80 whitespace-nowrap pt-0.5">
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
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-[22px] font-semibold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-shockingly-green" />
                {t('sites')} Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="space-y-4 mt-6">
                {sites.map(site => (
                  <div key={site.id} className="group flex items-center justify-between p-5 rounded-[8px] border border-border bg-card hover:bg-muted transition-all duration-300">
                    <div>
                      <h4 className="text-[15px] font-bold text-surface-cream truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[250px] md:max-w-[150px] lg:max-w-[200px] xl:max-w-xs">{site.name}</h4>
                      <p className="text-[13px] text-surface-50 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[250px] md:max-w-[150px] lg:max-w-[200px] xl:max-w-xs mt-1 leading-normal">{site.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        site.status === 'active' ? 'bg-fn-success/10 text-fn-success' :
                        site.status === 'on-hold' ? 'bg-fn-warning/10 text-fn-warning' :
                        'bg-muted text-surface-50'
                      }`}>
                        {site.status}
                      </span>
                      <p className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mt-2">{site.workersCount} Workers</p>
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
