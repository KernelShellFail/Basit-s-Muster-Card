import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Calendar, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  User,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AttendanceRecord, LabourSubmission, Worker } from '../../services/db';

export const CrossCheck = () => {
  const { 
    workers, 
    sites, 
    attendance, 
    labourSubmissions, 
    saveAttendance, 
    currentLanguage 
  } = useAppStore();
  
  const { t } = useTranslation(currentLanguage);

  // States
  const [selectedDate, setSelectedDate] = useState('2026-07-04'); // defaults to seeded day
  const [selectedSiteId, setSelectedSiteId] = useState('site-01');
  const [statusFilter, setStatusFilter] = useState<'All' | 'match' | 'mismatch' | 'pending'>('All');

  // Resolution Modal State
  const [resolvingDiscrepancy, setResolvingDiscrepancy] = useState<{
    roster: AttendanceRecord;
    claim: LabourSubmission;
    worker: Worker;
  } | null>(null);

  // Filter workers mapped to selected site
  const siteWorkers = workers.filter(w => w.currentSiteId === selectedSiteId && w.status === 'Active');

  // Compare roster logs vs labour claims
  const comparisonList = siteWorkers.map(worker => {
    const roster = attendance.find(a => a.workerId === worker.id && a.date === selectedDate);
    const claim = labourSubmissions.find(c => c.workerId === worker.id && c.date === selectedDate);
    
    let comparisonStatus: 'match' | 'mismatch' | 'pending' = 'pending';
    
    if (roster && claim) {
      const match = roster.status === claim.status && 
                    roster.overtimeHours === claim.overtimeHours && 
                    roster.isNightShift === claim.isNightShift;
      comparisonStatus = match ? 'match' : 'mismatch';
    }

    return {
      worker,
      roster,
      claim,
      status: comparisonStatus
    };
  });

  // Filter based on selected verification status
  const filteredList = comparisonList.filter(item => {
    if (statusFilter === 'All') return true;
    return item.status === statusFilter;
  });

  // Counts
  const matchesCount = comparisonList.filter(c => c.status === 'match').length;
  const mismatchCount = comparisonList.filter(c => c.status === 'mismatch').length;
  const pendingCount = comparisonList.filter(c => c.status === 'pending').length;

  // Handle resolving a mismatch
  const handleResolve = async (source: 'roster' | 'claim') => {
    if (!resolvingDiscrepancy) return;
    
    const { roster, claim, worker } = resolvingDiscrepancy;
    const resolvedStatus = source === 'roster' ? roster.status : claim.status;
    const resolvedOT = source === 'roster' ? roster.overtimeHours : claim.overtimeHours;
    const resolvedNight = source === 'roster' ? roster.isNightShift : claim.isNightShift;

    // Build the resolved record
    const updatedRecord: AttendanceRecord = {
      ...roster,
      status: resolvedStatus,
      overtimeHours: resolvedOT,
      isNightShift: resolvedNight,
      remarks: `Resolved Mismatch: Accepted ${source === 'roster' ? 'Supervisor' : 'Labour self-claim'} entry.`
    };

    // Save update to official attendance log
    await saveAttendance([updatedRecord]);
    
    showToast(`Verification complete. Accepted ${source === 'roster' ? "supervisor's" : "worker's"} claim for ${worker.name}.`, 'success');
    setResolvingDiscrepancy(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-construction-850 dark:text-white">Muster Cross-Check</h1>
          <p className="text-xs text-construction-500 mt-1">Cross-examine official supervisor logs against self-submitted work claims from labours.</p>
        </div>
      </div>

      {/* Date & Site Filter Controls */}
      <div className="p-4.5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-850 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Date Selector */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-construction-450 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white focus:outline-none"
          />
        </div>

        {/* Site Selector */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <MapPin className="w-4.5 h-4.5 text-safety-500 shrink-0" />
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white focus:outline-none"
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Verification Status Filter */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <span className="text-[10px] font-bold text-construction-400 uppercase">Verification Filter</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white focus:outline-none"
          >
            <option value="All">All Entries ({comparisonList.length})</option>
            <option value="match">Verified Matches ({matchesCount})</option>
            <option value="mismatch">Discrepancies ({mismatchCount})</option>
            <option value="pending">Pending Claim ({pendingCount})</option>
          </select>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-500 block">Verified Matches</span>
            <span className="text-sm font-black">{matchesCount} Workers</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-red-100 dark:border-red-950/25 bg-red-500/5 text-red-700 dark:text-red-400 flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 block">Mismatched Discrepancies</span>
            <span className="text-sm font-black">{mismatchCount} Alerts</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-650 dark:text-construction-350 flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-construction-400 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold block">Pending Self-Submit</span>
            <span className="text-sm font-black">{pendingCount} Workers</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="rounded-2xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-construction-50 dark:bg-construction-850/40 text-construction-500 font-extrabold uppercase border-b border-construction-150 dark:border-construction-800">
                <th className="p-4">Worker Profile</th>
                <th className="p-4">Roster (Supervisor Log)</th>
                <th className="p-4">Self-Claim (Labour Log)</th>
                <th className="p-4">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construction-100 dark:divide-construction-800/40">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-construction-450 font-medium">
                    No matching records found for the selected filter date and criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.worker.id} className="hover:bg-construction-50/50 dark:hover:bg-construction-800/20 transition-colors">
                    {/* Worker Details */}
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-construction-100 dark:bg-construction-800 text-construction-800 dark:text-white flex items-center justify-center font-bold text-[10px]">
                        {item.worker.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-construction-850 dark:text-white leading-tight">{item.worker.name}</p>
                        <p className="text-[10px] text-construction-500 font-semibold mt-0.5">{item.worker.id} • {item.worker.trade}</p>
                      </div>
                    </td>

                    {/* Supervisor Entry */}
                    <td className="p-4">
                      {item.roster ? (
                        <div className="space-y-1">
                          <p className="font-bold text-construction-800 dark:text-white">{item.roster.status}</p>
                          <p className="text-[10px] text-construction-500 font-semibold">
                            {item.roster.overtimeHours}h OT • {item.roster.isNightShift ? 'Night Shift' : 'Day Shift'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-construction-400 font-medium italic">Not Marked</span>
                      )}
                    </td>

                    {/* Labour self claim */}
                    <td className="p-4">
                      {item.claim ? (
                        <div className="space-y-1">
                          <p className="font-bold text-construction-800 dark:text-white">{item.claim.status}</p>
                          <p className="text-[10px] text-construction-500 font-semibold">
                            {item.claim.overtimeHours}h OT • {item.claim.isNightShift ? 'Night Shift' : 'Day Shift'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-construction-400 font-medium italic">Pending Self-Submit</span>
                      )}
                    </td>

                    {/* Status badges & Resolution Actions */}
                    <td className="p-4">
                      {item.status === 'match' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified Match
                        </span>
                      )}
                      
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Awaiting Claim
                        </span>
                      )}

                      {item.status === 'mismatch' && (
                        <button
                          onClick={() => setResolvingDiscrepancy({
                            roster: item.roster!,
                            claim: item.claim!,
                            worker: item.worker
                          })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                          Resolve Discrepancy
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrepancy Resolution Modal */}
      {resolvingDiscrepancy && (
        <div className="fixed inset-0 z-50 bg-construction-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-2xl p-6 relative">
            
            <h3 className="text-sm font-black text-construction-850 dark:text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-safety-500" />
              Resolve Muster Discrepancy
            </h3>
            <p className="text-[11px] text-construction-500 mb-6">
              Compare the logged hours for <strong>{resolvingDiscrepancy.worker.name}</strong> on <strong>{selectedDate}</strong>. Select the entry to set as the official database record.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              
              {/* Option A: Supervisor */}
              <button
                onClick={() => handleResolve('roster')}
                className="p-4 text-left border border-construction-250 dark:border-construction-800 hover:border-safety-500 dark:hover:border-safety-500 bg-construction-50/50 dark:bg-construction-950/40 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <span className="text-[9px] uppercase font-bold text-construction-400 block mb-1">Entry A</span>
                  <h4 className="text-xs font-black text-construction-800 dark:text-white">Supervisor Roster</h4>
                </div>
                <div className="mt-4 text-[11px] space-y-1 text-construction-650 dark:text-construction-350">
                  <p><strong>Status:</strong> {resolvingDiscrepancy.roster.status}</p>
                  <p><strong>Overtime:</strong> {resolvingDiscrepancy.roster.overtimeHours} hours</p>
                  <p><strong>Shift:</strong> {resolvingDiscrepancy.roster.isNightShift ? 'Night' : 'Day'}</p>
                </div>
                <span className="mt-4 w-full py-1.5 rounded-lg bg-white dark:bg-construction-900 text-[10px] font-bold text-center border border-construction-200 dark:border-construction-800 text-construction-700 dark:text-construction-300 group-hover:bg-safety-500 group-hover:text-construction-950 group-hover:border-safety-500 transition-colors">
                  Accept Entry A
                </span>
              </button>

              {/* Option B: Labour */}
              <button
                onClick={() => handleResolve('claim')}
                className="p-4 text-left border border-construction-250 dark:border-construction-800 hover:border-safety-500 dark:hover:border-safety-500 bg-construction-50/50 dark:bg-construction-950/40 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <span className="text-[9px] uppercase font-bold text-construction-400 block mb-1">Entry B</span>
                  <h4 className="text-xs font-black text-construction-800 dark:text-white">Labour Claim</h4>
                </div>
                <div className="mt-4 text-[11px] space-y-1 text-construction-650 dark:text-construction-350">
                  <p><strong>Status:</strong> {resolvingDiscrepancy.claim.status}</p>
                  <p><strong>Overtime:</strong> {resolvingDiscrepancy.claim.overtimeHours} hours</p>
                  <p><strong>Shift:</strong> {resolvingDiscrepancy.claim.isNightShift ? 'Night' : 'Day'}</p>
                </div>
                <span className="mt-4 w-full py-1.5 rounded-lg bg-white dark:bg-construction-900 text-[10px] font-bold text-center border border-construction-200 dark:border-construction-800 text-construction-700 dark:text-construction-300 group-hover:bg-safety-500 group-hover:text-construction-950 group-hover:border-safety-500 transition-colors">
                  Accept Entry B
                </span>
              </button>

            </div>

            <div className="flex justify-end pt-3 border-t border-construction-150 dark:border-construction-800/40">
              <button
                onClick={() => setResolvingDiscrepancy(null)}
                className="px-4 py-2 border border-construction-250 dark:border-construction-800 rounded-xl text-xs font-bold text-construction-600 dark:text-construction-350 hover:bg-construction-50 dark:hover:bg-construction-950 transition-colors"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
