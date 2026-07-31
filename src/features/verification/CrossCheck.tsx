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
    <div className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[60px] font-medium tracking-[-1.8px] leading-[1.1] text-foreground">Muster Cross-Check</h1>
          <p className="text-[16px] text-muted-foreground font-medium mt-4">Cross-examine official supervisor logs against self-submitted work claims from labours.</p>
        </div>
      </div>

      {/* Date & Site Filter Controls */}
      <div className="p-8 rounded-[32px] bg-gradient-to-br from-card via-card to-background border border-border/80 flex flex-col md:flex-row gap-6 items-center w-full shadow-sm">
        {/* Date Selector */}
        <div className="w-full md:w-auto flex-1 flex items-center gap-4">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm bg-background border border-border h-12 rounded-xl px-4 text-foreground focus:ring-1 focus:ring-ring focus:outline-none transition-shadow w-full"
          />
        </div>

        {/* Site Selector */}
        <div className="w-full md:w-auto flex-1 flex items-center gap-4">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="text-sm bg-background border border-border h-12 rounded-xl px-4 text-foreground focus:ring-1 focus:ring-ring focus:outline-none transition-shadow w-full cursor-pointer"
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Verification Status Filter */}
        <div className="w-full md:w-auto flex-1 flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Filter</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-sm bg-background border border-border h-12 rounded-xl px-4 text-foreground focus:ring-1 focus:ring-ring focus:outline-none transition-shadow w-full cursor-pointer"
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
        {[
          { label: 'Verified Matches', value: `${matchesCount} Workers`, icon: CheckCircle2, textClass: 'text-foreground', bg: 'bg-card border-border/80' },
          { label: 'Mismatched Discrepancies', value: `${mismatchCount} Alerts`, icon: AlertCircle, textClass: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
          { label: 'Pending Self-Submit', value: `${pendingCount} Workers`, icon: HelpCircle, textClass: 'text-muted-foreground', bg: 'bg-card border-border/80' },
        ].map((stat, idx) => (
          <div key={idx} className={`p-6 rounded-[22px] border flex items-center gap-4 shadow-sm ${stat.bg}`}>
            <stat.icon className={`w-8 h-8 shrink-0 ${stat.textClass}`} />
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">{stat.label}</span>
              <span className={`text-2xl font-bold mt-1 block ${stat.textClass === 'text-muted-foreground' ? 'text-foreground' : stat.textClass}`}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Grid Table */}
      <div className="rounded-[32px] border border-border/80 bg-card overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/20 text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.1em] border-b border-border/50">
                <th className="py-4 px-8">Worker Profile</th>
                <th className="py-4 px-8">Roster (Supervisor Log)</th>
                <th className="py-4 px-8">Self-Claim (Labour Log)</th>
                <th className="py-4 px-8">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[14px] text-muted-foreground font-medium">
                    No matching records found for the selected filter date and criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.worker.id} className="hover:bg-muted/20 transition-colors">
                    {/* Worker Details */}
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border border-border/80 bg-background text-foreground flex items-center justify-center font-bold text-[13px] uppercase">
                          {item.worker.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-[15px] text-foreground leading-tight">{item.worker.name}</p>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">{item.worker.id} • {item.worker.trade}</p>
                        </div>
                      </div>
                    </td>

                    {/* Supervisor Entry */}
                    <td className="py-5 px-8">
                      {item.roster ? (
                        <div className="space-y-1">
                          <p className="font-bold text-[14px] text-foreground">{item.roster.status}</p>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                            {item.roster.overtimeHours}h OT • {item.roster.isNightShift ? 'Night Shift' : 'Day Shift'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium italic">Not Marked</span>
                      )}
                    </td>

                    {/* Labour self claim */}
                    <td className="py-5 px-8">
                      {item.claim ? (
                        <div className="space-y-1">
                          <p className="font-bold text-[14px] text-foreground">{item.claim.status}</p>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                            {item.claim.overtimeHours}h OT • {item.claim.isNightShift ? 'Night Shift' : 'Day Shift'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium italic">Pending Self-Submit</span>
                      )}
                    </td>

                    {/* Status badges & Resolution Actions */}
                    <td className="py-5 px-8">
                      {item.status === 'match' && (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-foreground text-background">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified Match
                        </span>
                      )}
                      
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-background border border-border text-muted-foreground/60">
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
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary-foreground dark:text-primary hover:border-primary/50 transition-colors"
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
      <Modal
        isOpen={!!resolvingDiscrepancy}
        onClose={() => setResolvingDiscrepancy(null)}
        title="Resolve Muster Discrepancy"
        description={resolvingDiscrepancy ? `Compare logged logs for ${resolvingDiscrepancy.worker.name} on ${selectedDate} and choose the correct entry.` : undefined}
      >
        {resolvingDiscrepancy && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Option A: Supervisor */}
              <button
                onClick={() => handleResolve('roster')}
                className="p-6.5 text-left border border-border/80 hover:border-foreground/30 bg-card rounded-[22px] flex flex-col justify-between transition-all group"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block mb-2">Entry A</span>
                  <h4 className="text-[16px] font-bold text-foreground">Supervisor Roster</h4>
                </div>
                <div className="mt-6 text-sm space-y-2 text-foreground font-medium">
                  <p><span className="text-muted-foreground font-normal">Status:</span> {resolvingDiscrepancy.roster.status}</p>
                  <p><span className="text-muted-foreground font-normal">Overtime:</span> {resolvingDiscrepancy.roster.overtimeHours} hours</p>
                  <p><span className="text-muted-foreground font-normal">Shift:</span> {resolvingDiscrepancy.roster.isNightShift ? 'Night' : 'Day'}</p>
                </div>
                <span className="mt-6 w-full py-3.5 rounded-xl bg-background text-[11px] uppercase tracking-widest font-bold text-center border border-border text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                  Accept Entry A
                </span>
              </button>

              {/* Option B: Labour */}
              <button
                onClick={() => handleResolve('claim')}
                className="p-6.5 text-left border border-border/80 hover:border-foreground/30 bg-card rounded-[22px] flex flex-col justify-between transition-all group"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block mb-2">Entry B</span>
                  <h4 className="text-[16px] font-bold text-foreground">Labour Claim</h4>
                </div>
                <div className="mt-6 text-sm space-y-2 text-foreground font-medium">
                  <p><span className="text-muted-foreground font-normal">Status:</span> {resolvingDiscrepancy.claim.status}</p>
                  <p><span className="text-muted-foreground font-normal">Overtime:</span> {resolvingDiscrepancy.claim.overtimeHours} hours</p>
                  <p><span className="text-muted-foreground font-normal">Shift:</span> {resolvingDiscrepancy.claim.isNightShift ? 'Night' : 'Day'}</p>
                </div>
                <span className="mt-6 w-full py-3.5 rounded-xl bg-background text-[11px] uppercase tracking-widest font-bold text-center border border-border text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                  Accept Entry B
                </span>
              </button>

            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
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
