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
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { slideUp, staggerContainer } from '../../utils/animations';
import { useWorkers, useLeaves, useAddLeave } from '../../api/queries';

export const Leaves = () => {
  const { selectedRole, currentLanguage } = useAppStore();
  const { data: workers = [] } = useWorkers();
  const { data: leaves = [] } = useLeaves();
  const { mutate: saveLeave } = useAddLeave();
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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      {/* Title */}
      <PageHeader
        eyebrow="leaves"
        eyebrowColor="text-lilac"
        title={t('leaves')}
        description="Submit and review leave approvals. Approved leaves auto-populate the attendance sheet."
        actions={
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
        }
      />

      {/* Grid: Pending vs Processed logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
        
        {/* Pending approvals (For Owners / Admins / Supervisors) */}
        <motion.div variants={slideUp} className="space-y-6">
          <h3 className="text-[11px] font-bold text-surface-cream flex items-center gap-2 uppercase tracking-[0.12em]">
            <Clock className="w-5 h-5 text-lilac" />
            Pending Action ({pendingLeaves.length})
          </h3>

          {pendingLeaves.length === 0 ? (
            <div className="p-12 text-center text-[15px] font-medium text-surface-50 border border-dashed border-border rounded-[8px] bg-card/40">
              All leave requests processed. No pending items.
            </div>
          ) : (
            pendingLeaves.map((leave: LeaveRequest) => (
              <Card key={leave.id} className="overflow-hidden border border-border rounded-[8px] bg-card">
                <CardContent className="p-8 sm:p-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[16px] font-bold text-surface-cream">{leave.workerName}</h4>
                      <p className="text-[11px] font-semibold text-surface-50 mt-1 uppercase tracking-wider">ID: {leave.workerId} • Req: {new Date(leave.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge color="lilac">{leave.leaveType}</Badge>
                  </div>

                  <div className="text-[13px] text-surface-50 bg-background p-6 rounded-[8px] border border-border">
                    <p><strong className="text-surface-cream font-semibold">Dates:</strong> {leave.startDate} to {leave.endDate}</p>
                    <p className="mt-2 leading-relaxed"><strong className="text-surface-cream font-semibold">Reason:</strong> "{leave.reason}"</p>
                  </div>

                  {/* Supervisor/Admin Actions */}
                  {(selectedRole === 'owner' || selectedRole === 'admin') && (
                    <div className="space-y-4 pt-2">
                      <Input
                        type="text"
                        placeholder="Comment / response remark..."
                        value={adminComment[leave.id] || ''}
                        onChange={(e) => setAdminComment(prev => ({ ...prev, [leave.id]: e.target.value }))}
                        className="h-11 text-xs"
                      />
                      <div className="flex justify-end gap-3.5">
                        <Button
                          variant="outline"
                          onClick={() => handleAction(leave, 'Rejected')}
                          leftIcon={<ThumbsDown className="w-4 h-4" />}
                          className="text-fn-error border-fn-error/20 hover:bg-fn-error/10 hover:text-fn-error hover:border-fn-error/30"
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleAction(leave, 'Approved')}
                          leftIcon={<ThumbsUp className="w-4 h-4" />}
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
        <motion.div variants={slideUp} className="space-y-6">
          <h3 className="text-[11px] font-bold text-surface-cream flex items-center gap-2 uppercase tracking-[0.12em]">
            <CalendarDays className="w-5 h-5 text-lilac" />
            Processed Log & Approval Timeline
          </h3>

          <Card className="rounded-[8px] border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 text-[12px] text-surface-50 font-semibold uppercase tracking-[0.08em] border-b border-border">
                  <TableHead className="py-4 px-6">Worker</TableHead>
                  <TableHead className="py-4 px-6">Dates</TableHead>
                  <TableHead className="py-4 px-6">Type</TableHead>
                  <TableHead className="py-4 px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {processedLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-sm text-surface-50 font-semibold">
                      No previous logs recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  processedLeaves.map((leave: LeaveRequest) => (
                    <TableRow key={leave.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4 px-6">
                        <p className="font-bold text-[14px] text-surface-cream leading-tight">{leave.workerName}</p>
                        <p className="text-[11px] text-surface-50 mt-1 uppercase tracking-wider font-semibold">{leave.workerId}</p>
                      </TableCell>
                      <TableCell className="py-4 px-6 font-semibold text-[11px] text-surface-50 whitespace-nowrap">
                        <div className="flex flex-col leading-normal">
                          <span>{leave.startDate}</span>
                          <span className="text-[11px] text-surface-cream uppercase tracking-widest font-bold">to</span>
                          <span>{leave.endDate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 font-semibold text-xs text-surface-cream">{leave.leaveType}</TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge color={leave.status === 'Approved' ? 'success' : 'error'}>
                          {leave.status}
                        </Badge>
                        {leave.comment && (
                          <p className="text-[11px] text-surface-50 italic mt-2.5 truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[200px]" title={leave.comment}>
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
              <Select
                label="Select Worker (मज़दूर चुनें)"
                value={targetWorkerId}
                onChange={(e) => setTargetWorkerId(e.target.value)}
                className="text-surface-cream"
              >
                {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.id})</option>)}
              </Select>

              {/* Leave Type */}
              <Select
                label="Leave Type (पेशा प्रकार)"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as any)}
                className="text-surface-cream"
              >
                <option value="Personal">Personal Leave</option>
                <option value="Medical">Medical Leave</option>
                <option value="Emergency">Emergency Leave</option>
                <option value="Paid">Paid Leave (सवैतनिक)</option>
                <option value="Unpaid">Unpaid Leave (अवैतनिक)</option>
              </Select>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-surface-50 uppercase tracking-widest block mb-2">Start Date *</label>
                  <Input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-surface-50 uppercase tracking-widest block mb-2">End Date *</label>
                  <Input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Reason */}
              <Textarea
                label="Reason Description *"
                rows={3}
                required
                placeholder="State the reason clearly..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

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
