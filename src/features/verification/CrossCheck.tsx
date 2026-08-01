import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { showToast } from '../../components/Toast';
import { 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Calendar, 
  MapPin
} from 'lucide-react';
import { AttendanceRecord, LabourSubmission, Worker } from '../../services/db';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DatePicker } from '../../components/ui/DatePicker';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { motion } from 'framer-motion';
import { slideUp, staggerContainer } from '../../utils/animations';

import { 
  useWorkers, 
  useSites, 
  useAttendance, 
  useLabourSubmissions, 
  useUpdateAttendance 
} from '../../api/queries';

export const CrossCheck = () => {
  const { 
    activeSiteId
  } = useAppStore();
  
  const { data: workers = [] } = useWorkers();
  const { data: sites = [] } = useSites();
  const { data: attendance = [] } = useAttendance();
  const { data: labourSubmissions = [] } = useLabourSubmissions();
  const { mutateAsync: saveAttendance } = useUpdateAttendance();

  // States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSiteId, setSelectedSiteId] = useState(activeSiteId);
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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-12">
      
      {/* Title */}
      <PageHeader
        eyebrow="verification"
        eyebrowColor="text-shockingly-green"
        title="Muster Cross-Check"
        description="Cross-examine official supervisor logs against self-submitted work claims from labours."
      />

      {/* Date & Site Filter Controls */}
      <motion.div variants={slideUp} className="p-8 rounded-[8px] bg-card border border-border flex flex-col md:flex-row gap-6 items-center w-full">
        {/* Date Selector */}
        <div className="w-full md:w-auto flex-1 flex items-center gap-4">
          <Calendar className="w-4 h-4 text-shockingly-green shrink-0" />
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            className="w-full"
          />
        </div>

        {/* Site Selector */}
        <div className="w-full md:w-auto flex-1 flex items-center gap-4">
          <MapPin className="w-4 h-4 text-shockingly-green shrink-0" />
          <Select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full"
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>

        {/* Verification Status Filter */}
        <div className="w-full md:w-auto flex-1 flex items-center gap-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-surface-50 shrink-0">Filter</span>
          <Select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full"
          >
            <option value="All">All Entries ({comparisonList.length})</option>
            <option value="match">Verified Matches ({matchesCount})</option>
            <option value="mismatch">Discrepancies ({mismatchCount})</option>
            <option value="pending">Pending Claim ({pendingCount})</option>
          </Select>
        </div>
      </motion.div>

      {/* Metrics breakdown */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Verified Matches', value: `${matchesCount} Workers`, accent: false },
          { label: 'Mismatched Discrepancies', value: `${mismatchCount} Alerts`, danger: true },
          { label: 'Pending Self-Submit', value: `${pendingCount} Workers`, accent: false },
        ].map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            tone={stat.danger ? 'danger' : 'default'}
          />
        ))}
      </motion.div>

      {/* Comparison Grid Table */}
      <motion.div variants={slideUp} className="rounded-[8px] border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/20 text-[12px] text-surface-50 font-semibold uppercase tracking-[0.08em] border-b border-border">
                <th className="py-4 px-8">Worker Profile</th>
                <th className="py-4 px-8">Roster (Supervisor Log)</th>
                <th className="py-4 px-8">Self-Claim (Labour Log)</th>
                <th className="py-4 px-8">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[14px] text-surface-50 font-medium">
                    No matching records found for the selected filter date and criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.worker.id} className="hover:bg-muted/20 transition-colors">
                    {/* Worker Details */}
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border border-border bg-background text-surface-cream flex items-center justify-center font-bold text-[13px] uppercase">
                          {item.worker.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-[15px] text-surface-cream leading-tight">{item.worker.name}</p>
                          <p className="text-[11px] text-surface-50 uppercase tracking-wider font-semibold mt-1">{item.worker.id} • {item.worker.trade}</p>
                        </div>
                      </div>
                    </td>

                    {/* Supervisor Entry */}
                    <td className="py-5 px-8">
                      {item.roster ? (
                        <div className="space-y-1">
                          <p className="font-bold text-[14px] text-surface-cream">{item.roster.status}</p>
                          <p className="text-[11px] uppercase tracking-wider text-surface-50 font-medium">
                            {item.roster.overtimeHours}h OT • {item.roster.isNightShift ? 'Night Shift' : 'Day Shift'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] uppercase tracking-wider text-surface-50 font-medium italic">Not Marked</span>
                      )}
                    </td>

                    {/* Labour self claim */}
                    <td className="py-5 px-8">
                      {item.claim ? (
                        <div className="space-y-1">
                          <p className="font-bold text-[14px] text-surface-cream">{item.claim.status}</p>
                          <p className="text-[11px] uppercase tracking-wider text-surface-50 font-medium">
                            {item.claim.overtimeHours}h OT • {item.claim.isNightShift ? 'Night Shift' : 'Day Shift'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] uppercase tracking-wider text-surface-50 font-medium italic">Pending Self-Submit</span>
                      )}
                    </td>

                    {/* Status badges & Resolution Actions */}
                    <td className="py-5 px-8">
                      {item.status === 'match' && (
                        <Badge color="success">
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Verified Match
                          </span>
                        </Badge>
                      )}
                      
                      {item.status === 'pending' && (
                        <Badge color="muted">
                          <span className="inline-flex items-center gap-2">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Awaiting Claim
                          </span>
                        </Badge>
                      )}

                      {item.status === 'mismatch' && (
                        <button
                          onClick={() => setResolvingDiscrepancy({
                            roster: item.roster!,
                            claim: item.claim!,
                            worker: item.worker
                          })}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider bg-fn-error/10 border border-fn-error/30 text-fn-error hover:border-fn-error/50 transition-colors"
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
      </motion.div>

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
                className="p-6 text-left border border-border hover:border-shockingly-green/40 bg-card rounded-[8px] flex flex-col justify-between transition-all group"
              >
                <div>
                  <span className="text-[11px] uppercase tracking-widest font-bold text-surface-50 block mb-2">Entry A</span>
                  <h4 className="text-[16px] font-bold text-surface-cream">Supervisor Roster</h4>
                </div>
                <div className="mt-6 text-sm space-y-2 text-surface-cream font-medium">
                  <p><span className="text-surface-50 font-normal">Status:</span> {resolvingDiscrepancy.roster.status}</p>
                  <p><span className="text-surface-50 font-normal">Overtime:</span> {resolvingDiscrepancy.roster.overtimeHours} hours</p>
                  <p><span className="text-surface-50 font-normal">Shift:</span> {resolvingDiscrepancy.roster.isNightShift ? 'Night' : 'Day'}</p>
                </div>
                <span className="mt-6 w-full py-3.5 rounded-full bg-background text-[11px] uppercase tracking-widest font-bold text-center border border-border text-surface-cream group-hover:bg-shockingly-green group-hover:text-just-black group-hover:border-shockingly-green transition-colors">
                  Accept Entry A
                </span>
              </button>

              {/* Option B: Labour */}
              <button
                onClick={() => handleResolve('claim')}
                className="p-6 text-left border border-border hover:border-shockingly-green/40 bg-card rounded-[8px] flex flex-col justify-between transition-all group"
              >
                <div>
                  <span className="text-[11px] uppercase tracking-widest font-bold text-surface-50 block mb-2">Entry B</span>
                  <h4 className="text-[16px] font-bold text-surface-cream">Labour Claim</h4>
                </div>
                <div className="mt-6 text-sm space-y-2 text-surface-cream font-medium">
                  <p><span className="text-surface-50 font-normal">Status:</span> {resolvingDiscrepancy.claim.status}</p>
                  <p><span className="text-surface-50 font-normal">Overtime:</span> {resolvingDiscrepancy.claim.overtimeHours} hours</p>
                  <p><span className="text-surface-50 font-normal">Shift:</span> {resolvingDiscrepancy.claim.isNightShift ? 'Night' : 'Day'}</p>
                </div>
                <span className="mt-6 w-full py-3.5 rounded-full bg-background text-[11px] uppercase tracking-widest font-bold text-center border border-border text-surface-cream group-hover:bg-shockingly-green group-hover:text-just-black group-hover:border-shockingly-green transition-colors">
                  Accept Entry B
                </span>
              </button>

            </div>

            <div className="flex justify-end pt-4 border-t border-border">
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
    </motion.div>
  );
};
