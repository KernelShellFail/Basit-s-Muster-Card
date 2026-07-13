import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  IndianRupee, 
  Wallet, 
  Signature, 
  Printer, 
  Eye,
  Trash2,
  FileText
} from 'lucide-react';
import type { Worker, PaymentRecord } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { slideUp, staggerContainer } from '../../utils/animations';
import { useWorkers, useAttendance, usePayments, useAddPayment, useRemovePayment } from '../../api/queries';

export const Payments = () => {
  const { activeSiteId, currentLanguage } = useAppStore();
  const { data: workers = [] } = useWorkers();
  const { data: attendance = [] } = useAttendance();
  const { data: payments = [] } = usePayments();
  const { mutate: processPayment } = useAddPayment();
  const { mutate: removePayment } = useRemovePayment();
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

  const siteWorkers = workers.filter(w => w.currentSiteId === activeSiteId && w.status === 'Active');

  const [payingWorker, setPayingWorker] = useState<Worker | null>(null);
  const [viewingReceiptsWorker, setViewingReceiptsWorker] = useState<Worker | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  
  const [payAmount, setPayAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (payingWorker && canvasRef.current) {
      const canvas = canvasRef.current;
      // Set width to parent container width to prevent coordinate scaling issues on mobile
      canvas.width = canvas.parentElement?.clientWidth || 450;
      canvas.height = 150;
    }
  }, [payingWorker]);

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
    const nightEarned = nightShifts * 150; 

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

  const handleOpenPayout = (worker: Worker, balance: number) => {
    setPayingWorker(worker);
    setPayAmount(balance);
    setPaymentType('Cash');
    setReferenceNumber('');
    setPaymentNotes('');
    setHasSignature(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a'; 
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
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
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-[80px]">
      
      {/* Title */}
      <motion.div variants={slideUp}>
        <h1 className="text-[60px] font-medium tracking-[-1.8px] leading-[1] text-foreground">{t('payments')}</h1>
        <p className="text-[16px] text-muted-foreground font-medium mt-4">Review live July 2026 payroll sheets, release partial/full wages, and collect digital receipts.</p>
      </motion.div>

      {/* Wages Ledger Card */}
      <motion.div variants={slideUp}>
        <Card className="overflow-hidden border border-border">
          <div className="p-6 border-b border-border bg-background">
            <h3 className="text-[14px] font-medium text-muted-foreground uppercase tracking-widest">Wages Tally Sheet (July 2026)</h3>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker ID & Name</TableHead>
                <TableHead>Daily Wage</TableHead>
                <TableHead className="text-center">Presents / Half</TableHead>
                <TableHead className="text-center">OT Hours</TableHead>
                <TableHead>Gross Earnings</TableHead>
                <TableHead>Paid to Date</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead className="text-center">Payouts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteWorkers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center text-muted-foreground">
                    No active workers assigned to this site.
                  </TableCell>
                </TableRow>
              ) : (
                siteWorkers.map(w => {
                  const financials = getWorkerFinancials(w);
                  const receipts = localPayments.filter(p => p.workerId === w.id);

                  return (
                    <TableRow key={w.id}>
                      <TableCell>
                        <p className="font-bold text-foreground leading-tight">{w.name}</p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{w.id} • {w.trade}</p>
                      </TableCell>

                      <TableCell className="font-semibold text-foreground">
                        ₹{w.dailyWage}
                      </TableCell>

                      <TableCell className="text-center font-bold text-muted-foreground">
                        {financials.presents} P / {financials.halfDays} H
                      </TableCell>

                      <TableCell className="text-center font-bold text-muted-foreground">
                        {financials.totalOTHours} hrs
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        ₹{financials.grossWages}
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        ₹{financials.totalPaid}
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        ₹{financials.balanceDue}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            disabled={financials.balanceDue <= 0}
                            onClick={() => handleOpenPayout(w, financials.balanceDue)}
                            leftIcon={<IndianRupee className="w-5 h-5" />}
                          >
                            Pay Wage
                          </Button>
                          
                          {receipts.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setViewingReceiptsWorker(w);
                                setSelectedReceipt(receipts[receipts.length - 1]);
                              }}
                              title="View Payments Receipts Logs"
                            >
                              <Eye className="w-5 h-5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Modal: Process Payout Wage Receipt */}
      <AnimatePresence>
        {payingWorker && (
          <Modal
            isOpen={!!payingWorker}
            onClose={() => setPayingWorker(null)}
            title="Process Wage Payment Log"
          >
            <div className="space-y-8">
              <div className="p-6 rounded-[28px] bg-background border border-border text-foreground space-y-2">
                <p><span className="font-medium text-muted-foreground">Worker:</span> {payingWorker.name} ({payingWorker.id})</p>
                <p><span className="font-medium text-muted-foreground">Assigned Trade:</span> {payingWorker.trade} ({payingWorker.skillLevel})</p>
                <p><span className="font-medium text-muted-foreground">Bank Target:</span> {payingWorker.bankName} - A/C: {payingWorker.accountNumber}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Release Payout Amount (₹) *</label>
                <Input
                  type="number"
                  value={payAmount.toString()}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="font-bold text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Payment Method</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Reference No</label>
                  <Input
                    type="text"
                    placeholder="Txn ID"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Receipt Notes</label>
                <Input
                  type="text"
                  placeholder="e.g. Paid full July wage cycle"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              {/* Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Signature className="w-5 h-5 text-brand-500" />
                    Labor Signature
                  </label>
                  {hasSignature && (
                    <button
                      onClick={clearSignature}
                      className="text-xs font-bold text-destructive hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="border border-input rounded-xl bg-accent/10 overflow-hidden relative touch-none">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="signature-canvas w-full h-[150px] cursor-crosshair touch-none"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-muted-foreground font-semibold">
                      Draw signature here
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <Button variant="outline" onClick={() => setPayingWorker(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePayout}>
                  Submit Payment Log
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal: View Receipts / Salary Slips */}
      <AnimatePresence>
        {viewingReceiptsWorker && (
          <Modal
            isOpen={!!viewingReceiptsWorker}
            onClose={() => setViewingReceiptsWorker(null)}
            title={`Payment History - ${viewingReceiptsWorker.name}`}
            className="max-w-4xl"
          >
            <div className="flex flex-col md:flex-row h-[60vh] -mx-6 -mb-6 -mt-2">
              {/* Left Side: Receipts list */}
              <div className="w-full md:w-1/3 border-r border-border overflow-y-auto p-6 space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">All Payout slips</p>
                {localPayments.filter(p => p.workerId === viewingReceiptsWorker.id).map(pay => (
                  <button
                    key={pay.id}
                    onClick={() => setSelectedReceipt(pay)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedReceipt?.id === pay.id
                        ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-sm text-foreground">₹{pay.amount}</span>
                      <span className="text-[10px] text-muted-foreground">{pay.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">{pay.paymentType} • Ref: {pay.referenceNumber || 'N/A'}</p>
                  </button>
                ))}
              </div>

              {/* Right Side: Receipt Detail Viewer */}
              <div className="w-full md:w-2/3 p-6 sm:p-10 overflow-y-auto bg-background border-l border-border flex flex-col justify-between">
                {selectedReceipt ? (
                  <div className="space-y-8">
                    {/* Receipt Sheet */}
                    <Card id="salary-slip" className="bg-background border border-border">
                      <CardContent className="p-8 sm:p-10 space-y-8">
                        <div className="text-center pb-8 border-b border-border">
                          <h4 className="text-[24px] font-medium text-foreground tracking-[-0.72px]">MusterMate Buildcon</h4>
                          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-widest mt-2">Wage Payment Receipt</p>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-3 font-medium">
                          <div className="flex justify-between"><strong>Receipt ID:</strong> <span>{selectedReceipt.id}</span></div>
                          <div className="flex justify-between"><strong>Date:</strong> <span>{selectedReceipt.date}</span></div>
                          <div className="flex justify-between"><strong>Worker:</strong> <span>{selectedReceipt.workerName}</span></div>
                          <div className="flex justify-between"><strong>Paid Amount:</strong> <span className="font-bold text-foreground">₹{selectedReceipt.amount}</span></div>
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
                          <div className="pt-6 border-t border-border text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Sign Tally Verify</p>
                            <div className="bg-accent/50 p-3 rounded-xl border border-border inline-block">
                              <img src={selectedReceipt.workerSignature} alt="Worker Sign" className="h-16 object-contain dark:invert" />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.print()}
                        leftIcon={<Printer className="w-5 h-5" />}
                      >
                        Print Receipt
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteReceipt(selectedReceipt.id)}
                        leftIcon={<Trash2 className="w-5 h-5" />}
                      >
                        Rollback Payout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm font-medium">Select a receipt on the left to view full details</p>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
