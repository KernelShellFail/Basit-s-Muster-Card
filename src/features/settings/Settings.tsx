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
import { useOrganization, useUpdateOrganization } from '../../api/queries';

export const Settings = () => {
  const { 
    currentUser, 
    currentLanguage, 
    setLanguage, 
    selectedRole
  } = useAppStore();

  const { data: organization } = useOrganization();
  const { mutate: updateOrganization } = useUpdateOrganization();

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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-[80px]">
      
      {/* Title */}
      <motion.div variants={slideUp}>
        <h1 className="text-[60px] font-medium tracking-[-1.8px] leading-[1] text-foreground">{t('settings')}</h1>
        <p className="text-[16px] text-muted-foreground font-medium mt-4">Configure workspace parameters, update organization GST data, and download offline backups.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Language details */}
        <motion.div variants={slideUp} className="space-y-6 lg:col-span-1">
          {/* User Profile */}
          <Card className="border border-border">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[12px] font-medium text-foreground flex items-center gap-2 pb-4 border-b border-border uppercase tracking-[0.1em]">
                <User className="w-5 h-5 text-muted-foreground" />
                UserProfile Info
              </h3>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-muted text-foreground border border-border flex items-center justify-center font-medium text-[16px] shadow-none">
                  {currentUser?.name.substring(0, 2).toUpperCase() || 'MM'}
                </div>
                <div>
                  <h4 className="text-[16px] font-medium text-foreground leading-tight">{currentUser?.name}</h4>
                  <p className="text-[10px] text-muted-foreground font-medium mt-2 uppercase tracking-[0.1em]">Role: {selectedRole}</p>
                </div>
              </div>

              <div className="text-[14px] text-muted-foreground font-medium space-y-3 pt-2">
                <p><strong className="text-foreground">Email:</strong> {currentUser?.email}</p>
                <p><strong className="text-foreground">Phone:</strong> {currentUser?.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="border border-border">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[12px] font-medium text-foreground flex items-center gap-2 pb-4 border-b border-border uppercase tracking-[0.1em]">
                <Globe className="w-5 h-5 text-muted-foreground" />
                Theme & Language
              </h3>

              {/* Language Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.1em] block">Select System Language (भाषा)</label>
                <select
                  value={currentLanguage}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="flex h-14 w-full rounded-[28px] border border-border bg-background px-6 py-3 text-[16px] text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          <Card className="border border-border">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[12px] font-medium text-foreground flex items-center gap-2 pb-4 border-b border-border uppercase tracking-[0.1em]">
                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                Backup & Database
              </h3>
              
              <p className="text-[14px] text-muted-foreground font-medium leading-relaxed">Export all local records to JSON file or upload previous backup datasets.</p>

              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  onClick={handleBackup}
                  leftIcon={<Download className="w-5 h-5 text-foreground" />}
                  className="w-full justify-start"
                >
                  Backup Database
                </Button>

                <label className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-[28px] border border-dashed border-border text-[14px] font-medium text-foreground bg-muted hover:bg-muted/50 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-foreground" />
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
          <Card className="h-full border border-border">
            <CardContent className="p-8 sm:p-10">
              <h3 className="text-[12px] font-medium text-foreground flex items-center gap-2 pb-6 border-b border-border mb-8 uppercase tracking-[0.1em]">
                <Building2 className="w-5 h-5 text-muted-foreground" />
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
