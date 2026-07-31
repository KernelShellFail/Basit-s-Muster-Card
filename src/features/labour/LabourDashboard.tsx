import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  HardHat, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  IndianRupee,
  CalendarRange,
  MessageSquare,
  FileCheck2,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { AttendanceStatus } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

import { 
  useWorkers, 
  useAttendance, 
  usePayments, 
  useLabourSubmissions, 
  useSubmitLabourAttendance 
} from '../../api/queries';

export const LabourDashboard = () => {
  const { 
    currentUser, 
    currentLanguage 
  } = useAppStore();
  
  const { data: workers = [] } = useWorkers();
  const { data: attendance = [] } = useAttendance();
  const { data: payments = [] } = usePayments();
  const { data: labourSubmissions = [] } = useLabourSubmissions();
  const { mutateAsync: submitLabourAttendance } = useSubmitLabourAttendance();
  
  const { t } = useTranslation(currentLanguage);

  // Find linked worker profile
  const workerProfile = workers.find(w => w.id === currentUser?.workerId);

  // Form claim states
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [claimStatus, setClaimStatus] = useState<AttendanceStatus>('Present');
  const [isNightShift, setIsNightShift] = useState(false);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  if (!workerProfile) {
    return (
      <div className="p-8 text-center bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 rounded-3xl max-w-lg mx-auto mt-12 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-sm font-black text-construction-850 dark:text-white">Profile Mapping Discrepancy</h3>
        <p className="text-xs text-construction-500 leading-normal">
          This login account is not linked to any active worker profile. Please contact your Organization Owner to link your profile.
        </p>
      </div>
    );
  }

  // Filter attendance logs for Ramesh (or current labour)
  const myRosterLogs = attendance.filter(a => a.workerId === workerProfile.id && a.date.startsWith('2026-07'));
  const myClaims = labourSubmissions.filter(s => s.workerId === workerProfile.id && s.date.startsWith('2026-07'));

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
  const nightWages = myRosterLogs.filter(r => r.isNightShift).length * 150;
  const totalVerifiedEarnings = baseWages + otWages + nightWages;

  const totalReceived = payments
    .filter(p => p.workerId === workerProfile.id && p.date.startsWith('2026-07'))
    .reduce((sum, p) => sum + p.amount, 0);

  const balanceDue = Math.max(0, totalVerifiedEarnings - totalReceived);

  return (
    <div className="space-y-10 md:space-y-16">
      
      {/* Welcome Banner */}
      <div className="p-10 rounded-[32px] bg-gradient-to-br from-card via-card to-background text-foreground relative overflow-hidden border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
        <div className="absolute top-[-40%] right-[-10%] w-60 h-60 rounded-full bg-primary/10 blur-[80px]" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-2xl md:text-[32px] font-medium tracking-tight flex items-center gap-2.5">
              <HardHat className="w-8 h-8 text-foreground" />
              Hello, {workerProfile.name}!
            </h1>
            <p className="text-[14px] text-muted-foreground mt-3 font-medium">Worker ID: {workerProfile.id} • Trade: {workerProfile.trade} • Skill: {workerProfile.skillLevel}</p>
          </div>
          
          <div className="flex gap-3 shrink-0 text-xs font-semibold tracking-wider">
            <div className="px-5 py-3 border border-border/60 bg-background/50 rounded-2xl">
              <span className="text-[9px] text-muted-foreground block mb-1">DAILY RATE</span>
              <span className="font-bold text-foreground text-sm">₹{workerProfile.dailyWage} / day</span>
            </div>
            <div className="px-5 py-3 border border-border/60 bg-background/50 rounded-2xl">
              <span className="text-[9px] text-muted-foreground block mb-1">OVERTIME RATE</span>
              <span className="font-bold text-foreground text-sm">₹{workerProfile.overtimeRate} / hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Tally Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Verified Presents', value: `${presentsCount} Days` },
          { label: 'Verified OT Hours', value: `${totalVerifiedOT} Hrs` },
          { label: 'Total Earnings (verified)', value: `₹${totalVerifiedEarnings}`, textClass: 'text-foreground' },
          { label: 'Remaining Balance', value: `₹${balanceDue}`, textClass: 'text-primary-foreground bg-primary border-primary/20 shadow-[0_4px_15px_-3px_rgba(190,255,80,0.3)]' },
        ].map((stat, i) => (
          <div key={i} className={`p-6.5 rounded-[22px] border bg-card/60 border-border/80 transition-all ${stat.textClass?.includes('bg-primary') ? stat.textClass : ''}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${stat.textClass?.includes('bg-primary') ? 'text-black/60' : 'text-muted-foreground'}`}>{stat.label}</p>
            <h3 className={`text-[22px] sm:text-2xl font-bold mt-2 tracking-tight ${stat.textClass?.includes('bg-primary') ? 'text-black' : (stat.textClass || 'text-foreground')}`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Wage Calculation Breakdown Formula Alert */}
      <div className="p-5 rounded-2xl border border-border/60 bg-card/40 text-[12px] text-muted-foreground font-semibold space-y-1 shadow-sm leading-relaxed">
        <p className="font-bold flex items-center gap-1.5 text-foreground mb-1">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
          Wages Tally Formula (कमाई की गणना का सूत्र):
        </p>
        <p className="pl-6 text-[11px]">
          Verified Wages = <span className="font-bold text-foreground">(Presents × ₹{workerProfile.dailyWage})</span> + <span className="font-bold text-foreground">(OT Hours × ₹{workerProfile.overtimeRate})</span> + <span className="font-bold text-foreground">(Night Shifts × ₹150)</span>
        </p>
      </div>

      {/* Split layout: Claim form and comparison logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Attendance Self-Submit Form */}
        <div className="lg:col-span-1 p-8 rounded-[28px] bg-card border border-border/80 shadow-sm space-y-6">
          <h3 className="text-[18px] font-medium text-foreground flex items-center gap-2 border-b border-border/50 pb-4">
            <CalendarRange className="w-5 h-5 text-foreground" />
            Submit Daily Claim
          </h3>

          <form onSubmit={handleClaimSubmit} className="space-y-5 text-xs">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Select Date *</label>
              <input
                type="date"
                required
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                className="w-full text-sm px-4 py-3 border border-border/80 bg-background text-foreground rounded-xl focus:ring-1 focus:ring-ring focus:outline-none transition-shadow"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">My Status *</label>
              <select
                value={claimStatus}
                onChange={(e: any) => setClaimStatus(e.target.value)}
                className="w-full text-sm px-4 py-3 border border-border/80 bg-background text-foreground rounded-xl focus:ring-1 focus:ring-ring focus:outline-none transition-shadow cursor-pointer"
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">OT Hours (अतिरिक्त घंटे)</label>
                <select
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  className="w-full text-sm px-4 py-3 border border-border/80 bg-background text-foreground rounded-xl focus:ring-1 focus:ring-ring focus:outline-none transition-shadow cursor-pointer"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(h => (
                    <option key={h} value={h}>{h} Hours</option>
                  ))}
                </select>
              </div>

              {/* Night Shift Toggle */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Night Shift (नाइट शिफ्ट)</label>
                <button
                  type="button"
                  onClick={() => setIsNightShift(!isNightShift)}
                  className={`w-full py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isNightShift
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border/80 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {isNightShift ? 'Yes' : 'No'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Work Remarks (कार्य विवरण)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Describe what you worked on today..."
                rows={3}
                className="w-full text-sm px-4 py-3.5 border border-border/80 bg-background text-foreground rounded-xl focus:ring-1 focus:ring-ring focus:outline-none transition-shadow"
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-4 text-xs font-bold shadow-md"
            >
              Submit Work Claim
            </Button>
          </form>
        </div>

        {/* Right Side: Calendar & Compare Sheets */}
        <div className="lg:col-span-2 p-8 rounded-[28px] bg-card border border-border/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-4">
            <h3 className="text-[18px] font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              July 2026 Verification Sheet
            </h3>
            
            {/* Legend indicators */}
            <div className="flex flex-wrap gap-3 text-[10px] font-bold tracking-wide uppercase">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> Matches</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(229,69,69,0.4)]" /> Mismatch</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted border border-border" /> No Claim</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2.5 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-widest py-1">{day}</div>
            ))}
            
            {/* Padding July 2026 Wednesday start */}
            {[...Array(3)].map((_, i) => <div key={`pad-${i}`} className="py-2.5" />)}

            {[...Array(31)].map((_, i) => {
              const dayNumber = i + 1;
              const dateStr = `2026-07-${dayNumber.toString().padStart(2, '0')}`;
              
              const roster = myRosterLogs.find(r => r.date === dateStr);
              const claim = myClaims.find(s => s.date === dateStr);
              
              let statusColor = 'border-border/80 hover:border-foreground/30 bg-background/20';
              let verifyIcon = null;

              if (roster && claim) {
                const matchStatus = roster.status === claim.status && 
                                    roster.overtimeHours === claim.overtimeHours && 
                                    roster.isNightShift === claim.isNightShift;
                if (matchStatus) {
                  statusColor = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400';
                  verifyIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute top-1.5 right-1.5" />;
                } else {
                  statusColor = 'bg-destructive/10 border-destructive/30 text-destructive';
                  verifyIcon = <AlertTriangle className="w-4 h-4 text-destructive absolute top-1.5 right-1.5 animate-pulse" />;
                }
              } else if (roster && !claim) {
                // Official marked, but labour haven't self-claimed
                statusColor = 'bg-background border-border/80';
              } else if (!roster && claim) {
                // Claimed, but official attendance not marked
                statusColor = 'bg-amber-500/5 border-amber-300 dark:border-amber-900/50';
              }

              return (
                <div 
                  key={i}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between items-start min-h-[72px] relative ${statusColor} group hover:shadow-sm transition-all`}
                >
                  <span className="text-[11px] font-bold">{dayNumber}</span>
                  {verifyIcon}

                  {/* Summary details */}
                  <div className="w-full text-[8.5px] font-bold text-left leading-tight mt-2.5 space-y-1">
                    {roster && (
                      <p className="truncate text-foreground/80" title="Official Supervisor check">
                        R: {roster.status === 'Present' ? `P (${roster.overtimeHours}h OT)` : roster.status.slice(0, 4)}
                      </p>
                    )}
                    {claim && (
                      <p className="opacity-80 truncate text-foreground/60" title="Self submission check">
                        S: {claim.status === 'Present' ? `P (${claim.overtimeHours}h OT)` : claim.status.slice(0, 4)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};


