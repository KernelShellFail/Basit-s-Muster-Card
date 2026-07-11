import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  CalendarDays, 
  Check, 
  X, 
  MessageSquare, 
  Send, 
  Clock, 
  ThumbsUp, 
  ThumbsDown,
  CalendarRange,
  Plus
} from 'lucide-react';
import type { LeaveRequest } from '../../services/db';

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

    // Identify which worker is applying (if role is labour, match current user, else match selected workerId)
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
    // Reset Form
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

  // Split leaves based on status and role views
  const pendingLeaves = localLeaves.filter(l => l.status === 'Pending');
  const processedLeaves = localLeaves.filter(l => l.status !== 'Pending');

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-construction-850 dark:text-white">{t('leaves')}</h1>
          <p className="text-xs text-construction-500 mt-1">Submit and review leave approvals. Approved leaves auto-populate the attendance sheet.</p>
        </div>
        
        <button
          onClick={() => {
            setTargetWorkerId(workers[0]?.id || '');
            setShowApplyModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 shadow-md transition-colors shrink-0 align-self-start"
        >
          <CalendarRange className="w-4 h-4" />
          Request Leave (रजा मांगें)
        </button>
      </div>

      {/* Grid: Pending vs Processed logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending approvals (For Owners / Admins / Supervisors) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-construction-800 dark:text-white flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-amber-500" />
            Pending Action ({pendingLeaves.length})
          </h3>

          {pendingLeaves.length === 0 ? (
            <div className="p-8 text-center text-xs text-construction-450 border border-dashed border-construction-200 dark:border-construction-800 rounded-2xl bg-white dark:bg-construction-900 shadow-sm">
              All leave requests processed. No pending items.
            </div>
          ) : (
            pendingLeaves.map((leave: LeaveRequest) => (
              <div 
                key={leave.id}
                className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-construction-850 dark:text-white">{leave.workerName}</h4>
                    <p className="text-[10px] text-construction-500 mt-0.5">ID: {leave.workerId} • Requested: {new Date(leave.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                    {leave.leaveType} Leave
                  </span>
                </div>

                <div className="text-xs text-construction-650 dark:text-construction-350 bg-construction-50/50 dark:bg-construction-950/30 p-3 rounded-xl border border-construction-100 dark:border-construction-800/40">
                  <p><strong>Dates:</strong> {leave.startDate} to {leave.endDate}</p>
                  <p className="mt-1"><strong>Reason:</strong> "{leave.reason}"</p>
                </div>

                {/* Supervisor/Admin Actions */}
                {(selectedRole === 'owner' || selectedRole === 'admin') && (
                  <div className="space-y-3 pt-2 border-t border-construction-100 dark:border-construction-800/40">
                    <input
                      type="text"
                      placeholder="Comment / response remark..."
                      value={adminComment[leave.id] || ''}
                      onChange={(e) => setAdminComment(prev => ({ ...prev, [leave.id]: e.target.value }))}
                      className="w-full text-[10px] px-2.5 py-2 rounded-lg border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleAction(leave, 'Rejected')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-[10px] font-bold transition-all"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(leave, 'Approved')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] font-bold transition-all"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Leave Logs History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-construction-800 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-4.5 h-4.5 text-construction-500" />
            Processed Log & Approval Timeline
          </h3>

          <div className="rounded-2xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-construction-250 dark:border-construction-800 bg-construction-50 dark:bg-construction-950/20 text-construction-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Worker</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-construction-100 dark:divide-construction-800/40">
                  {processedLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-construction-450 font-medium">
                        No previous logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    processedLeaves.map((leave: LeaveRequest) => (
                      <tr key={leave.id} className="hover:bg-construction-50/50 dark:hover:bg-construction-800/20 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-construction-800 dark:text-white leading-tight">{leave.workerName}</p>
                          <p className="text-[9px] text-construction-500 mt-0.5">{leave.workerId}</p>
                        </td>
                        <td className="p-4 font-semibold text-construction-700 dark:text-construction-300">
                          {leave.startDate} to {leave.endDate}
                        </td>
                        <td className="p-4 font-semibold">{leave.leaveType}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black inline-flex items-center gap-1 ${
                            leave.status === 'Approved' 
                              ? 'bg-emerald-500/10 text-emerald-600' 
                              : 'bg-red-500/10 text-red-600'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${leave.status === 'Approved' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {leave.status}
                          </span>
                          {leave.comment && (
                            <p className="text-[9px] text-construction-400 italic mt-0.5 truncate max-w-[130px]" title={leave.comment}>
                              "{leave.comment}"
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Modal: Request Leave */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-construction-950 rounded-2xl border border-construction-200 dark:border-construction-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-construction-200 dark:border-construction-800 flex items-center justify-between bg-construction-50 dark:bg-construction-900/50">
              <h3 className="text-sm font-black text-construction-850 dark:text-white flex items-center gap-1.5">
                <CalendarRange className="w-5 h-5 text-safety-500" />
                Submit New Leave Application
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1.5 rounded-lg hover:bg-construction-200 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-350"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              {/* Select worker (for Admins applying on behalf of workers) */}
              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Select Worker (मज़दूर चुनें)</label>
                <select
                  value={targetWorkerId}
                  onChange={(e) => setTargetWorkerId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500"
                >
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.id})</option>)}
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Leave Type (पेशा प्रकार)</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500"
                >
                  <option value="Personal">Personal Leave</option>
                  <option value="Medical">Medical Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                  <option value="Paid">Paid Leave (सवैतनिक)</option>
                  <option value="Unpaid">Unpaid Leave (अवैतनिक)</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Reason Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the reason clearly..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-construction-150 dark:border-construction-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-construction-250 dark:border-construction-800 rounded-lg text-xs font-bold text-construction-600 dark:text-construction-350 hover:bg-construction-50 dark:hover:bg-construction-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 shadow-md transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
