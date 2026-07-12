import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  CalendarDays, 
  Clock, 
  ThumbsUp, 
  ThumbsDown,
  CalendarRange
} from 'lucide-react';
import type { LeaveRequest } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { slideUp, staggerContainer } from '../../utils/animations';

export const Leaves = () => {
  const { workers, selectedRole, currentLanguage, saveLeave, leaves } = useAppStore();
  const { t } = useTranslation(currentLanguage);

  const localLeaves = leaves;

  // Form states for submitting leave
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Personal');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [targetWorkerId, setTargetWorkerId] = useState('');

  // Comment state for approvals
  const [adminComment, setAdminComment] = useState<Record<string, string>>({});

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    const worker = workers.find(w => w.id === targetWorkerId) || workers[0];
    
    const newRequest: LeaveRequest = {
      id: `lv-${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    saveLeave(newRequest);
    showToast(`Leave request submitted for ${worker.name}.`);
    setShowApplyModal(false);
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const handleAction = (request: LeaveRequest, action: 'Approved' | 'Rejected') => {
    const comment = adminComment[request.id] || '';
    const updated: LeaveRequest = {
      ...request,
      status: action,
      comment: comment || undefined
    };

    saveLeave(updated);
    showToast(`Leave request ${action.toLowerCase()} successfully.`);
  };

  const pendingLeaves = localLeaves.filter(l => l.status === 'Pending');
  const processedLeaves = localLeaves.filter(l => l.status !== 'Pending');

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      
      {/* Title */}
      <motion.div variants={slideUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{t('leaves')}</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit and review leave approvals. Approved leaves auto-populate the attendance sheet.</p>
        </div>
        
        <Button
          onClick={() => {
            setTargetWorkerId(workers[0]?.id || '');
            setShowApplyModal(true);
          }}
          leftIcon={<CalendarRange className="w-5 h-5" />}
          className="shrink-0"
        >
          Request Leave (रजा मांगें)
        </Button>
      </motion.div>

      {/* Grid: Pending vs Processed logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending approvals (For Owners / Admins / Supervisors) */}
        <motion.div variants={slideUp} className="space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-widest">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Action ({pendingLeaves.length})
          </h3>

          {pendingLeaves.length === 0 ? (
            <Card glass className="border-dashed">
              <CardContent className="p-6 sm:p-8 text-center text-sm font-medium text-muted-foreground">
                All leave requests processed. No pending items.
              </CardContent>
            </Card>
          ) : (
            pendingLeaves.map((leave: LeaveRequest) => (
              <Card key={leave.id} glass className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-foreground">{leave.workerName}</h4>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5 uppercase tracking-widest">ID: {leave.workerId} • Req: {new Date(leave.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      {leave.leaveType}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground bg-accent/40 p-4 rounded-xl border border-border">
                    <p><strong className="text-foreground font-semibold">Dates:</strong> {leave.startDate} to {leave.endDate}</p>
                    <p className="mt-1.5 leading-relaxed"><strong className="text-foreground font-semibold">Reason:</strong> "{leave.reason}"</p>
                  </div>

                  {/* Supervisor/Admin Actions */}
                  {(selectedRole === 'owner' || selectedRole === 'admin') && (
                    <div className="space-y-3 pt-2">
                      <Input
                        type="text"
                        placeholder="Comment / response remark..."
                        value={adminComment[leave.id] || ''}
                        onChange={(e) => setAdminComment(prev => ({ ...prev, [leave.id]: e.target.value }))}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleAction(leave, 'Rejected')}
                          leftIcon={<ThumbsDown className="w-5 h-5" />}
                          className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleAction(leave, 'Approved')}
                          leftIcon={<ThumbsUp className="w-5 h-5" />}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>

        {/* Leave Logs History */}
        <motion.div variants={slideUp} className="space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-widest">
            <CalendarDays className="w-5 h-5 text-brand-500" />
            Processed Log & Approval Timeline
          </h3>

          <Card glass className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium">
                      No previous logs recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  processedLeaves.map((leave: LeaveRequest) => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <p className="font-bold text-foreground leading-tight">{leave.workerName}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest font-semibold">{leave.workerId}</p>
                      </TableCell>
                      <TableCell className="font-semibold text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col text-xs leading-normal">
                          <span>{leave.startDate}</span>
                          <span className="text-[9px] text-brand-500 uppercase font-black">to</span>
                          <span>{leave.endDate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{leave.leaveType}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border ${
                          leave.status === 'Approved' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${leave.status === 'Approved' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {leave.status}
                        </span>
                        {leave.comment && (
                          <p className="text-[10px] text-muted-foreground italic mt-2 truncate max-w-[140px]" title={leave.comment}>
                            "{leave.comment}"
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </motion.div>

      </div>

      {/* Modal: Request Leave */}
      <AnimatePresence>
        {showApplyModal && (
          <Modal
            isOpen={showApplyModal}
            onClose={() => setShowApplyModal(false)}
            title="Submit New Leave Application"
          >
            <form onSubmit={handleApplyLeave} className="space-y-5">
              {/* Select worker */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Select Worker (मज़दूर चुनें)</label>
                <select
                  value={targetWorkerId}
                  onChange={(e) => setTargetWorkerId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.id})</option>)}
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Leave Type (पेशा प्रकार)</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Personal">Personal Leave</option>
                  <option value="Medical">Medical Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                  <option value="Paid">Paid Leave (सवैतनिक)</option>
                  <option value="Unpaid">Unpaid Leave (अवैतनिक)</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Start Date *</label>
                  <Input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">End Date *</label>
                  <Input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Reason Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the reason clearly..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Application
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
