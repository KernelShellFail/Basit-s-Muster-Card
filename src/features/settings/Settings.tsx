import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  Building2, 
  User, 
  Globe, 
  Download, 
  Upload, 
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { PhotoUpload } from '../../components/ui/PhotoUpload';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { slideUp, staggerContainer } from '../../utils/animations';
import { useOrganization, useUpdateOrganization } from '../../api/queries';

export const Settings = () => {
  const { 
    currentUser, 
    currentLanguage, 
    setLanguage, 
    selectedRole,
    updateCurrentUser,
    theme,
    setTheme
  } = useAppStore();

  const { data: organization } = useOrganization();
  const { mutate: updateOrganization } = useUpdateOrganization();

  const { t } = useTranslation(currentLanguage);

  const [orgName, setOrgName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profileUsername, setProfileUsername] = useState(currentUser?.username || '');
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.photo || '');

  useEffect(() => {
    setProfileUsername(currentUser?.username || '');
    setProfilePhoto(currentUser?.photo || '');
  }, [currentUser]);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '');
      setGstNumber(organization.gstNumber || '');
      setAddress(organization.address || '');
      setPhone(organization.phone || '');
      setEmail(organization.email || '');
    }
  }, [organization]);

  const org = organization || { id: currentUser?.organizationId || '', name: '', logo: '', gstNumber: '', address: '', phone: '', email: '', ownerId: currentUser?.uid || '' };

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

  const handleSaveProfile = () => {
    const username = profileUsername.trim();
    if (username && !/^[a-zA-Z0-9._-]{3,}$/.test(username)) {
      showToast('Username must be 3+ chars using letters, numbers, . _ -', 'error');
      return;
    }
    updateCurrentUser({
      username: username || undefined,
      photo: profilePhoto || undefined
    });
    showToast('Profile updated successfully.');
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
    a.download = `${(organization?.name || 'MusterMate').replace(/[^a-zA-Z0-9]+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
      } catch {
        showToast('Invalid backup file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      {/* Title */}
      <PageHeader
        eyebrow="settings"
        eyebrowColor="text-blue"
        title={t('settings')}
        description="Configure workspace parameters, update organization GST data, and download offline backups."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Language details */}
        <motion.div variants={slideUp} className="space-y-6 lg:col-span-1">
          {/* User Profile */}
          <Card className="overflow-hidden border border-border bg-card rounded-[8px]">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[11px] font-bold text-surface-cream flex items-center gap-2 pb-4 border-b border-border uppercase tracking-[0.12em]">
                <User className="w-4 h-4 text-blue" />
                UserProfile Info
              </h3>

              <div className="flex items-center gap-4">
                {currentUser?.photo ? (
                  <img src={currentUser.photo} alt={currentUser.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-background border border-border text-surface-cream flex items-center justify-center font-bold text-sm uppercase">
                    {currentUser?.name.substring(0, 2) || 'MM'}
                  </div>
                )}
                <div>
                  <h4 className="text-[15px] font-bold text-surface-cream leading-tight">{currentUser?.name}</h4>
                  <p className="text-[11px] text-surface-50 font-bold mt-1.5 uppercase tracking-wider bg-background px-2 py-0.5 rounded-full border border-border inline-block">Role: {selectedRole}</p>
                </div>
              </div>

              <div className="text-[13px] text-surface-50 font-medium space-y-3 pt-2">
                {currentUser?.username && <p><span className="text-surface-cream/75 font-semibold">Username:</span> {currentUser.username}</p>}
                <p><span className="text-surface-cream/75 font-semibold">Email:</span> {currentUser?.email}</p>
                <p><span className="text-surface-cream/75 font-semibold">Phone:</span> {currentUser?.phone}</p>
              </div>

              <div className="border-t border-border pt-5 space-y-4">
                <PhotoUpload
                  label="Your Photo"
                  value={profilePhoto}
                  onChange={(photo) => setProfilePhoto(photo)}
                />
                <Input
                  label="Username (for login)"
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  placeholder="e.g. rajesh"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveProfile}
                  className="w-full"
                >
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="overflow-hidden border border-border bg-card rounded-[8px]">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[11px] font-bold text-surface-cream flex items-center gap-2 pb-4 border-b border-border uppercase tracking-[0.12em]">
                <Globe className="w-4 h-4 text-blue" />
                Theme & Language
              </h3>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[14px] font-semibold text-surface-cream">Appearance</p>
                  <p className="text-[12px] text-surface-50 mt-0.5">Choose between light and dark mode.</p>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-full border border-border bg-background">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200",
                      theme === 'light' ? "bg-highlight text-highlight-foreground" : "text-surface-50 hover:text-surface-cream"
                    )}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200",
                      theme === 'dark' ? "bg-highlight text-highlight-foreground" : "text-surface-50 hover:text-surface-cream"
                    )}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <Select
                label="Select System Language (भाषा)"
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="text-surface-cream"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </Select>
            </CardContent>
          </Card>

          {/* Backup & Restore */}
          <Card className="overflow-hidden border border-border bg-card rounded-[8px]">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[11px] font-bold text-surface-cream flex items-center gap-2 pb-4 border-b border-border uppercase tracking-[0.12em]">
                <ShieldCheck className="w-4 h-4 text-blue" />
                Backup & Database
              </h3>
              
              <p className="text-[13px] text-surface-50 font-medium leading-relaxed">Export all local records to JSON file or upload previous backup datasets.</p>

              <div className="flex flex-col gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackup}
                  leftIcon={<Download className="w-4 h-4 text-surface-cream" />}
                  className="w-full justify-start py-3 h-11"
                >
                  Backup Database
                </Button>

                <label className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-full border border-dashed border-border text-sm font-semibold text-surface-cream bg-background hover:bg-muted/60 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-surface-cream" />
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
          <Card className="border border-border bg-card rounded-[8px] overflow-hidden">
            <CardContent className="p-8 sm:p-10">
              <h3 className="text-[11px] font-bold text-surface-cream flex items-center gap-2 pb-6 border-b border-border mb-8 uppercase tracking-[0.12em]">
                <Building2 className="w-4 h-4 text-blue" />
                Organization Profile
              </h3>

              <form onSubmit={handleSaveOrg} className="space-y-6">
                <Input
                  label="Company / Organization Name"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="GSTIN Registration Code"
                    type="text"
                    required
                    placeholder="27AADCM3241F1ZH"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="font-mono h-12"
                  />

                  <Input
                    label="Official Contact Phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12"
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Official Contact Email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                <Textarea
                  label="GST Billing Address"
                  rows={4}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

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
