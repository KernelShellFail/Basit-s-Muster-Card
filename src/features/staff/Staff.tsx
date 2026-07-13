import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  HardHat, 
  UserSquare2
} from 'lucide-react';
import { UserProfile, Role } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { slideUp, staggerContainer } from '../../utils/animations';
import { useSites, useUsers, useAddUser, useRemoveUser } from '../../api/queries';

export const Staff = () => {
  const { currentLanguage } = useAppStore();
  const { data: users = [] } = useUsers();
  const { data: sites = [] } = useSites();
  const { mutate: addUser } = useAddUser();
  const { mutate: removeUser } = useRemoveUser();
  const { t } = useTranslation(currentLanguage);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'admin' | 'supervisor'>('All');
  const [siteFilter, setSiteFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('supervisor');
  const [assignedSiteId, setAssignedSiteId] = useState('');
  const [password, setPassword] = useState('');

  const handleEditClick = (staff: UserProfile) => {
    setEditingStaff(staff);
    setName(staff.name);
    setEmail(staff.email);
    setPhone(staff.phone);
    setRole(staff.role);
    setAssignedSiteId(staff.siteId || '');
    setPassword('');
    setShowModal(true);
  };

  const handleCreateClick = () => {
    setEditingStaff(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('supervisor');
    setAssignedSiteId(sites[0]?.id || '');
    setPassword('');
    setShowModal(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      showToast('Name and phone number are required!', 'error');
      return;
    }

    const targetUid = editingStaff ? editingStaff.uid : `usr-staff-${Date.now()}`;
    const targetUser: UserProfile = {
      uid: targetUid,
      name,
      email,
      phone,
      role,
      siteId: assignedSiteId || undefined,
      organizationId: 'org-101',
      password: password || undefined
    };

    addUser(targetUser);
    showToast(editingStaff ? 'Staff profile updated!' : 'New staff registered successfully!');
    setShowModal(false);
  };

  const handleDeleteStaff = (uid: string, userName: string) => {
    if (confirm(`Are you sure you want to remove ${userName} from staff list?`)) {
      removeUser(uid);
      showToast('Staff profile deleted.');
    }
  };

  const getSiteName = (siteId?: string) => {
    if (!siteId) return 'Global (Unassigned)';
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown Site';
  };

  const staffList = users.filter(u => u.role === 'admin' || u.role === 'supervisor');

  const filteredStaff = staffList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.phone.includes(searchQuery) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' ? true : u.role === roleFilter;
    const matchesSite = siteFilter === 'All' ? true : u.siteId === siteFilter;
    
    return matchesSearch && matchesRole && matchesSite;
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-[80px]">
      
      {/* Title */}
      <motion.div variants={slideUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[60px] font-medium tracking-[-1.8px] leading-[1] text-foreground">Staff Directory</h1>
          <p className="text-[16px] text-muted-foreground font-medium mt-4">Manage project administrators, field supervisors, and assign their job sites.</p>
        </div>
        
        <Button
          onClick={handleCreateClick}
          leftIcon={<UserPlus className="w-5 h-5" />}
          className="shrink-0"
        >
          Add Staff (स्टाफ जोड़ें)
        </Button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={slideUp}>
        <Card className="border border-border">
          <CardContent className="p-8 sm:p-10 flex flex-col md:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 w-full text-[16px]"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-4">
              {/* Role Filter */}
              <div className="flex items-center gap-3 px-4 py-2 border border-border rounded-full bg-background focus-within:ring-1 focus-within:ring-ring">
                <ShieldAlert className="w-5 h-5 text-foreground shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e: any) => setRoleFilter(e.target.value)}
                  className="text-[14px] font-medium bg-transparent text-foreground outline-none border-none cursor-pointer w-full"
                >
                  <option value="All">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="supervisor">Supervisors</option>
                </select>
              </div>

              {/* Site Filter */}
              <div className="flex items-center gap-3 px-4 py-2 border border-border rounded-full bg-background focus-within:ring-1 focus-within:ring-ring">
                <MapPin className="w-5 h-5 text-foreground shrink-0" />
                <select
                  value={siteFilter}
                  onChange={(e) => setSiteFilter(e.target.value)}
                  className="text-[14px] font-medium bg-transparent text-foreground outline-none border-none cursor-pointer w-full sm:w-[150px] truncate"
                >
                  <option value="All">All Sites</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid List */}
      <motion.div variants={slideUp}>
        {filteredStaff.length === 0 ? (
          <Card className="border border-border border-dashed">
            <CardContent className="p-12 text-center text-[16px] text-muted-foreground font-medium">
              No staff members match the selected filter criteria.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((staff, idx) => (
              <motion.div key={staff.uid} variants={slideUp} custom={idx}>
                <Card className="h-full border border-border transition-all duration-300 group flex flex-col justify-between">
                  <CardContent className="p-8 space-y-6">
                    {/* Header Profile */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-muted text-foreground font-bold flex items-center justify-center border border-border shadow-none text-[16px]">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-[16px] font-medium text-foreground leading-tight">
                            {staff.name}
                          </h3>
                          <span className={`mt-2 inline-flex text-[10px] font-medium px-4 py-1.5 rounded-full uppercase tracking-[0.1em] border ${
                            staff.role === 'admin' 
                              ? 'bg-foreground text-background border-foreground' 
                              : 'bg-primary/20 text-foreground border-primary/20'
                          }`}>
                            {staff.role === 'admin' ? 'Administrator' : 'Supervisor'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(staff)}
                          title="Edit Staff"
                          className="h-10 w-10 text-muted-foreground hover:bg-muted/50 rounded-full"
                        >
                          <Edit3 className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStaff(staff.uid, staff.name)}
                          title="Delete Staff"
                          className="h-10 w-10 text-muted-foreground hover:bg-muted/50 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Details list */}
                    <div className="space-y-4 pt-6 border-t border-border text-[12px] font-medium text-muted-foreground uppercase tracking-widest">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                        <span>{staff.phone}</span>
                      </div>
                      {staff.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                          <span className="truncate">{staff.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                        <span className="truncate text-foreground">{getSiteName(staff.siteId)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add / Edit Staff Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={editingStaff ? 'Edit Staff Profile' : 'Register New Staff'}
          >
            <form onSubmit={handleSaveStaff} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Full Name *</label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kamble"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Phone Number *</label>
                  <Input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@mustermate.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  {editingStaff ? 'Change Password (leave blank to keep current)' : 'Password *'}
                </label>
                <Input
                  type="password"
                  required={!editingStaff}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingStaff ? 'Keep current password' : 'Set login password'}
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">System Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('supervisor')}
                    className={`p-4 text-[12px] uppercase tracking-widest font-medium rounded-[28px] border flex items-center justify-center gap-2 transition-all ${
                      role === 'supervisor'
                        ? 'bg-foreground border-foreground text-background shadow-none'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <HardHat className="w-5 h-5" />
                    Supervisor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-4 text-[12px] uppercase tracking-widest font-medium rounded-[28px] border flex items-center justify-center gap-2 transition-all ${
                      role === 'admin'
                        ? 'bg-foreground border-foreground text-background shadow-none'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5" />
                    Administrator
                  </button>
                </div>
              </div>

              {/* Assigned Site */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Assigned Job Site</label>
                <select
                  value={assignedSiteId}
                  onChange={(e) => setAssignedSiteId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                >
                  <option value="">Global Assignment (All Sites / Owner)</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Save Changes' : 'Register Staff'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
