import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  Search, 
  Filter, 
  Plus, 
  X, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Calendar, 
  UserPlus, 
  CheckCircle, 
  AlertCircle,
  Building,
  User,
  CreditCard,
  History,
  FileText,
  Trash2,
  Printer,
  Edit3
} from 'lucide-react';
import type { Worker, AttendanceRecord, PaymentRecord } from '../../services/db';

export const Workers = () => {
  const { workers, sites, activeSiteId, addWorker, deleteWorker, currentLanguage, attendance, payments, users, addUser, removeUser } = useAppStore();
  const { t } = useTranslation(currentLanguage);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [selectedSite, setSelectedSite] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [selfLoginEnabled, setSelfLoginEnabled] = useState(false);
  const [labourPassword, setLabourPassword] = useState('');
  
  // Form State
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

  // Unique Trades for filter
  const trades = ['All', ...new Set(workers.map(w => w.trade))];

  // Filtering Logic
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

    // Sync Labour Self-Login User Account
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
    setEditingWorkerId(null);
    setSelfLoginEnabled(false);
    setLabourPassword('');
    setFormData({
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
      skillLevel: 'Skilled',
      dailyWage: 600,
      overtimeRate: 80,
      currentSiteId: activeSiteId,
      notes: '',
    });
  };

  // CSV Mock Export
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

  // Calculate specific worker July stats for Muster Card
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
    <div className="space-y-6">
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-construction-850 dark:text-white">{t('workers')}</h1>
          <p className="text-xs text-construction-500 mt-1">Manage profiles, documents, bank credentials, and digital muster sheets.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-construction-200 dark:border-construction-800 text-xs font-bold text-construction-700 dark:text-construction-300 bg-white dark:bg-construction-900 hover:bg-construction-50 hover:text-construction-900 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Export CSV
          </button>
          
          <button
            onClick={() => {
              setEditingWorkerId(null);
              setFormData({
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
                skillLevel: 'Skilled',
                dailyWage: 600,
                overtimeRate: 80,
                currentSiteId: activeSiteId,
                notes: '',
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 shadow-md transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t('addWorker')}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 text-construction-450 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white focus:ring-2 focus:ring-safety-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
          {/* Site Filter */}
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="text-xs bg-white dark:bg-construction-950 border border-construction-200 dark:border-construction-800 rounded-xl px-3 py-2 text-construction-700 dark:text-construction-300 focus:outline-none"
          >
            <option value="All">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Trade Filter */}
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="text-xs bg-white dark:bg-construction-950 border border-construction-200 dark:border-construction-800 rounded-xl px-3 py-2 text-construction-700 dark:text-construction-300 focus:outline-none"
          >
            {trades.map(t => <option key={t} value={t}>{t === 'All' ? 'All Trades' : t}</option>)}
          </select>

          {/* Skill Filter */}
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="text-xs bg-white dark:bg-construction-950 border border-construction-200 dark:border-construction-800 rounded-xl px-3 py-2 text-construction-700 dark:text-construction-300 focus:outline-none col-span-2 sm:col-span-1"
          >
            <option value="All">All Skills</option>
            <option value="Helper">Helper</option>
            <option value="Semi-Skilled">Semi-Skilled</option>
            <option value="Skilled">Skilled</option>
            <option value="Highly-Skilled">Highly-Skilled</option>
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-construction-250 dark:border-construction-800 bg-construction-50 dark:bg-construction-950/20 text-construction-500 font-bold uppercase tracking-wider">
                <th className="p-4">Worker ID & Name</th>
                <th className="p-4">Trade & Dept</th>
                <th className="p-4">Skill Level</th>
                <th className="p-4">Daily Wage</th>
                <th className="p-4">Assigned Site</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construction-100 dark:divide-construction-800/40">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-construction-450 font-medium">
                    No workers match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(w => (
                  <tr key={w.id} className="hover:bg-construction-50/50 dark:hover:bg-construction-800/20 transition-colors">
                    {/* ID & Photo */}
                    <td className="p-4 flex items-center gap-3">
                      <img src={w.photo} alt={w.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-construction-200" />
                      <div>
                        <p className="font-bold text-construction-850 dark:text-white leading-tight">{w.name}</p>
                        <p className="text-[10px] text-construction-500 font-semibold mt-0.5">{w.id}</p>
                      </div>
                    </td>
                    
                    {/* Trade */}
                    <td className="p-4">
                      <p className="font-bold text-construction-800 dark:text-white">{w.trade}</p>
                      <p className="text-[10px] text-construction-500 font-medium mt-0.5">{w.department}</p>
                    </td>

                    {/* Skill */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        w.skillLevel === 'Highly-Skilled' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' :
                        w.skillLevel === 'Skilled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                        w.skillLevel === 'Semi-Skilled' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {w.skillLevel}
                      </span>
                    </td>

                    {/* Wage */}
                    <td className="p-4 font-bold text-construction-850 dark:text-white">
                      ₹{w.dailyWage} / day
                    </td>

                    {/* Site */}
                    <td className="p-4 font-medium text-construction-650 dark:text-construction-350">
                      {sites.find(s => s.id === w.currentSiteId)?.name || 'Unassigned'}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                        w.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {w.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center flex items-center justify-center gap-1">
                      <button
                        onClick={() => setViewingWorker(w)}
                        className="p-1.5 rounded-lg border border-construction-200 dark:border-construction-850 hover:bg-construction-100 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-300 transition-colors"
                        title="View Profile & Muster Card"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEditWorker(w)}
                        className="p-1.5 rounded-lg border border-construction-200 dark:border-construction-850 hover:bg-construction-100 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-300 transition-colors"
                        title="Edit Worker Profile"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete worker ${w.name}?`)) {
                            deleteWorker(w.id);
                            showToast(`Worker ${w.name} removed successfully.`);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-red-150 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="Delete Worker"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Profile / Muster Card Details Drawer */}
      {viewingWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-4xl bg-white dark:bg-construction-950 h-screen flex flex-col shadow-2xl relative animate-slide-in">
            {/* Header */}
            <div className="h-16 border-b border-construction-200 dark:border-construction-800 px-6 flex items-center justify-between bg-construction-50 dark:bg-construction-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-safety-500 rounded-lg text-construction-950 shrink-0">
                  <User className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-construction-800 dark:text-white leading-tight">{viewingWorker.name}</h3>
                  <p className="text-[10px] text-construction-500 font-semibold mt-0.5">Profile & digital Muster Card</p>
                </div>
              </div>
              <button
                onClick={() => setViewingWorker(null)}
                className="p-2 rounded-lg hover:bg-construction-200 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-350"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Card Summary */}
              <div className="p-5 rounded-2xl bg-construction-50 dark:bg-construction-900 border border-construction-200 dark:border-construction-800 flex flex-col sm:flex-row items-center gap-5">
                <img src={viewingWorker.photo} alt={viewingWorker.name} className="w-20 h-20 rounded-full object-cover shrink-0 border-2 border-safety-400" />
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h4 className="text-lg font-bold text-construction-850 dark:text-white">{viewingWorker.name}</h4>
                  <p className="text-xs text-construction-500 font-semibold">Trade: {viewingWorker.trade} • {viewingWorker.skillLevel}</p>
                  <p className="text-xs text-construction-600 dark:text-construction-300 font-semibold">ID: {viewingWorker.id} • Joining Date: {viewingWorker.joiningDate}</p>
                </div>
                <div className="shrink-0 flex sm:flex-col gap-2">
                  <span className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">
                    Wage: ₹{viewingWorker.dailyWage}/day
                  </span>
                  <span className="bg-purple-500/10 text-purple-600 text-xs font-bold px-3 py-1 rounded-full">
                    OT: ₹{viewingWorker.overtimeRate}/hr
                  </span>
                </div>
              </div>

              {/* Tabs / Sub-Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal & Bank Details */}
                <div className="space-y-4 md:col-span-1 border-r border-construction-100 dark:border-construction-800/40 pr-0 md:pr-6">
                  {/* Personal details */}
                  <div>
                    <h5 className="text-[10px] font-bold text-construction-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <User className="w-3.5 h-3.5 text-safety-500" />
                      Personal Bio
                    </h5>
                    <ul className="text-xs space-y-2 text-construction-700 dark:text-construction-300">
                      <li><strong>Father's Name:</strong> {viewingWorker.fatherName}</li>
                      <li><strong>Gender / DOB:</strong> {viewingWorker.gender} • {viewingWorker.dob}</li>
                      <li><strong>Phone:</strong> {viewingWorker.phone}</li>
                      <li><strong>Emergency Contact:</strong> {viewingWorker.emergencyContact}</li>
                      <li><strong>Address:</strong> {viewingWorker.address}, {viewingWorker.village}, {viewingWorker.district}, {viewingWorker.state} - {viewingWorker.pinCode}</li>
                    </ul>
                  </div>

                  {/* ID Verification */}
                  <div className="pt-4 border-t border-construction-100 dark:border-construction-800/40">
                    <h5 className="text-[10px] font-bold text-construction-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <FileText className="w-3.5 h-3.5 text-safety-500" />
                      Verified Documents
                    </h5>
                    <ul className="text-xs space-y-1 text-construction-700 dark:text-construction-300">
                      <li><strong>Aadhaar Card:</strong> {viewingWorker.aadhaar}</li>
                      <li><strong>PAN Card:</strong> {viewingWorker.pan || 'N/A'}</li>
                    </ul>
                  </div>

                  {/* Bank Details */}
                  <div className="pt-4 border-t border-construction-100 dark:border-construction-800/40">
                    <h5 className="text-[10px] font-bold text-construction-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <CreditCard className="w-3.5 h-3.5 text-safety-500" />
                      Bank Account Info
                    </h5>
                    <ul className="text-xs space-y-2 text-construction-700 dark:text-construction-300">
                      <li><strong>Bank Name:</strong> {viewingWorker.bankName}</li>
                      <li><strong>Account Number:</strong> {viewingWorker.accountNumber}</li>
                      <li><strong>IFSC Code:</strong> {viewingWorker.ifscCode}</li>
                      <li><strong>UPI ID:</strong> {viewingWorker.upiId || 'N/A'}</li>
                    </ul>
                  </div>
                </div>

                {/* Digital Muster Card (Monthly Calendar Sheet) */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-construction-850 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-safety-500" />
                      {t('musterCard')} • July 2026
                    </h5>
                    
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-construction-200 dark:border-construction-800 text-[10px] font-bold text-construction-650 dark:text-construction-300 hover:bg-construction-50 transition-colors"
                    >
                      <Printer className="w-3 h-3" />
                      Print Card
                    </button>
                  </div>

                  {/* Calendar Sheet Grid (31 Days) */}
                  <div className="grid grid-cols-7 gap-1 border border-construction-200 dark:border-construction-800 p-3 rounded-xl bg-construction-50/20 dark:bg-construction-950/20 text-center">
                    {/* Header Days */}
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <div key={idx} className="text-[10px] font-extrabold text-construction-400 py-1">{day}</div>
                    ))}
                    
                    {/* Days padding (Let's say July 2026 starts on Wednesday, so 3 empty divs) */}
                    {[...Array(3)].map((_, i) => <div key={`pad-${i}`} className="py-2.5" />)}

                    {/* July 1 to 31 */}
                    {[...Array(31)].map((_, i) => {
                      const dayNumber = i + 1;
                      const dateStr = `2026-07-${dayNumber.toString().padStart(2, '0')}`;
                      
                      // Search attendance status
                      const attendanceRecord = attendance
                        .find(a => a.workerId === viewingWorker.id && a.date === dateStr);
                      
                      const status = attendanceRecord ? attendanceRecord.status : 'Unmarked';
                      
                      const statusColorMap: Record<string, string> = {
                        'Present': 'bg-emerald-500 text-white font-bold',
                        'Half-Day': 'bg-amber-400 text-construction-950 font-bold',
                        'Absent': 'bg-red-500 text-white font-bold',
                        'Paid-Leave': 'bg-blue-500 text-white font-semibold',
                        'Unpaid-Leave': 'bg-slate-400 text-white',
                        'Weekly-Off': 'bg-slate-200 text-construction-600 dark:bg-construction-800 dark:text-construction-400',
                        'Holiday': 'bg-amber-200 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
                        'Unmarked': 'bg-transparent text-construction-300 dark:text-construction-700'
                      };

                      return (
                        <div 
                          key={dayNumber} 
                          className={`py-1.5 text-[10px] rounded-lg flex flex-col items-center justify-center border border-construction-100/10 ${
                            statusColorMap[status] || 'bg-transparent'
                          }`}
                          title={`Date: ${dateStr}\nStatus: ${status}`}
                        >
                          <span className="block font-bold">{dayNumber}</span>
                          <span className="block text-[8px] font-black opacity-80">
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
                    
                    // Wage Tally computations
                    let grossWages = 0;
                    const monthlyWages = attendance
                      .filter(a => a.workerId === viewingWorker.id && a.date.startsWith('2026-07'));
                      
                    monthlyWages.forEach((rec: AttendanceRecord) => {
                      if (rec.status === 'Present') grossWages += viewingWorker.dailyWage;
                      else if (rec.status === 'Half-Day') grossWages += viewingWorker.dailyWage * 0.5;
                      
                      if (rec.overtimeHours > 0) {
                        grossWages += rec.overtimeHours * viewingWorker.overtimeRate;
                      }
                      if (rec.isNightShift) {
                        grossWages += 150; // flat night Shift allowance
                      }
                    });

                    // Payments
                    const totalPaid = payments
                      .filter(p => p.workerId === viewingWorker.id && p.date.startsWith('2026-07'))
                      .reduce((sum: number, p: PaymentRecord) => sum + p.amount, 0);

                    const pendingBalance = Math.max(0, grossWages - totalPaid);

                    return (
                      <div className="space-y-4">
                        {/* Attendance Counter Grid */}
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                          <div className="p-2.5 rounded-xl border border-construction-200 dark:border-construction-800 bg-emerald-500/5">
                            <p className="text-emerald-500">Presents</p>
                            <h4 className="text-sm font-extrabold text-construction-800 dark:text-white mt-0.5">{stats.presents}</h4>
                          </div>
                          <div className="p-2.5 rounded-xl border border-construction-200 dark:border-construction-800 bg-amber-400/5">
                            <p className="text-amber-500">Half-Days</p>
                            <h4 className="text-sm font-extrabold text-construction-800 dark:text-white mt-0.5">{stats.halfDays}</h4>
                          </div>
                          <div className="p-2.5 rounded-xl border border-construction-200 dark:border-construction-800 bg-red-500/5">
                            <p className="text-red-500">Absents</p>
                            <h4 className="text-sm font-extrabold text-construction-800 dark:text-white mt-0.5">{stats.absents}</h4>
                          </div>
                          <div className="p-2.5 rounded-xl border border-construction-200 dark:border-construction-800 bg-construction-100/50 dark:bg-construction-800/20">
                            <p className="text-construction-500">OT Hours</p>
                            <h4 className="text-sm font-extrabold text-construction-800 dark:text-white mt-0.5">{stats.totalOTHours} hrs</h4>
                          </div>
                        </div>

                        {/* Wage Breakdown Box */}
                        <div className="p-4 rounded-xl border border-construction-200 dark:border-construction-800 bg-construction-50/50 dark:bg-construction-900/50 space-y-2">
                          <h6 className="text-[10px] font-bold text-construction-450 uppercase tracking-widest">July Earnings Statement</h6>
                          <div className="flex items-center justify-between text-xs font-semibold text-construction-700 dark:text-construction-300">
                            <span>Base Wage Earned:</span>
                            <span className="font-bold text-construction-900 dark:text-white">₹{grossWages - (stats.totalOTHours * viewingWorker.overtimeRate) - (stats.nightShiftsCount * 150)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-semibold text-construction-700 dark:text-construction-300">
                            <span>Overtime Earned ({stats.totalOTHours} hrs):</span>
                            <span className="font-bold text-construction-900 dark:text-white">₹{stats.totalOTHours * viewingWorker.overtimeRate}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-semibold text-construction-700 dark:text-construction-300">
                            <span>Night Shift Allowance:</span>
                            <span className="font-bold text-construction-900 dark:text-white">₹{stats.nightShiftsCount * 150}</span>
                          </div>
                          <div className="border-t border-construction-200 dark:border-construction-800/80 pt-2 flex items-center justify-between text-xs font-bold text-construction-850 dark:text-white">
                            <span>Gross Monthly Wages:</span>
                            <span>₹{grossWages}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-semibold text-emerald-500">
                            <span>Total Wage Released (Paid):</span>
                            <span className="font-bold">₹{totalPaid}</span>
                          </div>
                          <div className="border-t border-dashed border-construction-200 dark:border-construction-800 pt-2 flex items-center justify-between text-sm font-extrabold text-construction-900 dark:text-white">
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
          </div>
        </div>
      )}

      {/* Modal: Register New Worker */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-construction-950 rounded-2xl border border-construction-200 dark:border-construction-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-construction-200 dark:border-construction-800 flex items-center justify-between bg-construction-50 dark:bg-construction-900/50">
              <h3 className="text-sm font-black text-construction-850 dark:text-white flex items-center gap-1.5">
                <UserPlus className="w-5 h-5 text-safety-500" />
                {editingWorkerId ? 'Edit Labor Profile' : 'Register New Labor Profile'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-construction-200 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-350"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterWorker} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-construction-450 uppercase tracking-widest">1. Basic Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Father's Name</label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Phone Number *</label>
                    <input
                      type="text"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">DOB (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Emergency Contact No</label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div className="space-y-4 pt-4 border-t border-construction-100 dark:border-construction-800/40">
                <h4 className="text-[10px] font-bold text-construction-450 uppercase tracking-widest">2. Address details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Local Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Village/Town</label>
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">District</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">PIN Code</label>
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Verified Identity Docs & Bank Info */}
              <div className="space-y-4 pt-4 border-t border-construction-100 dark:border-construction-800/40">
                <h4 className="text-[10px] font-bold text-construction-450 uppercase tracking-widest">3. KYC Identity & Bank Transfer Data</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Aadhaar Card No *</label>
                    <input
                      type="text"
                      name="aadhaar"
                      required
                      placeholder="xxxx-xxxx-xxxx"
                      value={formData.aadhaar}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">PAN Card No</label>
                    <input
                      type="text"
                      name="pan"
                      placeholder="ABCDE1234F"
                      value={formData.pan}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Account Number</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">UPI ID</label>
                    <input
                      type="text"
                      name="upiId"
                      placeholder="name@upi"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Trade, Department, Skill & Wage */}
              <div className="space-y-4 pt-4 border-t border-construction-100 dark:border-construction-800/40">
                <h4 className="text-[10px] font-bold text-construction-450 uppercase tracking-widest">4. Professional & Wage Parameters</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Trade Designation</label>
                    <select
                      name="trade"
                      value={formData.trade}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500"
                    >
                      <option value="Mason">Mason (मिस्त्री)</option>
                      <option value="Carpenter">Carpenter (बढ़ई)</option>
                      <option value="Welder">Welder (वेल्डर)</option>
                      <option value="Helper">Helper (मज़दूर)</option>
                      <option value="Electrician">Electrician (बिजली मिस्त्री)</option>
                      <option value="Plumber">Plumber (प्लंबर)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500"
                    >
                      <option value="Civil">Civil</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Finishing">Finishing</option>
                      <option value="Plumbing">Plumbing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Skill Level</label>
                    <select
                      name="skillLevel"
                      value={formData.skillLevel}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500"
                    >
                      <option value="Helper">Helper</option>
                      <option value="Semi-Skilled">Semi-Skilled</option>
                      <option value="Skilled">Skilled</option>
                      <option value="Highly-Skilled">Highly-Skilled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Daily Base Wage (₹)</label>
                    <input
                      type="number"
                      name="dailyWage"
                      value={formData.dailyWage}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Overtime Hourly Rate (₹)</label>
                    <input
                      type="number"
                      name="overtimeRate"
                      value={formData.overtimeRate}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Assign Construction Site</label>
                    <select
                      name="currentSiteId"
                      value={formData.currentSiteId}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500"
                    >
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-construction-660 dark:text-construction-400 block mb-1">Supervisor Notes / Remarks</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                />
              </div>

              {/* Labour Portal Self-Login Setup */}
              <div className="space-y-4 pt-4 border-t border-construction-100 dark:border-construction-800/40 bg-safety-500/5 p-4 rounded-xl border border-safety-500/10">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selfLoginEnabled"
                    checked={selfLoginEnabled}
                    onChange={(e) => setSelfLoginEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-safety-500 focus:ring-safety-500 border-construction-300 bg-white"
                  />
                  <label htmlFor="selfLoginEnabled" className="text-xs font-bold text-construction-850 dark:text-white select-none">
                    Enable Labour Self-Login (मजदूर लॉगिन सक्षम करें)
                  </label>
                </div>
                
                {selfLoginEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-[10px] text-construction-500 font-bold">LOGIN IDENTIFIER ID</p>
                      <p className="text-xs font-extrabold text-construction-800 dark:text-white mt-1 select-all bg-white dark:bg-construction-950 p-2 rounded-lg border border-construction-200 dark:border-construction-800">
                        {editingWorkerId || 'Will generate on registration'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">
                        Set Password * (पासवर्ड सेट करें)
                      </label>
                      <input
                        type="password"
                        required={!editingWorkerId}
                        value={labourPassword}
                        onChange={(e) => setLabourPassword(e.target.value)}
                        placeholder={editingWorkerId ? 'Leave blank to keep existing' : 'e.g. yadav123'}
                        className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-construction-150 dark:border-construction-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-construction-250 dark:border-construction-800 rounded-lg text-xs font-bold text-construction-600 dark:text-construction-350 hover:bg-construction-50 dark:hover:bg-construction-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 shadow-md transition-colors"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
