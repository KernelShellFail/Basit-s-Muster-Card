import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  Building2, 
  User, 
  Globe, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { slideUp, staggerContainer } from '../../utils/animations';

export const Settings = () => {
  const { 
    currentUser, 
    currentLanguage, 
    setLanguage, 
    selectedRole,
    organization,
    updateOrganization
  } = useAppStore();

  const { t } = useTranslation(currentLanguage);

  const [orgName, setOrgName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      
      {/* Title */}
      <motion.div variants={slideUp}>
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{t('settings')}</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure workspace parameters, update organization GST data, and download offline backups.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Language details */}
        <motion.div variants={slideUp} className="space-y-6 lg:col-span-1">
          {/* User Profile */}
          <Card glass>
            <CardContent className="p-8 space-y-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border uppercase tracking-widest">
                <User className="w-5 h-5 text-brand-500" />
                UserProfile Info
              </h3>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center font-black text-lg shadow-inner">
                  {currentUser?.name.substring(0, 2).toUpperCase() || 'MM'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground leading-tight">{currentUser?.name}</h4>
                  <p className="text-xs text-muted-foreground font-semibold mt-1 uppercase tracking-widest">Role: {selectedRole}</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2 pt-2">
                <p><strong className="text-foreground">Email:</strong> {currentUser?.email}</p>
                <p><strong className="text-foreground">Phone:</strong> {currentUser?.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card glass>
            <CardContent className="p-8 space-y-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border uppercase tracking-widest">
                <Globe className="w-5 h-5 text-brand-500" />
                Theme & Language
              </h3>

              {/* Language Selector */}
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-[0.1em] block">Select System Language (भाषा)</label>
                <select
                  value={currentLanguage}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="flex h-12 w-full rounded-[8px] border border-border bg-input px-4 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Backup & Restore */}
          <Card glass>
            <CardContent className="p-8 space-y-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border uppercase tracking-widest">
                <ShieldCheck className="w-5 h-5 text-brand-500" />
                Backup & Database
              </h3>
              
              <p className="text-xs text-muted-foreground leading-relaxed">Export all local records to JSON file or upload previous backup datasets.</p>

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={handleBackup}
                  leftIcon={<Download className="w-5 h-5 text-emerald-500" />}
                  className="w-full justify-start"
                >
                  Backup Database
                </Button>

                <label className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-dashed border-border text-sm font-bold text-foreground bg-accent/30 hover:bg-accent/60 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-amber-500" />
                  <span>Restore Database</span>
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleRestore}
                    className="hidden" 
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Organization Setup Form */}
        <motion.div variants={slideUp} className="lg:col-span-2">
          <Card glass className="h-full">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-4 border-b border-border mb-6 uppercase tracking-widest">
                <Building2 className="w-5 h-5 text-brand-500" />
                Organization Profile
              </h3>

              <form onSubmit={handleSaveOrg} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Company / Organization Name</label>
                  <Input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">GSTIN Registration Code</label>
                    <Input
                      type="text"
                      required
                      placeholder="27AADCM3241F1ZH"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Official Contact Phone</label>
                    <Input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Official Contact Email</label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">GST Billing Address</label>
                  <textarea
                    rows={4}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-end pt-6 border-t border-border mt-8">
                  <Button type="submit" size="lg">
                    {t('save')} Organization Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

      </div>

    </motion.div>
  );
};
