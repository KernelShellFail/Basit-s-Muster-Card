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
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

import { 
  useWorkers, 
  useSites, 
  useAttendance, 
  useLabourSubmissions, 
  useUpdateAttendance 
} from '../../api/queries';

export const CrossCheck = () => {
  const { 
    currentLanguage 
  } = useAppStore();
  
  const { data: workers = [] } = useWorkers();
  const { data: sites = [] } = useSites();
  const { data: attendance = [] } = useAttendance();
  const { data: labourSubmissions = [] } = useLabourSubmissions();
  const { mutateAsync: saveAttendance } = useUpdateAttendance();
  
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
    <div className="flex flex-col gap-[80px]">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[60px] font-medium tracking-[-1.8px] leading-[1] text-foreground">Muster Cross-Check</h1>
          <p className="text-[16px] text-muted-foreground font-medium mt-4">Cross-examine official supervisor logs against self-submitted work claims from labours.</p>
        </div>
      </div>

      {/* Date & Site Filter Controls */}
      <div className="p-8 rounded-[28px] bg-background border border-border flex flex-col md:flex-row gap-6 items-center">
        {/* Date Selector */}
        <div className="w-full md:w-auto flex items-center gap-4">
          <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-[14px] font-medium px-4 py-3 rounded-full border border-border bg-background text-foreground focus:outline-none"
          />
        </div>

        {/* Site Selector */}
        <div className="w-full md:w-auto flex items-center gap-4">
          <MapPin className="w-5 h-5 text-foreground shrink-0" />
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="text-[14px] font-medium px-4 py-3 rounded-full border border-border bg-background text-foreground focus:outline-none"
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Verification Status Filter */}
        <div className="w-full md:w-auto flex items-center gap-4">
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Verification Filter</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-[14px] font-medium px-4 py-3 rounded-full border border-border bg-background text-foreground focus:outline-none"
          >
            <option value="All">All Entries ({comparisonList.length})</option>
            <option value="match">Verified Matches ({matchesCount})</option>
            <option value="mismatch">Discrepancies ({mismatchCount})</option>
            <option value="pending">Pending Claim ({pendingCount})</option>
          </select>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[28px] border border-border bg-background text-foreground flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 shrink-0" />
          <div>
            <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground block">Verified Matches</span>
            <span className="text-[28px] font-medium">{matchesCount} Workers</span>
          </div>
        </div>

        <div className="p-8 rounded-[28px] border border-border bg-muted text-foreground flex items-center gap-4">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground block">Mismatched Discrepancies</span>
            <span className="text-[28px] font-medium">{mismatchCount} Alerts</span>
          </div>
        </div>

        <div className="p-8 rounded-[28px] border border-border bg-background text-foreground flex items-center gap-4">
          <HelpCircle className="w-8 h-8 shrink-0 text-muted-foreground" />
          <div>
            <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground block">Pending Self-Submit</span>
            <span className="text-[28px] font-medium">{pendingCount} Workers</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="rounded-[28px] border border-border bg-background shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-transparent text-[12px] text-muted-foreground font-medium uppercase tracking-[0.1em] border-b border-border">
                <th className="p-6">Worker Profile</th>
                <th className="p-6">Roster (Supervisor Log)</th>
                <th className="p-6">Self-Claim (Labour Log)</th>
                <th className="p-6">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[14px] text-muted-foreground font-medium">
                    No matching records found for the selected filter date and criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.worker.id} className="hover:bg-muted/50 transition-colors">
                    {/* Worker Details */}
                    <td className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border border-border bg-muted text-foreground flex items-center justify-center font-bold text-[14px]">
                        {item.worker.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-[16px] text-foreground leading-tight">{item.worker.name}</p>
                        <p className="text-[12px] text-muted-foreground uppercase tracking-widest font-medium mt-1">{item.worker.id} • {item.worker.trade}</p>
                      </div>
                    </td>

                    {/* Supervisor Entry */}
                    <td className="p-6">
                      {item.roster ? (
                        <div className="space-y-1">
                          <p className="font-medium text-[14px] text-foreground">{item.roster.status}</p>
                          <p className="text-[12px] uppercase tracking-widest text-muted-foreground font-medium">
                            {item.roster.overtimeHours}h OT • {item.roster.isNightShift ? 'Night Shift' : 'Day Shift'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-medium italic">Not Marked</span>
                      )}
                    </td>

                    {/* Labour self claim */}
                    <td className="p-6">
                      {item.claim ? (
                        <div className="space-y-1">
                          <p className="font-medium text-[14px] text-foreground">{item.claim.status}</p>
                          <p className="text-[12px] uppercase tracking-widest text-muted-foreground font-medium">
                            {item.claim.overtimeHours}h OT • {item.claim.isNightShift ? 'Night Shift' : 'Day Shift'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-medium italic">Pending Self-Submit</span>
                      )}
                    </td>

                    {/* Status badges & Resolution Actions */}
                    <td className="p-6">
                      {item.status === 'match' && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-[0.1em] bg-foreground text-background">
                          <CheckCircle className="w-4 h-4" />
                          Verified Match
                        </span>
                      )}
                      
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-[0.1em] bg-muted text-muted-foreground border border-border">
                          <HelpCircle className="w-4 h-4" />
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
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-[0.1em] bg-background text-foreground border border-foreground hover:bg-muted/50 transition-colors"
                        >
                          <AlertTriangle className="w-4 h-4" />
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
      <Modal
        isOpen={!!resolvingDiscrepancy}
        onClose={() => setResolvingDiscrepancy(null)}
        title="Resolve Muster Discrepancy"
        description={resolvingDiscrepancy ? `Compare the logged hours for ${resolvingDiscrepancy.worker.name} on ${selectedDate}. Select the entry to set as the official database record.` : undefined}
      >
        {resolvingDiscrepancy && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Option A: Supervisor */}
              <button
                onClick={() => handleResolve('roster')}
                className="p-6 text-left border border-border hover:border-foreground bg-background rounded-[28px] flex flex-col justify-between transition-all group"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground block mb-2">Entry A</span>
                  <h4 className="text-[16px] font-medium text-foreground">Supervisor Roster</h4>
                </div>
                <div className="mt-6 text-[14px] space-y-2 text-foreground font-medium">
                  <p><strong className="text-muted-foreground font-normal">Status:</strong> {resolvingDiscrepancy.roster.status}</p>
                  <p><strong className="text-muted-foreground font-normal">Overtime:</strong> {resolvingDiscrepancy.roster.overtimeHours} hours</p>
                  <p><strong className="text-muted-foreground font-normal">Shift:</strong> {resolvingDiscrepancy.roster.isNightShift ? 'Night' : 'Day'}</p>
                </div>
                <span className="mt-6 w-full py-3 rounded-full bg-background text-[12px] uppercase tracking-widest font-medium text-center border border-border text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                  Accept Entry A
                </span>
              </button>

              {/* Option B: Labour */}
              <button
                onClick={() => handleResolve('claim')}
                className="p-6 text-left border border-border hover:border-foreground bg-background rounded-[28px] flex flex-col justify-between transition-all group"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground block mb-2">Entry B</span>
                  <h4 className="text-[16px] font-medium text-foreground">Labour Claim</h4>
                </div>
                <div className="mt-6 text-[14px] space-y-2 text-foreground font-medium">
                  <p><strong className="text-muted-foreground font-normal">Status:</strong> {resolvingDiscrepancy.claim.status}</p>
                  <p><strong className="text-muted-foreground font-normal">Overtime:</strong> {resolvingDiscrepancy.claim.overtimeHours} hours</p>
                  <p><strong className="text-muted-foreground font-normal">Shift:</strong> {resolvingDiscrepancy.claim.isNightShift ? 'Night' : 'Day'}</p>
                </div>
                <span className="mt-6 w-full py-3 rounded-full bg-background text-[12px] uppercase tracking-widest font-medium text-center border border-border text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                  Accept Entry B
                </span>
              </button>

            </div>

            <div className="flex justify-end pt-3 border-t border-construction-150 dark:border-construction-800/40">
              <Button
                variant="outline"
                onClick={() => setResolvingDiscrepancy(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
