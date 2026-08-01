import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  IndianRupee, 
  Signature, 
  Printer, 
  Eye,
  Trash2,
  FileText
} from 'lucide-react';
import type { Worker, PaymentRecord } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { slideUp, staggerContainer } from '../../utils/animations';
import { useWorkers, useAttendance, usePayments, useAddPayment, useRemovePayment } from '../../api/queries';
import { appConfig, formatCurrency } from '../../config/appConfig';
import { elementToPdf } from '../../utils/pdf';

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

  const handlePrintReceipt = async () => {
    const el = document.getElementById('salary-slip');
    if (!el || !selectedReceipt) return;
    setPrintingReceipt(true);
    try {
      await elementToPdf(el, { filename: `${selectedReceipt.workerName.replace(/\s+/g, '_')}_Salary_Receipt.pdf` });
      showToast('Salary receipt PDF downloaded.');
    } catch (err) {
      console.error(err);
      showToast('Could not generate PDF.', 'error');
    } finally {
      setPrintingReceipt(false);
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
  const [printingReceipt, setPrintingReceipt] = useState(false);

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
    const currentMonth = new Date().toISOString().slice(0, 7);
    const workerAttendance = localAttendance.filter(a => 
      a.workerId === worker.id && a.date.startsWith(currentMonth)
    );

    const presents = workerAttendance.filter(a => a.status === 'Present').length;
    const halfDays = workerAttendance.filter(a => a.status === 'Half-Day').length;
    const totalOTHours = workerAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const nightShifts = workerAttendance.filter(a => a.isNightShift).length;

    const baseEarned = worker.dailyWage * (presents + (0.5 * halfDays));
    const otEarned = totalOTHours * worker.overtimeRate;
    const nightEarned = nightShifts * appConfig.nightShiftAllowance; 

    const grossWages = baseEarned + otEarned + nightEarned;

    const totalPaid = localPayments
      .filter(p => p.workerId === worker.id && p.date.startsWith(new Date().toISOString().slice(0, 7)))
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

    ctx.strokeStyle = '#fffce1';
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
    showToast(`Payment of ${formatCurrency(payAmount)} logged for ${payingWorker.name}`);
    setPayingWorker(null);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      {/* Title */}
      <PageHeader
        eyebrow="payments"
        eyebrowColor="text-lilac"
        title={t('payments')}
        description={`Review live ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })} payroll sheets, release partial/full wages, and collect digital receipts.`}
      />

      {/* Wages Ledger Card */}
      <motion.div variants={slideUp}>
        <Card className="rounded-[8px] border border-border bg-card overflow-hidden">
          <div className="p-8 border-b border-border bg-card">
            <h3 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest">Wages Tally Sheet ({new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })})</h3>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 text-[12px] text-surface-50 font-semibold uppercase tracking-[0.08em] border-b border-border">
                <TableHead className="py-4 px-6">Worker ID & Name</TableHead>
                <TableHead className="py-4 px-6">Daily Wage</TableHead>
                <TableHead className="py-4 px-6 text-center">Presents / Half</TableHead>
                <TableHead className="py-4 px-6 text-center">OT Hours</TableHead>
                <TableHead className="py-4 px-6">Gross Earnings</TableHead>
                <TableHead className="py-4 px-6">Paid to Date</TableHead>
                <TableHead className="py-4 px-6">Balance Due</TableHead>
                <TableHead className="py-4 px-6 text-center">Payouts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {siteWorkers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center text-sm font-semibold text-surface-50">
                    No active workers assigned to this site.
                  </TableCell>
                </TableRow>
              ) : (
                siteWorkers.map(w => {
                  const financials = getWorkerFinancials(w);
                  const receipts = localPayments.filter(p => p.workerId === w.id);

                  return (
                    <TableRow key={w.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4 px-6">
                        <p className="font-bold text-surface-cream leading-tight">{w.name}</p>
                        <p className="text-[11px] text-surface-50 font-semibold mt-1 uppercase tracking-wider">{w.id} • {w.trade}</p>
                      </TableCell>

                      <TableCell className="py-4 px-6 font-semibold text-surface-cream whitespace-nowrap">
                        {formatCurrency(w.dailyWage)}
                      </TableCell>

                      <TableCell className="py-4 px-6 text-center font-bold text-surface-50 whitespace-nowrap">
                        {financials.presents} P / {financials.halfDays} H
                      </TableCell>

                      <TableCell className="py-4 px-6 text-center font-bold text-surface-50 whitespace-nowrap">
                        {financials.totalOTHours} hrs
                      </TableCell>

                      <TableCell className="py-4 px-6 font-semibold text-surface-cream whitespace-nowrap">
                        {formatCurrency(financials.grossWages)}
                      </TableCell>

                      <TableCell className="py-4 px-6 font-semibold text-surface-cream whitespace-nowrap">
                        {formatCurrency(financials.totalPaid)}
                      </TableCell>

                      <TableCell className="py-4 px-6 font-bold text-lilac whitespace-nowrap">
                        {formatCurrency(financials.balanceDue)}
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            className="px-4 py-2 text-xs font-semibold"
                            disabled={financials.balanceDue <= 0}
                            onClick={() => handleOpenPayout(w, financials.balanceDue)}
                            leftIcon={<IndianRupee className="w-4 h-4" />}
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
                              className="h-9 w-9 rounded-full text-surface-50 hover:bg-muted"
                            >
                              <Eye className="w-4 h-4" />
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
            <div className="space-y-6">
              <div className="p-6 rounded-[8px] bg-background border border-border text-surface-cream space-y-2.5 text-xs font-medium leading-relaxed">
                <p><span className="text-surface-50 font-normal">Worker:</span> <strong className="text-surface-cream">{payingWorker.name}</strong> ({payingWorker.id})</p>
                <p><span className="text-surface-50 font-normal">Assigned Trade:</span> {payingWorker.trade} ({payingWorker.skillLevel})</p>
                <p><span className="text-surface-50 font-normal">Bank Target:</span> {payingWorker.bankName} - A/C: {payingWorker.accountNumber}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-surface-50 uppercase tracking-widest block mb-2">Release Payout Amount ({appConfig.currency}) *</label>
                <Input
                  type="number"
                  value={payAmount.toString()}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="font-bold text-lg h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-surface-50 uppercase tracking-widest block mb-2">Payment Method</label>
                  <Select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="font-medium text-surface-cream"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-surface-50 uppercase tracking-widest block mb-2">Reference No</label>
                  <Input
                    type="text"
                    placeholder="Txn ID"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="h-12 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-surface-50 uppercase tracking-widest block mb-2">Receipt Notes</label>
                <Input
                  type="text"
                  placeholder="e.g. Paid full July wage cycle"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="h-12 text-sm"
                />
              </div>

              {/* Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-surface-50 uppercase tracking-widest flex items-center gap-1.5">
                    <Signature className="w-4 h-4 text-surface-cream" />
                    Labor Signature
                  </label>
                  {hasSignature && (
                    <button
                      onClick={clearSignature}
                      className="text-xs font-bold text-fn-error hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="border border-border rounded-[8px] bg-background overflow-hidden relative touch-none">
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
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-surface-50 font-semibold">
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
            <div className="flex flex-col md:flex-row h-auto md:h-[60vh] -mx-6 -mb-6 -mt-2">
              {/* Left Side: Receipts list */}
              <div className="w-full md:w-1/3 border-r border-border overflow-y-auto p-6 space-y-2.5 max-h-[220px] md:max-h-none shrink-0 bg-background">
                <p className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mb-4">All Payout slips</p>
                {localPayments.filter(p => p.workerId === viewingReceiptsWorker.id).map(pay => (
                  <button
                    key={pay.id}
                    onClick={() => setSelectedReceipt(pay)}
                    className={`w-full text-left p-4 rounded-[8px] border transition-all ${
                      selectedReceipt?.id === pay.id
                        ? 'border-lilac bg-lilac/10'
                        : 'border-border hover:bg-card bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="text-surface-cream">{formatCurrency(pay.amount)}</span>
                      <span className="text-[11px] text-surface-50">{pay.date}</span>
                    </div>
                    <p className="text-[11px] text-surface-50 mt-2 font-medium">{pay.paymentType} • Ref: {pay.referenceNumber || 'N/A'}</p>
                  </button>
                ))}
              </div>

              {/* Right Side: Receipt Detail Viewer */}
              <div className="w-full md:w-2/3 p-6 sm:p-10 overflow-y-auto bg-background border-l border-border flex flex-col justify-between">
                {selectedReceipt ? (
                  <div className="space-y-8">
                    {/* Receipt Sheet */}
                    <Card id="salary-slip" className="bg-card border border-border rounded-[8px] overflow-hidden">
                      <CardContent className="p-8 sm:p-10 space-y-8">
                        <div className="text-center pb-8 border-b border-border">
                          <h4 className="text-[22px] font-semibold text-surface-cream tracking-tight">MusterMate Buildcon</h4>
                          <p className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mt-2">Wage Payment Receipt</p>
                        </div>
                        
                        <div className="text-[13px] text-surface-50 space-y-3.5 font-medium">
                          <div className="flex justify-between"><span>Receipt ID:</span> <span className="font-semibold text-surface-cream">{selectedReceipt.id}</span></div>
                          <div className="flex justify-between"><span>Date:</span> <span className="font-semibold text-surface-cream">{selectedReceipt.date}</span></div>
                          <div className="flex justify-between"><span>Worker:</span> <span className="font-semibold text-surface-cream">{selectedReceipt.workerName}</span></div>
                          <div className="flex justify-between"><span>Paid Amount:</span> <span className="font-bold text-surface-cream">{formatCurrency(selectedReceipt.amount)}</span></div>
                          <div className="flex justify-between"><span>Paid Via:</span> <span className="font-semibold text-surface-cream">{selectedReceipt.paymentType}</span></div>
                          {selectedReceipt.referenceNumber && (
                            <div className="flex justify-between"><span>Ref No:</span> <span className="font-semibold text-surface-cream">{selectedReceipt.referenceNumber}</span></div>
                          )}
                          {selectedReceipt.notes && (
                            <div className="flex justify-between"><span>Notes:</span> <span className="font-semibold text-surface-cream leading-normal">{selectedReceipt.notes}</span></div>
                          )}
                        </div>

                        {/* Display Signature */}
                        {selectedReceipt.workerSignature && (
                          <div className="pt-6 border-t border-border text-center">
                            <p className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mb-3">Sign Tally Verify</p>
                            <div className="bg-background p-3.5 rounded-[8px] border border-border inline-block">
                              <img src={selectedReceipt.workerSignature} alt="Worker Sign" className="h-14 object-contain" />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1 py-3.5"
                        onClick={handlePrintReceipt}
                        disabled={printingReceipt}
                        leftIcon={<Printer className="w-4 h-4" />}
                      >
                        {printingReceipt ? 'Preparing PDF…' : 'Print Receipt'}
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 py-3.5 text-fn-error hover:bg-fn-error/10 hover:text-fn-error"
                        onClick={() => handleDeleteReceipt(selectedReceipt.id)}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Rollback Payout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-surface-50">
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
