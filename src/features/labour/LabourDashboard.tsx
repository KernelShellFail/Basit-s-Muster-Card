import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { showToast } from '../../components/Toast';
import { 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  CalendarRange,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { AttendanceStatus } from '../../services/db';
import { appConfig, formatCurrency } from '../../config/appConfig';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { StatCard } from '../../components/ui/StatCard';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { motion } from 'framer-motion';
import { slideUp, staggerContainer } from '../../utils/animations';

import { 
  useWorkers, 
  useAttendance, 
  usePayments, 
  useLabourSubmissions, 
  useSubmitLabourAttendance 
} from '../../api/queries';

export const LabourDashboard = () => {
  const { 
    currentUser
  } = useAppStore();
  
  const { data: workers = [] } = useWorkers();
  const { data: attendance = [] } = useAttendance();
  const { data: payments = [] } = usePayments();
  const { data: labourSubmissions = [] } = useLabourSubmissions();
  const { mutateAsync: submitLabourAttendance } = useSubmitLabourAttendance();

  // Find linked worker profile
  const workerProfile = workers.find(w => w.id === currentUser?.workerId);

  // Calendar context (current month)
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const currentMonthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(now.getFullYear(), now.getMonth(), 1).getDay(); // 0=Sun
  const paddedStart = (firstWeekday + 6) % 7; // 0=Mon

  // Form claim states
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [claimStatus, setClaimStatus] = useState<AttendanceStatus>('Present');
  const [isNightShift, setIsNightShift] = useState(false);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  if (!workerProfile) {
    return (
      <div className="p-10 text-center border border-border bg-card rounded-[8px] max-w-lg mx-auto mt-12 space-y-4">
        <ShieldAlert className="w-12 h-12 text-fn-error mx-auto" />
        <h3 className="text-sm font-semibold text-surface-cream">Profile Mapping Discrepancy</h3>
        <p className="text-xs text-surface-50 leading-relaxed">
          This login account is not linked to any active worker profile. Please contact your Organization Owner to link your profile.
        </p>
      </div>
    );
  }

  // Filter attendance logs for current labour
  const myRosterLogs = attendance.filter(a => a.workerId === workerProfile.id && a.date.startsWith(currentMonth));
  const myClaims = labourSubmissions.filter(s => s.workerId === workerProfile.id && s.date.startsWith(currentMonth));

  // Handler for submitting claim
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const claimId = `claim-${workerProfile.id}-${claimDate}`;
    const claim = {
      id: claimId,
      workerId: workerProfile.id,
      date: claimDate,
      status: claimStatus,
      isNightShift,
      overtimeHours,
      remarks,
      createdAt: new Date().toISOString()
    };

    await submitLabourAttendance(claim);
    setLoading(false);
    showToast('Your work claim has been self-submitted successfully!', 'success');
    
    // Reset inputs
    setRemarks('');
    setOvertimeHours(0);
    setIsNightShift(false);
  };

  // Compute Ramesh stats
  const presentsCount = myRosterLogs.filter(r => r.status === 'Present').length;
  const halfDaysCount = myRosterLogs.filter(r => r.status === 'Half-Day').length;
  const totalVerifiedOT = myRosterLogs.reduce((sum, r) => sum + r.overtimeHours, 0);

  const baseWages = workerProfile.dailyWage * (presentsCount + 0.5 * halfDaysCount);
  const otWages = totalVerifiedOT * workerProfile.overtimeRate;
  const nightWages = myRosterLogs.filter(r => r.isNightShift).length * appConfig.nightShiftAllowance;
  const totalVerifiedEarnings = baseWages + otWages + nightWages;

  const totalReceived = payments
    .filter(p => p.workerId === workerProfile.id && p.date.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  const balanceDue = Math.max(0, totalVerifiedEarnings - totalReceived);

  const fieldClass = "w-full h-12 text-[14px] px-4 border border-border bg-background text-surface-cream rounded-[8px] focus:outline-none focus:ring-1 focus:ring-surface-cream/30 transition-shadow";

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-12">
      
      {/* Welcome Banner */}
      <motion.div variants={slideUp} className="relative overflow-hidden border-b border-border pb-10">
        <div className="absolute top-[-40%] right-[-10%] w-60 h-60 rounded-full bg-shockingly-green/10 blur-[80px]" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="min-w-0">
            <Eyebrow text="labour portal" color="text-orangey" />
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-[64px] font-semibold tracking-[-0.02em] leading-[1] text-surface-cream">
              Hello, {workerProfile.name}!
            </h1>
            <p className="text-[16px] text-surface-50 mt-4 font-medium">Worker ID: {workerProfile.id} • Trade: {workerProfile.trade} • Skill: {workerProfile.skillLevel}</p>
          </div>
          
          <div className="flex gap-3 shrink-0 text-[11px] font-semibold uppercase tracking-wider">
            <div className="px-5 py-3 border border-border bg-card rounded-[8px]">
              <span className="text-[11px] text-surface-50 block mb-1">DAILY RATE</span>
              <span className="font-bold text-surface-cream text-sm">{formatCurrency(workerProfile.dailyWage)} / day</span>
            </div>
            <div className="px-5 py-3 border border-border bg-card rounded-[8px]">
              <span className="text-[11px] text-surface-50 block mb-1">OVERTIME RATE</span>
              <span className="font-bold text-surface-cream text-sm">{formatCurrency(workerProfile.overtimeRate)} / hr</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid: Tally Metric Counters */}
      <motion.div variants={staggerContainer} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Verified Presents', value: `${presentsCount} Days` },
          { label: 'Verified OT Hours', value: `${totalVerifiedOT} Hrs` },
          { label: 'Total Earnings (verified)', value: formatCurrency(totalVerifiedEarnings) },
          { label: 'Remaining Balance', value: formatCurrency(balanceDue), accent: true },
        ].map((stat, i) => (
          <StatCard
            key={i}
            label={stat.label}
            value={stat.value}
            accent={stat.accent}
          />
        ))}
      </motion.div>

      {/* Wage Calculation Breakdown Formula Alert */}
      <motion.div variants={slideUp}>
        <div className="p-5 rounded-[8px] border border-border bg-card text-[12px] text-surface-50 font-medium space-y-1 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5 text-surface-cream mb-1">
            <HelpCircle className="w-5 h-5 text-surface-50" />
            Wages Tally Formula (कमाई की गणना का सूत्र):
          </p>
          <p className="pl-6 text-[11px]">
            Verified Wages = <span className="font-semibold text-surface-cream">(Presents × {formatCurrency(workerProfile.dailyWage)})</span> + <span className="font-semibold text-surface-cream">(OT Hours × {formatCurrency(workerProfile.overtimeRate)})</span> + <span className="font-semibold text-surface-cream">(Night Shifts × {formatCurrency(appConfig.nightShiftAllowance)})</span>
          </p>
        </div>
      </motion.div>

      {/* Split layout: Claim form and comparison logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Attendance Self-Submit Form */}
        <motion.div variants={slideUp} className="lg:col-span-1 p-8 rounded-[8px] bg-card border border-border space-y-6">
          <h3 className="text-[18px] font-semibold text-surface-cream flex items-center gap-2 border-b border-border pb-4">
            <CalendarRange className="w-5 h-5 text-orangey" />
            Submit Daily Claim
          </h3>

          <form onSubmit={handleClaimSubmit} className="space-y-5 text-xs">
            <DatePicker
              label="Select Date *"
              required
              value={claimDate}
              onChange={setClaimDate}
            />

            <div>
              <label className="text-[11px] font-bold text-surface-50 uppercase tracking-[0.1em] block mb-2">My Status *</label>
              <select
                value={claimStatus}
                onChange={(e: any) => setClaimStatus(e.target.value)}
                className={`${fieldClass} cursor-pointer`}
              >
                <option value="Present">Present (उपस्थित)</option>
                <option value="Half-Day">Half Day (आधा दिन)</option>
                <option value="Absent">Absent (अनुपस्थित)</option>
                <option value="Paid-Leave">Paid Leave (सवैतनिक अवकाश)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              {/* Overtime */}
              <div>
                <label className="text-[11px] font-bold text-surface-50 uppercase tracking-[0.1em] block mb-2">OT Hours (अतिरिक्त घंटे)</label>
                <select
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  className={`${fieldClass} cursor-pointer`}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(h => (
                    <option key={h} value={h}>{h} Hours</option>
                  ))}
                </select>
              </div>

              {/* Night Shift Toggle */}
              <div>
                <label className="text-[11px] font-bold text-surface-50 uppercase tracking-[0.1em] block mb-2">Night Shift (नाइट शिफ्ट)</label>
                <button
                  type="button"
                  onClick={() => setIsNightShift(!isNightShift)}
                  className={`w-full py-3 rounded-[8px] border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isNightShift
                      ? 'bg-surface-cream text-just-black border-surface-cream'
                      : 'border-border text-surface-50 hover:bg-muted'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {isNightShift ? 'Yes' : 'No'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-surface-50 uppercase tracking-[0.1em] block mb-2">Work Remarks (कार्य विवरण)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Describe what you worked on today..."
                rows={3}
                className={fieldClass}
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-4 text-xs font-semibold"
            >
              Submit Work Claim
            </Button>
          </form>
        </motion.div>

        {/* Right Side: Calendar & Compare Sheets */}
        <motion.div variants={slideUp} className="lg:col-span-2 p-8 rounded-[8px] bg-card border border-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
            <h3 className="text-[18px] font-semibold text-surface-cream flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orangey" />
              {currentMonthLabel} Verification Sheet
            </h3>
            
            {/* Legend indicators */}
            <div className="flex flex-wrap gap-3 text-[11px] font-bold tracking-wide uppercase">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-fn-success" /> Matches</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-fn-error" /> Mismatch</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-surface-25 border border-border" /> No Claim</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2.5 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-[11px] font-bold text-surface-50 uppercase tracking-widest py-1">{day}</div>
            ))}
            
            {/* Padding to align the first day of the month */}
            {[...Array(paddedStart)].map((_, i) => <div key={`pad-${i}`} className="py-2.5" />)}

            {[...Array(daysInMonth)].map((_, i) => {
              const dayNumber = i + 1;
              const dateStr = `${currentMonth}-${dayNumber.toString().padStart(2, '0')}`;
              
              const roster = myRosterLogs.find(r => r.date === dateStr);
              const claim = myClaims.find(s => s.date === dateStr);
              
              let statusColor = 'border-border bg-background';
              let verifyIcon = null;

              if (roster && claim) {
                const matchStatus = roster.status === claim.status && 
                                    roster.overtimeHours === claim.overtimeHours && 
                                    roster.isNightShift === claim.isNightShift;
                if (matchStatus) {
                  statusColor = 'bg-fn-success/10 border-fn-success/40 text-fn-success';
                  verifyIcon = <CheckCircle2 className="w-4 h-4 text-fn-success absolute top-1.5 right-1.5" />;
                } else {
                  statusColor = 'bg-fn-error/10 border-fn-error/30 text-fn-error';
                  verifyIcon = <AlertTriangle className="w-4 h-4 text-fn-error absolute top-1.5 right-1.5 animate-pulse" />;
                }
              } else if (roster && !claim) {
                // Official marked, but labour haven't self-claimed
                statusColor = 'bg-background border-border';
              } else if (!roster && claim) {
                // Claimed, but official attendance not marked
                statusColor = 'bg-orangey/5 border-orangey/30';
              }

              return (
                <div 
                  key={i}
                  className={`p-3.5 rounded-[8px] border flex flex-col justify-between items-start min-h-[72px] relative ${statusColor} group transition-all`}
                >
                  <span className="text-[11px] font-bold">{dayNumber}</span>
                  {verifyIcon}

                  {/* Summary details */}
                  <div className="w-full text-[8.5px] font-bold text-left leading-tight mt-2.5 space-y-1">
                    {roster && (
                      <p className="truncate text-surface-cream/80" title="Official Supervisor check">
                        R: {roster.status === 'Present' ? `P (${roster.overtimeHours}h OT)` : roster.status.slice(0, 4)}
                      </p>
                    )}
                    {claim && (
                      <p className="opacity-80 truncate text-surface-50" title="Self submission check">
                        S: {claim.status === 'Present' ? `P (${claim.overtimeHours}h OT)` : claim.status.slice(0, 4)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
