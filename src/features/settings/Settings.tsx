import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  Settings as SettingsIcon, 
  Building2, 
  User, 
  Globe, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  ShieldCheck, 
  HardHat,
  Smartphone
} from 'lucide-react';
import { useEffect } from 'react';
import { LocalDB } from '../../services/db';

export const Settings = () => {
  const { 
    currentUser, 
    currentLanguage, 
    setLanguage, 
    isDarkMode, 
    toggleDarkMode, 
    selectedRole,
    organization,
    updateOrganization
  } = useAppStore();

  const { t } = useTranslation(currentLanguage);

  // Form input states
  const [orgName, setOrgName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Sync state inputs when organization data loads from database
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '');
      setGstNumber(organization.gstNumber || '');
      setAddress(organization.address || '');
      setPhone(organization.phone || '');
      setEmail(organization.email || '');
    }
  }, [organization]);

  const org = organization || { id: 'org-101', name: '', logo: '', gstNumber: '', address: '', phone: '', email: '', ownerId: 'usr-owner' };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...org,
      name: orgName,
      gstNumber,
      address,
      phone,
      email
    };
    updateOrganization(updated);
    showToast('Organization settings updated successfully.');
  };

  // JSON Database export backup
  const handleBackup = () => {
    const backupData: Record<string, string | null> = {};
    const keys = ['mm_org', 'mm_users', 'mm_sites', 'mm_workers', 'mm_attendance', 'mm_leaves', 'mm_notifications', 'mm_chat', 'mm_payments', 'mm_seeded'];
    keys.forEach(k => {
      backupData[k] = localStorage.getItem(k);
    });

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MusterMate_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Database backup file download started.');
  };

  // Restore database from JSON file
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.keys(data).forEach(key => {
          if (data[key]) {
            localStorage.setItem(key, data[key]);
          }
        });
        showToast('Database restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        showToast('Invalid backup file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-construction-850 dark:text-white">{t('settings')}</h1>
        <p className="text-xs text-construction-500 mt-1">Configure workspace parameters, update organization GST data, and download offline backups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Language details */}
        <div className="space-y-6 lg:col-span-1">
          {/* User Profile */}
          <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-construction-800 dark:text-white flex items-center gap-1.5 pb-2 border-b border-construction-100 dark:border-construction-800">
              <User className="w-4 h-4 text-safety-500" />
              UserProfile Info
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-safety-500 text-construction-950 flex items-center justify-center font-bold text-sm">
                {currentUser?.name.substring(0, 2).toUpperCase() || 'MM'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-construction-850 dark:text-white leading-tight">{currentUser?.name}</h4>
                <p className="text-[10px] text-construction-500 mt-0.5">Role: {selectedRole.toUpperCase()}</p>
              </div>
            </div>

            <div className="text-xs text-construction-650 dark:text-construction-350 space-y-1.5 pt-2 font-medium">
              <p><strong>Email:</strong> {currentUser?.email}</p>
              <p><strong>Phone:</strong> {currentUser?.phone}</p>
            </div>
          </div>

          {/* Preferences */}
          <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-construction-800 dark:text-white flex items-center gap-1.5 pb-2 border-b border-construction-100 dark:border-construction-800">
              <Globe className="w-4 h-4 text-safety-500" />
              Theme & Language
            </h3>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-construction-600 dark:text-construction-450 block">Select System Language (भाषा)</label>
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-construction-950 border border-construction-250 dark:border-construction-800 rounded-lg text-construction-700 dark:text-construction-300 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>

            {/* Dark Mode toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-bold text-construction-600 dark:text-construction-450">Dark Mode System</span>
              <button
                onClick={toggleDarkMode}
                className="p-1.5 rounded-lg border border-construction-200 dark:border-construction-800 bg-construction-50 dark:bg-construction-950 hover:bg-construction-100 text-construction-750 dark:text-white transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-construction-550" />}
              </button>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-construction-800 dark:text-white flex items-center gap-1.5 pb-2 border-b border-construction-100 dark:border-construction-800">
              <ShieldCheck className="w-4 h-4 text-safety-500" />
              Backup & Database
            </h3>
            
            <p className="text-[10px] text-construction-500 leading-tight">Export all local records to JSON file or upload previous backup datasets.</p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleBackup}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-construction-200 dark:border-construction-800 text-xs font-bold text-construction-700 dark:text-construction-300 bg-white dark:bg-construction-950 hover:bg-construction-50"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                Backup Database
              </button>

              <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-construction-300 dark:border-construction-800 text-xs font-bold text-construction-700 dark:text-construction-300 bg-white dark:bg-construction-950 hover:bg-construction-50 cursor-pointer text-center">
                <Upload className="w-4 h-4 text-amber-500" />
                <span>Restore Database</span>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>

        {/* Organization Setup Form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm">
          <h3 className="text-xs font-bold text-construction-800 dark:text-white flex items-center gap-1.5 pb-2 border-b border-construction-100 dark:border-construction-800 mb-4">
            <Building2 className="w-4 h-4 text-safety-500" />
            Organization Profile
          </h3>

          <form onSubmit={handleSaveOrg} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Company / Organization Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">GSTIN Registration Code</label>
                <input
                  type="text"
                  required
                  placeholder="27AADCM3241F1ZH"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Official Contact Phone</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white rounded-lg focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Official Contact Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">GST Billing Address</label>
              <textarea
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-500"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-construction-100 dark:border-construction-800/60">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 shadow-md transition-colors"
              >
                {t('save')}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
