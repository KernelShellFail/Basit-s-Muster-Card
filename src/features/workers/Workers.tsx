import { useState } from 'react';
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
  CreditCard,
  FileText,
  Calendar
} from 'lucide-react';
import type { Worker, AttendanceRecord, PaymentRecord } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { slideUp, staggerContainer } from '../../utils/animations';

export const Workers = () => {
  const { workers, sites, activeSiteId, addWorker, deleteWorker, currentLanguage, attendance, payments, users, addUser, removeUser } = useAppStore();
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
    dailyWage: 600,
    overtimeRate: 80,
    currentSiteId: activeSiteId,
    notes: '',
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
    setFormData({
      name: '', fatherName: '', gender: 'Male', dob: '', phone: '', emergencyContact: '',
      address: '', village: '', district: '', state: '', pinCode: '', aadhaar: '', pan: '',
      bankName: '', accountNumber: '', ifscCode: '', upiId: '', trade: 'Mason', department: 'Civil',
      skillLevel: 'Skilled', dailyWage: 600, overtimeRate: 80, currentSiteId: activeSiteId, notes: ''
    });
  };

  const handleEditWorker = (worker: Worker) => {
    const linkedUser = users.find(u => u.workerId === worker.id);
    setEditingWorkerId(worker.id);
    setSelfLoginEnabled(!!linkedUser);
    setLabourPassword('');
    
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
      dailyWage: worker.dailyWage || 600,
      overtimeRate: worker.overtimeRate || 80,
      currentSiteId: worker.currentSiteId || activeSiteId,
      notes: worker.notes || '',
    });
    setShowAddModal(true);
  };

  const handleRegisterWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.aadhaar) {
      showToast('Name, Phone, and Aadhaar are required!', 'error');
      return;
    }

    const workerId = editingWorkerId || `WRK-2026-0${workers.length + 1}`;

    if (editingWorkerId) {
      const existing = workers.find(w => w.id === editingWorkerId);
      const updatedWorker: Worker = {
        ...existing,
        ...formData,
        id: editingWorkerId,
        joiningDate: existing?.joiningDate || new Date().toISOString().split('T')[0],
        status: existing?.status || 'Active',
        photo: existing?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        documents: existing?.documents || [{ type: 'Aadhaar Card', url: '#' }],
      };
      addWorker(updatedWorker);
      showToast(`Worker ${formData.name} updated successfully!`);
    } else {
      const newWorker: Worker = {
        ...formData,
        id: workerId,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        documents: [{ type: 'Aadhaar Card', url: '#' }],
      };
      addWorker(newWorker);
      showToast(`Worker ${formData.name} registered successfully!`);
    }

    const linkedUser = users.find(u => u.workerId === workerId);
    if (selfLoginEnabled) {
      const userPayload = {
        uid: linkedUser?.uid || `usr-labour-${Date.now()}`,
        name: formData.name,
        email: `${formData.phone}@mustermate.com`,
        phone: formData.phone,
        role: 'labour' as const,
        siteId: formData.currentSiteId,
        organizationId: 'org-101',
        workerId: workerId,
        password: labourPassword || undefined
      };
      addUser(userPayload);
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
    a.download = `MusterMate_Workers_${activeSiteId}_July_2026.csv`;
    a.click();
    showToast('Workers export csv generated successfully!');
  };

  const getWorkerMusterStats = (workerId: string) => {
    const workerAtt = attendance.filter(a => a.workerId === workerId && a.date.startsWith('2026-07'));
    
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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      
      {/* Page Title & Actions */}
      <motion.div variants={slideUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{t('workers')}</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage profiles, documents, bank credentials, and digital muster sheets.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExportCSV} leftIcon={<FileSpreadsheet className="w-5 h-5 text-emerald-500" />}>
            Export CSV
          </Button>
          
          <Button onClick={() => { resetForm(); setShowAddModal(true); }} leftIcon={<UserPlus className="w-5 h-5" />}>
            {t('addWorker')}
          </Button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={slideUp}>
        <Card glass>
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5 text-muted-foreground" />}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="text-sm bg-background border border-input rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-brand-500 focus:outline-none transition-shadow"
              >
                <option value="All">All Sites</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="text-sm bg-background border border-input rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-brand-500 focus:outline-none transition-shadow"
              >
                {trades.map(t => <option key={t} value={t}>{t === 'All' ? 'All Trades' : t}</option>)}
              </select>

              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="text-sm bg-background border border-input rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-brand-500 focus:outline-none transition-shadow col-span-2 sm:col-span-1"
              >
                <option value="All">All Skills</option>
                <option value="Helper">Helper</option>
                <option value="Semi-Skilled">Semi-Skilled</option>
                <option value="Skilled">Skilled</option>
                <option value="Highly-Skilled">Highly-Skilled</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Workers Table */}
      <motion.div variants={slideUp}>
        <Card glass className="overflow-hidden">
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
              {filteredWorkers.length === 0 ? (
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
                          <p className="font-bold text-foreground">{w.name}</p>
                          <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">{w.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-foreground">{w.trade}</p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{w.department}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        w.skillLevel === 'Highly-Skilled' ? 'bg-purple-500/10 text-purple-500' :
                        w.skillLevel === 'Skilled' ? 'bg-blue-500/10 text-blue-500' :
                        w.skillLevel === 'Semi-Skilled' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {w.skillLevel}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      ₹{w.dailyWage} / day
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {sites.find(s => s.id === w.currentSiteId)?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                        w.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'Active' ? 'bg-emerald-500' : 'bg-destructive'}`} />
                        {w.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setViewingWorker(w)} title="View Profile">
                          <Eye className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditWorker(w)} title="Edit Worker">
                          <Edit3 className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (confirm(`Are you sure you want to delete worker ${w.name}?`)) {
                            deleteWorker(w.id);
                            showToast(`Worker ${w.name} removed successfully.`);
                          }
                        }} title="Delete Worker">
                          <Trash2 className="w-5 h-5 text-destructive" />
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
              <div className="p-6 rounded-2xl bg-accent/30 border border-border flex flex-col sm:flex-row items-center gap-5">
                <img src={viewingWorker.photo} alt={viewingWorker.name} className="w-24 h-24 rounded-full object-cover shrink-0 border-4 border-brand-500 shadow-sm" />
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h4 className="text-xl font-bold text-foreground">{viewingWorker.name}</h4>
                  <p className="text-sm text-muted-foreground font-semibold">Trade: {viewingWorker.trade} • {viewingWorker.skillLevel}</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">ID: {viewingWorker.id} • Joining Date: {viewingWorker.joiningDate}</p>
                </div>
                <div className="shrink-0 flex sm:flex-col gap-2">
                  <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-4 py-1.5 rounded-full border border-emerald-500/20">
                    Wage: ₹{viewingWorker.dailyWage}/day
                  </span>
                  <span className="bg-purple-500/10 text-purple-500 text-xs font-bold px-4 py-1.5 rounded-full border border-purple-500/20">
                    OT: ₹{viewingWorker.overtimeRate}/hr
                  </span>
                </div>
              </div>

              {/* Tabs / Sub-Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Personal & Bank Details */}
                <div className="space-y-6 md:col-span-1">
                  <div>
                    <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <User className="w-5 h-5 text-brand-500" />
                      Personal Bio
                    </h5>
                    <ul className="text-sm space-y-2.5 text-foreground font-medium">
                      <li><span className="text-muted-foreground">Father's Name:</span> {viewingWorker.fatherName}</li>
                      <li><span className="text-muted-foreground">Gender / DOB:</span> {viewingWorker.gender} • {viewingWorker.dob}</li>
                      <li><span className="text-muted-foreground">Phone:</span> {viewingWorker.phone}</li>
                      <li><span className="text-muted-foreground">Emergency:</span> {viewingWorker.emergencyContact}</li>
                      <li><span className="text-muted-foreground">Address:</span> {viewingWorker.address}, {viewingWorker.village}, {viewingWorker.district}, {viewingWorker.state} - {viewingWorker.pinCode}</li>
                    </ul>
                  </div>

                  <div className="pt-5 border-t border-border">
                    <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <FileText className="w-5 h-5 text-brand-500" />
                      Verified Documents
                    </h5>
                    <ul className="text-sm space-y-2.5 text-foreground font-medium">
                      <li><span className="text-muted-foreground">Aadhaar Card:</span> {viewingWorker.aadhaar}</li>
                      <li><span className="text-muted-foreground">PAN Card:</span> {viewingWorker.pan || 'N/A'}</li>
                    </ul>
                  </div>

                  <div className="pt-5 border-t border-border">
                    <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <CreditCard className="w-5 h-5 text-brand-500" />
                      Bank Account Info
                    </h5>
                    <ul className="text-sm space-y-2.5 text-foreground font-medium">
                      <li><span className="text-muted-foreground">Bank Name:</span> {viewingWorker.bankName}</li>
                      <li><span className="text-muted-foreground">Account No:</span> {viewingWorker.accountNumber}</li>
                      <li><span className="text-muted-foreground">IFSC Code:</span> {viewingWorker.ifscCode}</li>
                      <li><span className="text-muted-foreground">UPI ID:</span> {viewingWorker.upiId || 'N/A'}</li>
                    </ul>
                  </div>
                </div>

                {/* Digital Muster Card (Monthly Calendar Sheet) */}
                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-brand-500" />
                      {t('musterCard')} • July 2026
                    </h5>
                    
                    <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-5 h-5" />}>
                      Print Card
                    </Button>
                  </div>

                  {/* Calendar Sheet Grid (31 Days) */}
                  <div className="grid grid-cols-7 gap-1.5 border border-border p-4 rounded-2xl bg-accent/20 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <div key={idx} className="text-[11px] font-extrabold text-muted-foreground py-1">{day}</div>
                    ))}
                    
                    {[...Array(3)].map((_, i) => <div key={`pad-${i}`} className="py-2.5" />)}

                    {[...Array(31)].map((_, i) => {
                      const dayNumber = i + 1;
                      const dateStr = `2026-07-${dayNumber.toString().padStart(2, '0')}`;
                      
                      const attendanceRecord = attendance.find(a => a.workerId === viewingWorker.id && a.date === dateStr);
                      const status = attendanceRecord ? attendanceRecord.status : 'Unmarked';
                      
                      const statusColorMap: Record<string, string> = {
                        'Present': 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-600/20',
                        'Half-Day': 'bg-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-500/20',
                        'Absent': 'bg-destructive text-white shadow-sm ring-1 ring-destructive/20',
                        'Paid-Leave': 'bg-blue-500 text-white shadow-sm',
                        'Unpaid-Leave': 'bg-muted text-muted-foreground',
                        'Weekly-Off': 'bg-accent text-foreground',
                        'Holiday': 'bg-amber-500/20 text-amber-500',
                        'Unmarked': 'bg-transparent text-muted-foreground hover:bg-accent/50 transition-colors'
                      };

                      return (
                        <div 
                          key={dayNumber} 
                          className={`py-2 text-xs rounded-xl flex flex-col items-center justify-center border border-transparent cursor-default transition-all ${
                            statusColorMap[status] || 'bg-transparent'
                          }`}
                          title={`Date: ${dateStr}\nStatus: ${status}`}
                        >
                          <span className="block font-bold">{dayNumber}</span>
                          <span className="block text-[9px] font-black opacity-90 mt-0.5">
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
                    const monthlyWages = attendance.filter(a => a.workerId === viewingWorker.id && a.date.startsWith('2026-07'));
                      
                    monthlyWages.forEach((rec: AttendanceRecord) => {
                      if (rec.status === 'Present') grossWages += viewingWorker.dailyWage;
                      else if (rec.status === 'Half-Day') grossWages += viewingWorker.dailyWage * 0.5;
                      if (rec.overtimeHours > 0) grossWages += rec.overtimeHours * viewingWorker.overtimeRate;
                      if (rec.isNightShift) grossWages += 150; 
                    });

                    const totalPaid = payments
                      .filter(p => p.workerId === viewingWorker.id && p.date.startsWith('2026-07'))
                      .reduce((sum: number, p: PaymentRecord) => sum + p.amount, 0);

                    const pendingBalance = Math.max(0, grossWages - totalPaid);

                    return (
                      <div className="space-y-6">
                        {/* Attendance Counter Grid */}
                        <div className="grid grid-cols-4 gap-3 text-center text-xs font-bold">
                          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                            <p className="text-emerald-500">Presents</p>
                            <h4 className="text-base font-extrabold text-foreground mt-1">{stats.presents}</h4>
                          </div>
                          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10">
                            <p className="text-amber-500">Half-Days</p>
                            <h4 className="text-base font-extrabold text-foreground mt-1">{stats.halfDays}</h4>
                          </div>
                          <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/10">
                            <p className="text-destructive">Absents</p>
                            <h4 className="text-base font-extrabold text-foreground mt-1">{stats.absents}</h4>
                          </div>
                          <div className="p-3 rounded-xl border border-border bg-accent/50">
                            <p className="text-muted-foreground">OT Hours</p>
                            <h4 className="text-base font-extrabold text-foreground mt-1">{stats.totalOTHours}h</h4>
                          </div>
                        </div>

                        {/* Wage Breakdown Box */}
                        <div className="p-5 rounded-2xl border border-border bg-accent/30 space-y-3">
                          <h6 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">July Earnings Statement</h6>
                          
                          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                            <span>Base Wage Earned:</span>
                            <span className="font-bold text-foreground">₹{grossWages - (stats.totalOTHours * viewingWorker.overtimeRate) - (stats.nightShiftsCount * 150)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                            <span>Overtime Earned ({stats.totalOTHours} hrs):</span>
                            <span className="font-bold text-foreground">₹{stats.totalOTHours * viewingWorker.overtimeRate}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                            <span>Night Shift Allowance:</span>
                            <span className="font-bold text-foreground">₹{stats.nightShiftsCount * 150}</span>
                          </div>
                          
                          <div className="border-t border-border/50 pt-3 flex items-center justify-between text-sm font-bold text-foreground">
                            <span>Gross Monthly Wages:</span>
                            <span>₹{grossWages}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-semibold text-emerald-500">
                            <span>Total Wage Released (Paid):</span>
                            <span className="font-bold">₹{totalPaid}</span>
                          </div>
                          
                          <div className="border-t-2 border-dashed border-border pt-4 mt-2 flex items-center justify-between text-lg font-extrabold text-foreground">
                            <span>Net Balance Due:</span>
                            <span className="text-amber-500">₹{pendingBalance}</span>
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
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">1. Basic Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name *" name="name" required value={formData.name} onChange={handleInputChange} />
              <Input label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
              <Input label="Phone Number *" name="phone" required value={formData.phone} onChange={handleInputChange} />
              <Input label="DOB (YYYY-MM-DD)" type="date" name="dob" value={formData.dob} onChange={handleInputChange} />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Input label="Emergency Contact No" name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">2. Address details</h4>
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
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">3. KYC Identity & Bank Transfer Data</h4>
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
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">4. Professional & Wage Parameters</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Trade Designation</label>
                <select
                  name="trade"
                  value={formData.trade}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Mason">Mason (मिस्त्री)</option>
                  <option value="Carpenter">Carpenter (बढ़ई)</option>
                  <option value="Welder">Welder (वेल्डर)</option>
                  <option value="Helper">Helper (मज़दूर)</option>
                  <option value="Electrician">Electrician (बिजली मिस्त्री)</option>
                  <option value="Plumber">Plumber (प्लंबर)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Civil">Civil</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Finishing">Finishing</option>
                  <option value="Plumbing">Plumbing</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Skill Level</label>
                <select
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Helper">Helper</option>
                  <option value="Semi-Skilled">Semi-Skilled</option>
                  <option value="Skilled">Skilled</option>
                  <option value="Highly-Skilled">Highly-Skilled</option>
                </select>
              </div>
              <Input label="Daily Base Wage (₹)" type="number" name="dailyWage" value={formData.dailyWage.toString()} onChange={handleInputChange} />
              <Input label="Overtime Hourly Rate (₹)" type="number" name="overtimeRate" value={formData.overtimeRate.toString()} onChange={handleInputChange} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Assign Construction Site</label>
                <select
                  name="currentSiteId"
                  value={formData.currentSiteId}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Supervisor Notes / Remarks</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Labour Portal Self-Login Setup */}
          <div className="space-y-4 pt-6 border-t border-border p-5 rounded-2xl bg-brand-500/5 border-brand-500/10">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="selfLoginEnabled"
                checked={selfLoginEnabled}
                onChange={(e) => setSelfLoginEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-brand-500 focus:ring-brand-500 border-input bg-background"
              />
              <label htmlFor="selfLoginEnabled" className="text-sm font-bold text-foreground select-none">
                Enable Labour Self-Login (मजदूर लॉगिन सक्षम करें)
              </label>
            </div>
            
            {selfLoginEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">LOGIN IDENTIFIER ID</p>
                  <p className="text-sm font-bold text-foreground mt-1.5 select-all bg-background p-2.5 rounded-xl border border-border">
                    {editingWorkerId || 'Will generate on registration'}
                  </p>
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

    </motion.div>
  );
};
