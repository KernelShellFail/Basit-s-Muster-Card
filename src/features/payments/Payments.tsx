import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  IndianRupee, 
  Wallet, 
  CreditCard, 
  Smartphone, 
  FileText, 
  Coins, 
  Signature, 
  Plus, 
  X, 
  Printer, 
  CheckCircle,
  HelpCircle,
  Eye,
  FileCheck,
  Trash2
} from 'lucide-react';
import type { Worker, AttendanceRecord, PaymentRecord } from '../../services/db';

export const Payments = () => {
  const { workers, activeSiteId, processPayment, removePayment, currentLanguage, attendance, payments } = useAppStore();
  const { t } = useTranslation(currentLanguage);

  const localAttendance = attendance;
  const localPayments = payments;

  const handleDeleteReceipt = (payId: string) => {
    if (confirm('Are you sure you want to delete this payment log? This will rollback the payment and update the worker balance due.')) {
      removePayment(payId);
      setSelectedReceipt(null);
      showToast('Payment log deleted and balance rolled back successfully.');
    }
  };

  // Active site filter
  const siteWorkers = workers.filter(w => w.currentSiteId === activeSiteId && w.status === 'Active');

  // Modal States
  const [payingWorker, setPayingWorker] = useState<Worker | null>(null);
  const [viewingReceiptsWorker, setViewingReceiptsWorker] = useState<Worker | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  
  // Payment Form States
  const [payAmount, setPayAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Signature Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Compute worker wages
  const getWorkerFinancials = (worker: Worker) => {
    const workerAttendance = localAttendance.filter(a => 
      a.workerId === worker.id && a.date.startsWith('2026-07')
    );

    const presents = workerAttendance.filter(a => a.status === 'Present').length;
    const halfDays = workerAttendance.filter(a => a.status === 'Half-Day').length;
    const totalOTHours = workerAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const nightShifts = workerAttendance.filter(a => a.isNightShift).length;

    const baseEarned = worker.dailyWage * (presents + (0.5 * halfDays));
    const otEarned = totalOTHours * worker.overtimeRate;
    const nightEarned = nightShifts * 150; // Night Shift Allowance

    const grossWages = baseEarned + otEarned + nightEarned;

    const totalPaid = localPayments
      .filter(p => p.workerId === worker.id && p.date.startsWith('2026-07'))
      .reduce((sum, p) => sum + p.amount, 0);

    const balanceDue = Math.max(0, grossWages - totalPaid);

    return {
      presents,
      halfDays,
      totalOTHours,
      grossWages,
      totalPaid,
      balanceDue
    };
  };

  // Open payout dialog
  const handleOpenPayout = (worker: Worker, balance: number) => {
    setPayingWorker(worker);
    setPayAmount(balance);
    setPaymentType('Cash');
    setReferenceNumber('');
    setPaymentNotes('');
    setHasSignature(false);
  };

  // Canvas drawing listeners for Signature Pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a'; // Deep slate ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSavePayout = () => {
    if (!payingWorker) return;
    if (payAmount <= 0) {
      showToast('Payment amount must be greater than zero.', 'error');
      return;
    }

    let signatureDataUrl = '';
    if (canvasRef.current && hasSignature) {
      signatureDataUrl = canvasRef.current.toDataURL();
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      workerId: payingWorker.id,
      workerName: payingWorker.name,
      date: new Date().toISOString().split('T')[0],
      amount: payAmount,
      paymentType,
      referenceNumber: referenceNumber || undefined,
      type: 'Wage',
      workerSignature: signatureDataUrl || undefined,
      notes: paymentNotes || undefined
    };

    processPayment(newPayment);
    showToast(`Payment of ₹${payAmount} logged for ${payingWorker.name}`);
    setPayingWorker(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-construction-850 dark:text-white">{t('payments')}</h1>
        <p className="text-xs text-construction-500 mt-1">Review live July 2026 payroll sheets, release partial/full wages, and collect digital receipts.</p>
      </div>

      {/* Wages Ledger Card */}
      <div className="rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-construction-200 dark:border-construction-800 bg-construction-50 dark:bg-construction-950/20">
          <h3 className="text-xs font-bold text-construction-700 dark:text-construction-300">Wages Tally Sheet (July 2026)</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-construction-200 dark:border-construction-800 text-construction-500 font-bold uppercase tracking-wider bg-construction-50/20 dark:bg-construction-950/10">
                <th className="p-4">Worker ID & Name</th>
                <th className="p-4">Daily Wage</th>
                <th className="p-4 text-center">Presents / Half</th>
                <th className="p-4 text-center">OT Hours</th>
                <th className="p-4">Gross Earnings</th>
                <th className="p-4">Paid to Date</th>
                <th className="p-4">Balance Due</th>
                <th className="p-4 text-center">Payouts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construction-100 dark:divide-construction-800/40">
              {siteWorkers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-construction-450">
                    No active workers assigned to this site.
                  </td>
                </tr>
              ) : (
                siteWorkers.map(w => {
                  const financials = getWorkerFinancials(w);
                  const receipts = localPayments.filter(p => p.workerId === w.id);

                  return (
                    <tr key={w.id} className="hover:bg-construction-50/50 dark:hover:bg-construction-800/20 transition-colors">
                      {/* Name */}
                      <td className="p-4">
                        <p className="font-bold text-construction-850 dark:text-white leading-tight">{w.name}</p>
                        <p className="text-[10px] text-construction-500 font-semibold mt-0.5">{w.id} • {w.trade}</p>
                      </td>

                      {/* Daily Wage */}
                      <td className="p-4 font-semibold text-construction-800 dark:text-white">
                        ₹{w.dailyWage}
                      </td>

                      {/* Presents / Half-Days */}
                      <td className="p-4 text-center font-bold text-construction-700 dark:text-construction-300">
                        {financials.presents} P / {financials.halfDays} H
                      </td>

                      {/* OT */}
                      <td className="p-4 text-center font-bold text-construction-700 dark:text-construction-300">
                        {financials.totalOTHours} hrs
                      </td>

                      {/* Gross Earnings */}
                      <td className="p-4 font-bold text-construction-850 dark:text-white">
                        ₹{financials.grossWages}
                      </td>

                      {/* Total Paid */}
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-500">
                        ₹{financials.totalPaid}
                      </td>

                      {/* Balance Due */}
                      <td className="p-4 font-extrabold text-amber-500">
                        ₹{financials.balanceDue}
                      </td>

                      {/* Pay Trigger buttons */}
                      <td className="p-4 text-center flex items-center justify-center gap-1.5">
                        <button
                          disabled={financials.balanceDue <= 0}
                          onClick={() => handleOpenPayout(w, financials.balanceDue)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all ${
                            financials.balanceDue <= 0 
                              ? 'bg-construction-100 text-construction-400 dark:bg-construction-850 cursor-not-allowed shadow-none' 
                              : 'bg-safety-500 text-construction-950 hover:bg-safety-600'
                          }`}
                        >
                          <IndianRupee className="w-3 h-3" />
                          Pay Wage
                        </button>
                        
                        {receipts.length > 0 && (
                          <button
                            onClick={() => {
                              setViewingReceiptsWorker(w);
                              setSelectedReceipt(receipts[receipts.length - 1]);
                            }}
                            className="p-1.5 rounded-lg border border-construction-200 dark:border-construction-800 text-construction-600 dark:text-construction-300 hover:bg-construction-100 dark:hover:bg-construction-800 transition-colors"
                            title="View Payments Receipts Logs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Process Payout Wage Receipt */}
      {payingWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-construction-950 rounded-2xl border border-construction-200 dark:border-construction-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-construction-200 dark:border-construction-800 flex items-center justify-between bg-construction-50 dark:bg-construction-900/50">
              <h3 className="text-sm font-black text-construction-850 dark:text-white flex items-center gap-1.5">
                <Wallet className="w-5 h-5 text-safety-500" />
                Process Wage Payment Log
              </h3>
              <button
                onClick={() => setPayingWorker(null)}
                className="p-1.5 rounded-lg hover:bg-construction-200 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-350"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="text-xs p-3.5 rounded-xl bg-construction-50 dark:bg-construction-900 border border-construction-100 dark:border-construction-800 text-construction-700 dark:text-construction-350 space-y-1">
                <p><strong>Worker:</strong> {payingWorker.name} ({payingWorker.id})</p>
                <p><strong>Assigned Trade:</strong> {payingWorker.trade} ({payingWorker.skillLevel})</p>
                <p><strong>Bank Target:</strong> {payingWorker.bankName} - A/C: {payingWorker.accountNumber}</p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Release Payout Amount (₹) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full text-sm font-bold px-3 py-2.5 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Method */}
                <div>
                  <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Payment Method</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500"
                  >
                    <option value="Cash">Cash (नकद)</option>
                    <option value="Bank Transfer">Bank Transfer (बैंक ट्रांसफर)</option>
                    <option value="UPI">UPI Payment (गूगलपे/फोनपे)</option>
                    <option value="Cheque">Cheque (चेक)</option>
                  </select>
                </div>

                {/* Ref */}
                <div>
                  <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Reference No (UTR / Txn ID)</label>
                  <input
                    type="text"
                    placeholder="Optional transaction reference"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Receipt Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Paid full July wage cycle"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:outline-none"
                />
              </div>

              {/* Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 flex items-center gap-1.5">
                    <Signature className="w-3.5 h-3.5 text-safety-500" />
                    Labor/Supervisor Signature Proof *
                  </label>
                  {hasSignature && (
                    <button
                      onClick={clearSignature}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Clear signature
                    </button>
                  )}
                </div>
                <div className="border border-construction-200 dark:border-construction-800 rounded-xl bg-slate-50 dark:bg-construction-950 overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="signature-canvas w-full h-[120px]"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] text-construction-400 font-semibold uppercase tracking-wider">
                      Draw signature here using touch or mouse
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-construction-150 dark:border-construction-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayingWorker(null)}
                  className="px-4 py-2 border border-construction-250 dark:border-construction-800 rounded-lg text-xs font-bold text-construction-600 dark:text-construction-350 hover:bg-construction-50 dark:hover:bg-construction-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePayout}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 shadow-md transition-colors"
                >
                  Submit Payment Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Receipts / Salary Slips */}
      {viewingReceiptsWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-construction-950 rounded-2xl border border-construction-200 dark:border-construction-800 shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-construction-200 dark:border-construction-800 flex items-center justify-between bg-construction-50 dark:bg-construction-900/50">
              <h3 className="text-sm font-black text-construction-850 dark:text-white">
                Payment History - {viewingReceiptsWorker.name}
              </h3>
              <button
                onClick={() => setViewingReceiptsWorker(null)}
                className="p-1.5 rounded-lg hover:bg-construction-200 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-350"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split layout */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Side: Receipts list */}
              <div className="w-full md:w-1/2 border-r border-construction-150 dark:border-construction-800 overflow-y-auto p-4 space-y-2">
                <p className="text-[10px] font-bold text-construction-450 uppercase tracking-widest mb-3">All Payout slips</p>
                {localPayments.filter(p => p.workerId === viewingReceiptsWorker.id).map(pay => (
                  <button
                    key={pay.id}
                    onClick={() => setSelectedReceipt(pay)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedReceipt?.id === pay.id
                        ? 'border-safety-500 bg-safety-500/5 dark:bg-safety-500/5 shadow-sm'
                        : 'border-construction-100 dark:border-construction-800/40 hover:bg-construction-50/50 dark:hover:bg-construction-800/10'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-xs text-construction-800 dark:text-white">₹{pay.amount}</span>
                      <span className="text-[9px] text-construction-400">{pay.date}</span>
                    </div>
                    <p className="text-[10px] text-construction-500 mt-1 font-semibold">{pay.paymentType} • Ref: {pay.referenceNumber || 'N/A'}</p>
                  </button>
                ))}
              </div>

              {/* Right Side: Receipt Detail Viewer */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-construction-50/30 dark:bg-construction-950/20 flex flex-col justify-between">
                {selectedReceipt ? (
                  <div className="space-y-6">
                    {/* Receipt Sheet */}
                    <div className="p-4 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 shadow-sm space-y-4" id="salary-slip">
                      <div className="text-center pb-3 border-b border-construction-100 dark:border-construction-800">
                        <h4 className="text-xs font-bold text-construction-850 dark:text-white">MusterMate Buildcon</h4>
                        <p className="text-[8px] text-construction-400 uppercase tracking-wider mt-0.5">Wage Payment Receipt</p>
                      </div>
                      
                      <div className="text-[10px] text-construction-650 dark:text-construction-350 space-y-2">
                        <div className="flex justify-between"><strong>Receipt ID:</strong> <span>{selectedReceipt.id}</span></div>
                        <div className="flex justify-between"><strong>Date:</strong> <span>{selectedReceipt.date}</span></div>
                        <div className="flex justify-between"><strong>Worker:</strong> <span>{selectedReceipt.workerName}</span></div>
                        <div className="flex justify-between"><strong>Paid Amount:</strong> <span className="font-bold text-construction-850 dark:text-white">₹{selectedReceipt.amount}</span></div>
                        <div className="flex justify-between"><strong>Paid Via:</strong> <span>{selectedReceipt.paymentType}</span></div>
                        {selectedReceipt.referenceNumber && (
                          <div className="flex justify-between"><strong>Ref No:</strong> <span>{selectedReceipt.referenceNumber}</span></div>
                        )}
                        {selectedReceipt.notes && (
                          <div className="flex justify-between"><strong>Notes:</strong> <span>{selectedReceipt.notes}</span></div>
                        )}
                      </div>

                      {/* Display Signature */}
                      {selectedReceipt.workerSignature && (
                        <div className="pt-3 border-t border-construction-100 dark:border-construction-800 text-center">
                          <p className="text-[8px] font-bold text-construction-400 uppercase tracking-widest mb-1.5">Sign Tally Verify</p>
                          <div className="bg-slate-50 dark:bg-construction-950 p-1.5 rounded border border-construction-100/50 flex justify-center">
                            <img src={selectedReceipt.workerSignature} alt="Worker Sign" className="h-10 object-contain dark:invert" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => window.print()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-xs font-bold text-construction-700 dark:text-construction-300 hover:bg-construction-50"
                      >
                        <Printer className="w-4 h-4" />
                        Print Receipt
                      </button>
                      <button
                        onClick={() => handleDeleteReceipt(selectedReceipt.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 hover:bg-red-500/10 text-xs font-bold text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Rollback Payout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-construction-450 font-medium">
                    <FileText className="w-10 h-10 text-construction-300 mb-3" />
                    Select a receipt on the left to view full details and verification signatures.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
