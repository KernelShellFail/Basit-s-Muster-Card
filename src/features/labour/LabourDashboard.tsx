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
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden border border-slate-800 shadow-md">
        <div className="absolute top-[-40%] right-[-10%] w-60 h-60 rounded-full bg-safety-500/10 blur-[80px]" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <HardHat className="w-6.5 h-6.5 text-safety-500 animate-pulse" />
              Hello, {workerProfile.name}! (नमस्ते)
            </h1>
            <p className="text-xs text-slate-400 mt-1">Worker ID: {workerProfile.id} • Trade: {workerProfile.trade} • Skill: {workerProfile.skillLevel}</p>
          </div>
          
          <div className="flex gap-4 shrink-0 text-xs">
            <div className="px-4 py-2 border border-slate-800 bg-slate-950/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-bold">DAILY RATE (दैनिक दर)</span>
              <span className="font-black text-safety-500 text-sm">₹{workerProfile.dailyWage} / day</span>
            </div>
            <div className="px-4 py-2 border border-slate-800 bg-slate-950/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-bold">OVERTIME RATE (अतिरिक्त कार्य दर)</span>
              <span className="font-black text-safety-500 text-sm">₹{workerProfile.overtimeRate} / hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Tally Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800/80 shadow-sm">
          <p className="text-[10px] font-bold text-construction-450 uppercase tracking-wider">Verified Presents</p>
          <h3 className="text-lg font-black text-construction-850 dark:text-white mt-1">{presentsCount} Days</h3>
        </div>
        <div className="p-4.5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800/80 shadow-sm">
          <p className="text-[10px] font-bold text-construction-450 uppercase tracking-wider">Verified OT Hours</p>
          <h3 className="text-lg font-black text-construction-850 dark:text-white mt-1">{totalVerifiedOT} Hrs</h3>
        </div>
        <div className="p-4.5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800/80 shadow-sm">
          <p className="text-[10px] font-bold text-construction-450 uppercase tracking-wider">Total Earnings (verified)</p>
          <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-500 mt-1">₹{totalVerifiedEarnings}</h3>
        </div>
        <div className="p-4.5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800/80 shadow-sm">
          <p className="text-[10px] font-bold text-construction-450 uppercase tracking-wider">Remaining Balance</p>
          <h3 className="text-lg font-black text-amber-500 mt-1">₹{balanceDue}</h3>
        </div>
      </div>

      {/* Wage Calculation Breakdown Formula Alert */}
      <div className="p-4.5 rounded-2xl border border-sky-100 dark:border-sky-950/25 bg-sky-500/5 text-[11px] text-sky-850 dark:text-sky-350 font-semibold space-y-1 shadow-sm">
        <p className="font-extrabold flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
          <HelpCircle className="w-5 h-5 text-sky-500" />
          Wages Tally Formula (कमाई की गणना का सूत्र):
        </p>
        <p className="pl-5.5 text-construction-550 dark:text-construction-400 text-[10px]">
          Verified Wages = <span className="text-sky-600 dark:text-sky-400 font-bold">(Presents × ₹{workerProfile.dailyWage})</span> + <span className="text-sky-600 dark:text-sky-400 font-bold">(OT Hours × ₹{workerProfile.overtimeRate})</span> + <span className="text-sky-600 dark:text-sky-400 font-bold">(Night Shifts × ₹150)</span>
        </p>
      </div>

      {/* Split layout: Claim form and comparison logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Attendance Self-Submit Form */}
        <div className="lg:col-span-1 p-5 rounded-3xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-construction-850 dark:text-white flex items-center gap-2 border-b border-construction-100 dark:border-construction-800 pb-3">
            <CalendarRange className="w-5 h-5 text-safety-500" />
            Submit Daily Claim (रजा / हाजिरी दावा)
          </h3>

          <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-construction-500 block mb-1">Select Date *</label>
              <input
                type="date"
                required
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-850 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-construction-500 block mb-1">My Status *</label>
              <select
                value={claimStatus}
                onChange={(e: any) => setClaimStatus(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-850 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500"
              >
                <option value="Present">Present (उपस्थित)</option>
                <option value="Half-Day">Half Day (आधा दिन)</option>
                <option value="Absent">Absent (अनुपस्थित)</option>
                <option value="Paid-Leave">Paid Leave (सवैतनिक अवकाश)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              {/* Overtime */}
              <div>
                <label className="text-[10px] font-bold text-construction-500 block mb-1">OT Hours (अतिरिक्त घंटे)</label>
                <select
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-850 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(h => (
                    <option key={h} value={h}>{h} Hours</option>
                  ))}
                </select>
              </div>

              {/* Night Shift Toggle */}
              <div>
                <label className="text-[10px] font-bold text-construction-500 block mb-1.5">Night Shift (नाइट शिफ्ट)</label>
                <button
                  type="button"
                  onClick={() => setIsNightShift(!isNightShift)}
                  className={`w-full py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isNightShift
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                      : 'border-construction-200 dark:border-construction-800 text-construction-500 dark:text-construction-400 hover:bg-construction-50'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  {isNightShift ? 'Yes' : 'No'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-construction-500 block mb-1">Work Remarks (कार्य विवरण)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Describe what you worked on today..."
                rows={2}
                className="w-full text-xs px-3.5 py-2.5 border border-construction-200 dark:border-construction-850 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500"
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 transition-colors shadow-md"
            >
              Submit Work Claim
            </Button>
          </form>
        </div>

        {/* Right Side: Calendar & Compare Sheets */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-construction-100 dark:border-construction-800 pb-3">
            <h3 className="text-xs font-black text-construction-850 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-safety-500" />
              July 2026 Verification Sheet (जुलाई सत्यापन शीट)
            </h3>
            
            {/* Legend indicators */}
            <div className="flex flex-wrap gap-2.5 text-[9px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Matches</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Mismatch</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" /> No Claim</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-[10px] font-extrabold text-construction-400 py-1">{day}</div>
            ))}
            
            {/* Padding July 2026 Wednesday start */}
            {[...Array(3)].map((_, i) => <div key={`pad-${i}`} className="py-2.5" />)}

            {[...Array(31)].map((_, i) => {
              const dayNumber = i + 1;
              const dateStr = `2026-07-${dayNumber.toString().padStart(2, '0')}`;
              
              const roster = myRosterLogs.find(r => r.date === dateStr);
              const claim = myClaims.find(s => s.date === dateStr);
              
              let statusColor = 'border-construction-200 dark:border-construction-800';
              let verifyIcon = null;

              if (roster && claim) {
                const matchStatus = roster.status === claim.status && 
                                    roster.overtimeHours === claim.overtimeHours && 
                                    roster.isNightShift === claim.isNightShift;
                if (matchStatus) {
                  statusColor = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400';
                  verifyIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute top-1 right-1" />;
                } else {
                  statusColor = 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-400';
                  verifyIcon = <AlertTriangle className="w-5 h-5 text-red-500 absolute top-1 right-1 animate-pulse" />;
                }
              } else if (roster && !claim) {
                // Official marked, but labour haven't self-claimed
                statusColor = 'bg-slate-50 dark:bg-construction-950 border-construction-200 dark:border-construction-800';
              } else if (!roster && claim) {
                // Claimed, but official attendance not marked
                statusColor = 'bg-amber-500/5 border-amber-300 dark:border-amber-900/50';
              }

              return (
                <div 
                  key={i}
                  className={`p-2 rounded-xl border flex flex-col justify-between items-start min-h-[64px] relative ${statusColor} group hover:shadow-sm transition-all`}
                >
                  <span className="text-[10px] font-black">{dayNumber}</span>
                  {verifyIcon}

                  {/* Summary details */}
                  <div className="w-full text-[8px] font-bold text-left leading-tight mt-1 space-y-0.5">
                    {roster && (
                      <p className="truncate" title="Official Supervisor check">
                        R: {roster.status === 'Present' ? `P (${roster.overtimeHours}h OT)` : roster.status.slice(0, 4)}
                      </p>
                    )}
                    {claim && (
                      <p className="opacity-80 truncate" title="Self submission check">
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


