import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  Search, 
  UserPlus, 
  FileSpreadsheet, 
  Eye, 
  Trash2, 
  Printer, 
  Edit3,
  User,
  FileText,
  Calendar
} from 'lucide-react';
import type { Worker, AttendanceRecord, PaymentRecord } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { PhotoUpload } from '../../components/ui/PhotoUpload';
import { DatePicker } from '../../components/ui/DatePicker';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { slideUp, staggerContainer } from '../../utils/animations';
import { 
  useWorkers, useSites, useAttendance, usePayments, useUsers, 
  useAddWorker, useDeleteWorker, useAddUser, useRemoveUser, useOrganization 
} from '../../api/queries';
import { appConfig, makeId, formatCurrency } from '../../config/appConfig';
import { elementToPdf } from '../../utils/pdf';

export const Workers = () => {
  const { activeSiteId, currentLanguage, currentUser } = useAppStore();
  const { data: workers = [] } = useWorkers();
  const { data: sites = [] } = useSites();
  const { data: attendance = [] } = useAttendance();
  const { data: payments = [] } = usePayments();
  const { data: users = [] } = useUsers();
  const { data: organization } = useOrganization();
  
  const { mutate: addWorker } = useAddWorker();
  const { mutate: deleteWorker } = useDeleteWorker();
  const { mutate: addUser } = useAddUser();
  const { mutate: removeUser } = useRemoveUser();
  const { t } = useTranslation(currentLanguage);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [selectedSite, setSelectedSite] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [selfLoginEnabled, setSelfLoginEnabled] = useState(false);
  const [labourPassword, setLabourPassword] = useState('');
  const [labourUsername, setLabourUsername] = useState('');
  const [credentialModal, setCredentialModal] = useState<{ username: string; password: string; workerName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [printingCard, setPrintingCard] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    gender: 'Male',
    dob: '',
    phone: '',
    emergencyContact: '',
    address: '',
    village: '',
    district: '',
    state: '',
    pinCode: '',
    aadhaar: '',
    pan: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    trade: 'Mason',
    department: 'Civil',
    skillLevel: 'Skilled' as any,
    dailyWage: 0,
    overtimeRate: 0,
    currentSiteId: activeSiteId,
    notes: '',
    photo: '',
  });

  const trades = ['All', ...new Set(workers.map(w => w.trade))];

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.trade.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTrade = selectedTrade === 'All' || w.trade === selectedTrade;
    const matchesSite = selectedSite === 'All' || w.currentSiteId === selectedSite;
    const matchesSkill = selectedSkill === 'All' || w.skillLevel === selectedSkill;

    return matchesSearch && matchesTrade && matchesSite && matchesSkill;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dailyWage' || name === 'overtimeRate' ? Number(value) : value
    }));
  };

  const resetForm = () => {
    setEditingWorkerId(null);
    setSelfLoginEnabled(false);
    setLabourPassword('');
    setLabourUsername('');
    setFormData({
      name: '', fatherName: '', gender: 'Male', dob: '', phone: '', emergencyContact: '',
      address: '', village: '', district: '', state: '', pinCode: '', aadhaar: '', pan: '',
      bankName: '', accountNumber: '', ifscCode: '', upiId: '', trade: 'Mason', department: 'Civil',
      skillLevel: 'Skilled', dailyWage: 0, overtimeRate: 0, currentSiteId: activeSiteId, notes: '', photo: ''
    });
  };

  const handleEditWorker = (worker: Worker) => {
    const linkedUser = users.find(u => u.workerId === worker.id);
    setEditingWorkerId(worker.id);
    setSelfLoginEnabled(!!linkedUser);
    setLabourPassword('');
    setLabourUsername(linkedUser?.username || '');
    
    setFormData({
      name: worker.name,
      fatherName: worker.fatherName || '',
      gender: worker.gender || 'Male',
      dob: worker.dob || '',
      phone: worker.phone || '',
      emergencyContact: worker.emergencyContact || '',
      address: worker.address || '',
      village: worker.village || '',
      district: worker.district || '',
      state: worker.state || '',
      pinCode: worker.pinCode || '',
      aadhaar: worker.aadhaar || '',
      pan: worker.pan || '',
      bankName: worker.bankName || '',
      accountNumber: worker.accountNumber || '',
      ifscCode: worker.ifscCode || '',
      upiId: worker.upiId || '',
      trade: worker.trade || 'Mason',
      department: worker.department || 'Civil',
      skillLevel: worker.skillLevel || 'Skilled',
      dailyWage: worker.dailyWage || 0,
      overtimeRate: worker.overtimeRate || 0,
      currentSiteId: worker.currentSiteId || activeSiteId,
      notes: worker.notes || '',
      photo: worker.photo || '',
    });
    setShowAddModal(true);
  };

  const handleRegisterWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.aadhaar) {
      showToast('Name, Phone, and Aadhaar are required!', 'error');
      return;
    }

    const workerId = editingWorkerId || makeId('WRK');

    if (editingWorkerId) {
      const existing = workers.find(w => w.id === editingWorkerId);
      const updatedWorker: Worker = {
        ...existing,
        ...formData,
        id: editingWorkerId,
        joiningDate: existing?.joiningDate || new Date().toISOString().split('T')[0],
        status: existing?.status || 'Active',
        photo: formData.photo || existing?.photo || appConfig.defaultWorkerPhoto,
        documents: existing?.documents || [],
      };
      addWorker(updatedWorker);
      showToast(`Worker ${formData.name} updated successfully!`);
    } else {
      const newWorker: Worker = {
        ...formData,
        id: workerId,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        photo: formData.photo || appConfig.defaultWorkerPhoto,
        documents: [],
      };
      addWorker(newWorker);
      showToast(`Worker ${formData.name} registered successfully!`);
    }

    const linkedUser = users.find(u => u.workerId === workerId);
    if (selfLoginEnabled) {
      const userPayload = {
        uid: linkedUser?.uid || `usr-labour-${Date.now()}`,
        name: formData.name,
        username: labourUsername || undefined,
        email: '',
        phone: formData.phone,
        role: 'labour' as const,
        siteId: formData.currentSiteId,
        organizationId: currentUser?.organizationId || '',
        workerId: workerId,
        password: labourPassword || undefined,
        photo: formData.photo || undefined
      };
      addUser(userPayload);

      // One-time display of freshly set credentials so the owner knows what was created.
      if (!linkedUser && labourUsername && labourPassword) {
        setCredentialModal({ username: labourUsername, password: labourPassword, workerName: formData.name });
      } else if (!linkedUser && labourUsername && !labourPassword) {
        showToast(`Login created with username "${labourUsername}" (password not set).`, 'info');
      }
    } else if (linkedUser) {
      removeUser(linkedUser.uid);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleExportCSV = () => {
    const headers = 'ID,Name,Phone,Trade,Skill Level,Daily Wage,Aadhaar,Bank Name,Account No\n';
    const rows = filteredWorkers.map(w => 
      `"${w.id}","${w.name}","${w.phone}","${w.trade}","${w.skillLevel}",${w.dailyWage},"${w.aadhaar}","${w.bankName}","${w.accountNumber}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(organization?.name || 'Workers').replace(/[^a-zA-Z0-9]+/g, '_')}_Workers_${activeSiteId}_${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    showToast('Workers export csv generated successfully!');
  };

  const handlePrintCard = async () => {
    const el = document.getElementById('worker-muster-card');
    if (!el || !viewingWorker) return;
    setPrintingCard(true);
    try {
      await elementToPdf(el, { filename: `${viewingWorker.name.replace(/\s+/g, '_')}_Muster_Card.pdf` });
      showToast('Muster card PDF downloaded.');
    } catch (err) {
      console.error(err);
      showToast('Could not generate PDF.', 'error');
    } finally {
      setPrintingCard(false);
    }
  };

  const getWorkerMusterStats = (workerId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const workerAtt = attendance.filter(a => a.workerId === workerId && a.date.startsWith(currentMonth));
    
    const presents = workerAtt.filter(a => a.status === 'Present').length;
    const halfDays = workerAtt.filter(a => a.status === 'Half-Day').length;
    const absents = workerAtt.filter(a => a.status === 'Absent').length;
    const paidLeaves = workerAtt.filter(a => a.status === 'Paid-Leave').length;
    const weeklyOffs = workerAtt.filter(a => a.status === 'Weekly-Off').length;
    const holidays = workerAtt.filter(a => a.status === 'Holiday').length;
    const totalOTHours = workerAtt.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const nightShiftsCount = workerAtt.filter(a => a.isNightShift).length;

    return { presents, halfDays, absents, paidLeaves, weeklyOffs, holidays, totalOTHours, nightShiftsCount };
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      {/* Page Title & Actions */}
      <PageHeader
        eyebrow="workers"
        eyebrowColor="text-orangey"
        title={t('workers')}
        description="Manage profiles, documents, bank credentials, and digital muster sheets."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={handleExportCSV} leftIcon={<FileSpreadsheet className="w-5 h-5 text-orangey" />}>
              Export CSV
            </Button>
            
            <Button onClick={() => { resetForm(); setShowAddModal(true); }} leftIcon={<UserPlus className="w-5 h-5" />}>
              {t('addWorker')}
            </Button>
          </div>
        }
      />

      {/* Search & Filters */}
      <motion.div variants={slideUp}>
        <Card className="border border-border">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-end gap-5">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5 text-surface-50" />}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <Select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="text-sm"
              >
                <option value="All">All Sites</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>

              <Select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="text-sm"
              >
                {trades.map(t => <option key={t} value={t}>{t === 'All' ? 'All Trades' : t}</option>)}
              </Select>

              <Select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="text-sm col-span-2 sm:col-span-1"
              >
                <option value="All">All Skills</option>
                <option value="Helper">Helper</option>
                <option value="Semi-Skilled">Semi-Skilled</option>
                <option value="Skilled">Skilled</option>
                <option value="Highly-Skilled">Highly-Skilled</option>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Workers Table */}
      <motion.div variants={slideUp}>
        <Card className="overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker ID & Name</TableHead>
                <TableHead>Trade & Dept</TableHead>
                <TableHead>Skill Level</TableHead>
                <TableHead>Daily Wage</TableHead>
                <TableHead>Assigned Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-border" />
                        <div className="space-y-1">
                          <div className="h-4 w-28 bg-border rounded" />
                          <div className="h-3 w-16 bg-border rounded mt-1" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-border rounded" />
                        <div className="h-3 w-14 bg-border rounded mt-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-16 bg-border rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 bg-border rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-border rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-14 bg-border rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-8 w-16 bg-border rounded ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredWorkers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No workers match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkers.map(w => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={w.photo} alt={w.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                        <div>
                          <p className="font-bold text-surface-cream">{w.name}</p>
                          <p className="text-[11px] text-surface-50 font-semibold mt-0.5">{w.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-surface-cream">{w.trade}</p>
                      <p className="text-[11px] text-surface-50 font-medium mt-0.5">{w.department}</p>
                    </TableCell>
                    <TableCell>
                      <Badge color={w.skillLevel === 'Highly-Skilled' ? 'cream' : w.skillLevel === 'Skilled' ? 'default' : 'muted'}>
                        {w.skillLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-surface-cream whitespace-nowrap">
                      {formatCurrency(w.dailyWage)} / day
                    </TableCell>
                    <TableCell className="font-medium text-surface-50">
                      {sites.find(s => s.id === w.currentSiteId)?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <Badge color={w.status === 'Active' ? 'success' : 'muted'}>
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" className="px-3" onClick={() => setViewingWorker(w)} title="View Profile">
                          <Eye className="w-4 h-4 text-surface-50 mr-1" /> View
                        </Button>
                        <Button variant="ghost" size="sm" className="px-3" onClick={() => handleEditWorker(w)} title="Edit Worker">
                          <Edit3 className="w-4 h-4 text-surface-50 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="px-3 hover:bg-fn-error/10 hover:text-fn-error" onClick={() => {
                          if (confirm(`Are you sure you want to delete worker ${w.name}?`)) {
                            deleteWorker(w.id);
                            showToast(`Worker ${w.name} removed successfully.`);
                          }
                        }} title="Delete Worker">
                          <Trash2 className="w-4 h-4 text-fn-error mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* View Worker Modal / Drawer */}
      <AnimatePresence>
        {viewingWorker && (
          <Modal 
            isOpen={!!viewingWorker} 
            onClose={() => setViewingWorker(null)}
            title={viewingWorker.name}
            description="Profile & digital Muster Card"
            className="max-w-4xl"
          >
            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div id="worker-muster-card" className="p-8 sm:p-10 rounded-[8px] bg-card border border-border flex flex-col sm:flex-row items-center gap-8">
                <img src={viewingWorker.photo} alt={viewingWorker.name} className="w-28 h-28 rounded-full object-cover shrink-0 border-2 border-border" />
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h4 className="text-[26px] font-semibold text-surface-cream tracking-tight">{viewingWorker.name}</h4>
                  <p className="text-[13px] text-surface-50 font-semibold uppercase tracking-wider">Trade: {viewingWorker.trade} • {viewingWorker.skillLevel}</p>
                  <p className="text-[11px] text-surface-50 font-bold uppercase tracking-widest mt-1">ID: {viewingWorker.id} • Joining Date: {viewingWorker.joiningDate}</p>
                </div>
                <div className="shrink-0 flex sm:flex-col gap-3 font-semibold text-xs tracking-wider">
                  <span className="bg-background border border-orangey/40 text-orangey px-5 py-2.5 rounded-full text-center">
                    Wage: {formatCurrency(viewingWorker.dailyWage)}/day
                  </span>
                  <span className="bg-background border border-border px-5 py-2.5 rounded-full text-center text-surface-cream">
                    OT: {formatCurrency(viewingWorker.overtimeRate)}/hr
                  </span>
                </div>
              </div>

              {/* Tabs / Sub-Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Personal & Bank Details */}
                <div className="space-y-6 md:col-span-1">
                  <div>
                    <h5 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                      <User className="w-4 h-4 text-surface-cream" />
                      Personal Bio
                    </h5>
                    <ul className="text-[13px] space-y-3 text-surface-cream font-medium">
                      <li><span className="text-surface-50 font-normal">Father's Name:</span> {viewingWorker.fatherName}</li>
                      <li><span className="text-surface-50 font-normal">Gender / DOB:</span> {viewingWorker.gender} • {viewingWorker.dob}</li>
                      <li><span className="text-surface-50 font-normal">Phone:</span> {viewingWorker.phone}</li>
                      <li><span className="text-surface-50 font-normal">Emergency:</span> {viewingWorker.emergencyContact}</li>
                      <li className="leading-relaxed"><span className="text-surface-50 font-normal">Address:</span> {viewingWorker.address}, {viewingWorker.village}, {viewingWorker.district}, {viewingWorker.state} - {viewingWorker.pinCode}</li>
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h5 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                      <FileText className="w-4 h-4 text-surface-cream" />
                      Verified Documents
                    </h5>
                    <ul className="text-[13px] space-y-3 text-surface-cream font-medium">
                      <li><span className="text-surface-50 font-normal">Aadhaar Card:</span> {viewingWorker.aadhaar}</li>
                      <li><span className="text-surface-50 font-normal">PAN Card:</span> {viewingWorker.pan || 'N/A'}</li>
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h5 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                      <User className="w-4 h-4 text-surface-cream" />
                      Bank Account Info
                    </h5>
                    <ul className="text-[13px] space-y-3 text-surface-cream font-medium">
                      <li><span className="text-surface-50 font-normal">Bank Name:</span> {viewingWorker.bankName}</li>
                      <li><span className="text-surface-50 font-normal">Account No:</span> {viewingWorker.accountNumber}</li>
                      <li><span className="text-surface-50 font-normal">IFSC Code:</span> {viewingWorker.ifscCode}</li>
                      <li><span className="text-surface-50 font-normal">UPI ID:</span> {viewingWorker.upiId || 'N/A'}</li>
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h5 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                      <User className="w-4 h-4 text-surface-cream" />
                      Login Credentials
                    </h5>
                    {(() => {
                      const linkedUser = users.find(u => u.workerId === viewingWorker.id);
                      if (!linkedUser) {
                        return (
                          <p className="text-[13px] text-surface-50 font-medium">
                            No self-login set up. Edit the worker and enable <span className="text-surface-cream font-semibold">Labour Self-Login</span> to create credentials.
                          </p>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          <p className="text-[13px] text-surface-cream font-medium">
                            <span className="text-surface-50 font-normal">Username:</span> <span className="select-all font-bold">{linkedUser.username || '—'}</span>
                          </p>
                          <p className="text-[13px] text-surface-50 font-medium">Password is securely hashed and cannot be viewed. Reset it via Edit Profile.</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Digital Muster Card (Monthly Calendar Sheet) */}
                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[14px] font-bold uppercase tracking-wider text-surface-cream flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orangey" />
                      {t('musterCard')} • {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </h5>
                    
                    <Button variant="ghost" size="sm" onClick={handlePrintCard} disabled={printingCard} leftIcon={<Printer className="w-4 h-4" />}>
                      {printingCard ? 'Preparing PDF…' : 'Print Card'}
                    </Button>
                  </div>

                  {/* Calendar Sheet Grid (31 Days) */}
                  <div className="grid grid-cols-7 gap-2 border border-border p-6 rounded-[8px] bg-background text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <div key={idx} className="text-[11px] font-bold text-surface-50 py-1 uppercase tracking-widest">{day}</div>
                    ))}
                    
                    {[...Array(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay())].map((_, i) => <div key={`pad-${i}`} className="py-2.5" />)}

                    {[...Array(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())].map((_, i) => {
                      const dayNumber = i + 1;
                      const musterMonth = new Date().toISOString().slice(0, 7);
                      const dateStr = `${musterMonth}-${dayNumber.toString().padStart(2, '0')}`;
                      
                      const attendanceRecord = attendance.find(a => a.workerId === viewingWorker.id && a.date === dateStr);
                      const status = attendanceRecord ? attendanceRecord.status : 'Unmarked';
                      
                      const statusColorMap: Record<string, string> = {
                        'Present': 'bg-highlight text-highlight-foreground font-bold',
                        'Half-Day': 'bg-fn-warning/10 border border-fn-warning/30 text-fn-warning font-bold',
                        'Absent': 'bg-background border border-border text-surface-50/60',
                        'Paid-Leave': 'bg-background border border-border text-surface-cream font-bold',
                        'Unpaid-Leave': 'bg-background border border-border/40 text-surface-50/50',
                        'Weekly-Off': 'bg-background border border-border/40 text-surface-cream/80 font-bold',
                        'Holiday': 'bg-card text-surface-cream/80 font-bold',
                        'Unmarked': 'bg-transparent text-surface-50/30 hover:bg-muted/50 transition-colors'
                      };

                      return (
                        <div 
                          key={dayNumber} 
                          className={`py-2.5 text-xs rounded-[8px] flex flex-col items-center justify-center border border-transparent cursor-default transition-all ${
                            statusColorMap[status] || 'bg-transparent'
                          }`}
                          title={`Date: ${dateStr}\nStatus: ${status}`}
                        >
                          <span className="block font-bold">{dayNumber}</span>
                          <span className="block text-[11px] font-black opacity-80 mt-0.5 uppercase tracking-wide">
                            {status === 'Present' ? 'P' :
                             status === 'Half-Day' ? 'H' :
                             status === 'Absent' ? 'A' :
                             status === 'Paid-Leave' ? 'PL' :
                             status === 'Unpaid-Leave' ? 'UL' :
                             status === 'Weekly-Off' ? 'WO' :
                             status === 'Holiday' ? 'HD' : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Muster Card Summary and Wage Tally */}
                  {(() => {
                    const stats = getWorkerMusterStats(viewingWorker.id);
                    let grossWages = 0;
                    const musterMonth = new Date().toISOString().slice(0, 7);
                    const monthlyWages = attendance.filter(a => a.workerId === viewingWorker.id && a.date.startsWith(musterMonth));
                      
                    monthlyWages.forEach((rec: AttendanceRecord) => {
                      if (rec.status === 'Present') grossWages += viewingWorker.dailyWage;
                      else if (rec.status === 'Half-Day') grossWages += viewingWorker.dailyWage * 0.5;
                      if (rec.overtimeHours > 0) grossWages += rec.overtimeHours * viewingWorker.overtimeRate;
                      if (rec.isNightShift) grossWages += appConfig.nightShiftAllowance;
                    });

                    const totalPaid = payments
                      .filter(p => p.workerId === viewingWorker.id && p.date.startsWith(musterMonth))
                      .reduce((sum: number, p: PaymentRecord) => sum + p.amount, 0);

                    const pendingBalance = Math.max(0, grossWages - totalPaid);

                    return (
                      <div className="space-y-6">
                        {/* Attendance Counter Grid */}
                        <div className="grid grid-cols-4 gap-4 text-center text-[11px] uppercase tracking-widest font-bold">
                          <div className="p-4 rounded-[8px] border border-border bg-highlight text-highlight-foreground">
                            <p className="opacity-70">Presents</p>
                            <h4 className="text-[24px] font-semibold mt-2">{stats.presents}</h4>
                          </div>
                          <div className="p-4 rounded-[8px] border border-border bg-background text-fn-warning">
                            <p className="opacity-80">Half-Days</p>
                            <h4 className="text-[24px] font-semibold mt-2">{stats.halfDays}</h4>
                          </div>
                          <div className="p-4 rounded-[8px] border border-border bg-card text-surface-cream">
                            <p className="text-surface-50">Absents</p>
                            <h4 className="text-[24px] font-semibold mt-2">{stats.absents}</h4>
                          </div>
                          <div className="p-4 rounded-[8px] border border-border bg-background text-surface-cream">
                            <p className="text-surface-50">OT Hours</p>
                            <h4 className="text-[24px] font-semibold mt-2">{stats.totalOTHours}h</h4>
                          </div>
                        </div>

                        {/* Wage Breakdown Box */}
                        <div className="p-8 rounded-[8px] border border-border bg-card space-y-4">
                          <h6 className="text-[11px] font-bold text-surface-50 uppercase tracking-[0.12em] mb-4">{new Date().toLocaleString('en-US', { month: 'long' })} Earnings Statement</h6>
                          
                          <div className="flex items-center justify-between text-[13px] font-medium text-surface-50">
                            <span>Base Wage Earned:</span>
                            <span className="font-semibold text-surface-cream">{formatCurrency(grossWages - (stats.totalOTHours * viewingWorker.overtimeRate) - (stats.nightShiftsCount * appConfig.nightShiftAllowance))}</span>
                          </div>
                          <div className="flex items-center justify-between text-[13px] font-medium text-surface-50">
                            <span>Overtime Earned ({stats.totalOTHours} hrs):</span>
                            <span className="font-semibold text-surface-cream">{formatCurrency(stats.totalOTHours * viewingWorker.overtimeRate)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[13px] font-medium text-surface-50">
                            <span>Night Shift Allowance:</span>
                            <span className="font-semibold text-surface-cream">{formatCurrency(stats.nightShiftsCount * appConfig.nightShiftAllowance)}</span>
                          </div>
                          
                          <div className="border-t border-border pt-4 flex items-center justify-between text-[14px] font-semibold text-surface-cream">
                            <span>Gross Monthly Wages:</span>
                            <span>{formatCurrency(grossWages)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[14px] font-semibold text-surface-cream bg-background border border-border p-3.5 rounded-[8px] mt-2">
                            <span>Total Wage Released (Paid):</span>
                            <span className="font-semibold">{formatCurrency(totalPaid)}</span>
                          </div>
                          
                          <div className="border-t border-border pt-6 mt-4 flex items-center justify-between text-[18px] font-bold text-surface-cream">
                            <span>Net Balance Due:</span>
                            <span className="text-shockingly-green">{formatCurrency(pendingBalance)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal: Register New Worker */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingWorkerId ? 'Edit Labor Profile' : 'Register New Labor Profile'}
      >
        <form onSubmit={handleRegisterWorker} className="space-y-8">
          
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mb-2">1. Basic Details</h4>
            <PhotoUpload
              label="Worker Photo"
              value={formData.photo}
              onChange={(photo) => setFormData(prev => ({ ...prev, photo }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name *" name="name" required value={formData.name} onChange={handleInputChange} />
              <Input label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
              <Input label="Phone Number *" name="phone" required value={formData.phone} onChange={handleInputChange} />
              <DatePicker label="Date of Birth" value={formData.dob} onChange={(v) => setFormData(prev => ({ ...prev, dob: v }))} />
              
              <Select label="Gender" name="gender" value={formData.gender} onChange={handleInputChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
              <Input label="Emergency Contact No" name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h4 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mb-2">2. Address details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input label="Local Address" name="address" value={formData.address} onChange={handleInputChange} />
              </div>
              <Input label="Village/Town" name="village" value={formData.village} onChange={handleInputChange} />
              <Input label="District" name="district" value={formData.district} onChange={handleInputChange} />
              <Input label="State" name="state" value={formData.state} onChange={handleInputChange} />
              <Input label="PIN Code" name="pinCode" value={formData.pinCode} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h4 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mb-2">3. KYC Identity & Bank Transfer Data</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Aadhaar Card No *" name="aadhaar" required placeholder="xxxx-xxxx-xxxx" value={formData.aadhaar} onChange={handleInputChange} />
              <Input label="PAN Card No" name="pan" placeholder="ABCDE1234F" value={formData.pan} onChange={handleInputChange} />
              <Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} />
              <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} />
              <Input label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} />
              <Input label="UPI ID" name="upiId" placeholder="name@upi" value={formData.upiId} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h4 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mb-2">4. Professional & Wage Parameters</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Trade Designation" name="trade" value={formData.trade} onChange={handleInputChange}>
                <option value="Mason">Mason (मिस्त्री)</option>
                <option value="Carpenter">Carpenter (बढ़ई)</option>
                <option value="Welder">Welder (वेल्डर)</option>
                <option value="Helper">Helper (मज़दूर)</option>
                <option value="Electrician">Electrician (बिजली मिस्त्री)</option>
                <option value="Plumber">Plumber (प्लंबर)</option>
              </Select>
              <Select label="Department" name="department" value={formData.department} onChange={handleInputChange}>
                <option value="Civil">Civil</option>
                <option value="Electrical">Electrical</option>
                <option value="Finishing">Finishing</option>
                <option value="Plumbing">Plumbing</option>
              </Select>
              <Select label="Skill Level" name="skillLevel" value={formData.skillLevel} onChange={handleInputChange}>
                <option value="Helper">Helper</option>
                <option value="Semi-Skilled">Semi-Skilled</option>
                <option value="Skilled">Skilled</option>
                <option value="Highly-Skilled">Highly-Skilled</option>
              </Select>
              <Input label={`Daily Base Wage (${appConfig.currency})`} type="number" name="dailyWage" value={formData.dailyWage.toString()} onChange={handleInputChange} />
              <Input label={`Overtime Hourly Rate (${appConfig.currency})`} type="number" name="overtimeRate" value={formData.overtimeRate.toString()} onChange={handleInputChange} />
              <Select label="Assign Construction Site" name="currentSiteId" value={formData.currentSiteId} onChange={handleInputChange}>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          </div>

            <Textarea label="Supervisor Notes / Remarks" name="notes" rows={3} value={formData.notes} onChange={handleInputChange} />

          {/* Labour Portal Self-Login Setup */}
          <div className="space-y-4 pt-8 border-t border-border mt-8 p-6 rounded-[8px] bg-background border">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="selfLoginEnabled"
                checked={selfLoginEnabled}
                onChange={(e) => setSelfLoginEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-surface-cream focus:ring-surface-cream border-border bg-background"
              />
              <label htmlFor="selfLoginEnabled" className="text-[14px] font-medium text-surface-cream select-none">
                Enable Labour Self-Login (मजदूर लॉगिन सक्षम करें)
              </label>
            </div>
            
            {selfLoginEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div>
                  <Input
                    label="Custom Username (यूज़रनेम)"
                    value={labourUsername}
                    onChange={(e) => setLabourUsername(e.target.value)}
                    placeholder="e.g. ramesh.skilled"
                  />
                </div>
                <div>
                  <Input 
                    label="Set Password * (पासवर्ड सेट करें)" 
                    type="password" 
                    required={!editingWorkerId} 
                    value={labourPassword} 
                    onChange={(e) => setLabourPassword(e.target.value)} 
                    placeholder={editingWorkerId ? 'Leave blank to keep existing' : 'e.g. yadav123'} 
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] text-surface-50 font-bold uppercase tracking-widest">LOGIN IDENTIFIER ID</p>
                  <p className="text-sm font-bold text-surface-cream mt-1.5 select-all bg-background p-2.5 rounded-[8px] border border-border">
                    {editingWorkerId || 'Will generate on registration'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Register Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* One-Time Login Credentials Modal */}
      <AnimatePresence>
        {credentialModal && (
          <Modal
            isOpen={!!credentialModal}
            onClose={() => setCredentialModal(null)}
            title="Login Credentials Created"
            description={`Self-login for ${credentialModal.workerName}`}
            className="max-w-md"
          >
            <div className="space-y-5">
              <div className="p-4 rounded-[8px] bg-fn-info/10 border border-fn-info/30 text-[13px] text-surface-cream leading-relaxed">
                These credentials are shown once. Store them somewhere safe — the password is encrypted and cannot be retrieved later.
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-surface-50 uppercase tracking-widest">Username (Login ID)</p>
                <p className="text-sm font-bold text-surface-cream select-all bg-background p-2.5 rounded-[8px] border border-border">
                  {credentialModal.username}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-surface-50 uppercase tracking-widest">Password</p>
                <p className="text-sm font-bold text-surface-cream select-all bg-background p-2.5 rounded-[8px] border border-border">
                  {credentialModal.password}
                </p>
              </div>

              <p className="text-[12px] text-surface-50 leading-relaxed">
                The worker can log in at the Labour Portal using these details. You can also change the username later from Edit Profile.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => navigator.clipboard.writeText(`${credentialModal.username} / ${credentialModal.password}`).then(() => showToast('Credentials copied to clipboard!'))}>
                  Copy
                </Button>
                <Button onClick={() => setCredentialModal(null)}>
                  Done
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
