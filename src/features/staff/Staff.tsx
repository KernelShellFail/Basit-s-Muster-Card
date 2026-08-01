import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
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
  HardHat
} from 'lucide-react';
import { UserProfile, Role } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PhotoUpload } from '../../components/ui/PhotoUpload';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { slideUp, staggerContainer } from '../../utils/animations';
import { useSites, useUsers, useAddUser, useRemoveUser } from '../../api/queries';

export const Staff = () => {
  const { currentUser } = useAppStore();
  const { data: users = [] } = useUsers();
  const { data: sites = [] } = useSites();
  const { mutate: addUser } = useAddUser();
  const { mutate: removeUser } = useRemoveUser();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'admin' | 'supervisor'>('All');
  const [siteFilter, setSiteFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('supervisor');
  const [assignedSiteId, setAssignedSiteId] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState('');

  const handleEditClick = (staff: UserProfile) => {
    setEditingStaff(staff);
    setName(staff.name);
    setUsername(staff.username || '');
    setEmail(staff.email);
    setPhone(staff.phone);
    setRole(staff.role);
    setAssignedSiteId(staff.siteId || '');
    setPassword('');
    setPhoto(staff.photo || '');
    setShowModal(true);
  };

  const handleCreateClick = () => {
    setEditingStaff(null);
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setRole('supervisor');
    setAssignedSiteId(sites[0]?.id || '');
    setPassword('');
    setPhoto('');
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
      username: username.trim() || undefined,
      email,
      phone,
      role,
      siteId: assignedSiteId || undefined,
      organizationId: currentUser?.organizationId || '',
      password: password || undefined,
      photo: photo || undefined
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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      {/* Title */}
      <PageHeader
        eyebrow="staff"
        eyebrowColor="text-blue"
        title="Staff Directory"
        description="Manage project administrators, field supervisors, and assign their job sites."
        actions={
          <Button
            onClick={handleCreateClick}
            leftIcon={<UserPlus className="w-5 h-5" />}
            className="shrink-0"
          >
            Add Staff (स्टाफ जोड़ें)
          </Button>
        }
      />

      {/* Search and Filters */}
      <motion.div variants={slideUp}>
        <Card className="p-8 rounded-[8px] bg-card border border-border flex flex-col md:flex-row gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-50" />
            <Input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 w-full text-sm"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-4">
            {/* Role Filter */}
            <Select
              value={roleFilter}
              onChange={(e: any) => setRoleFilter(e.target.value)}
              icon={<ShieldAlert className="w-4 h-4 text-surface-50" />}
              className="sm:w-[170px]"
            >
              <option value="All">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="supervisor">Supervisors</option>
            </Select>

            {/* Site Filter */}
            <Select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              icon={<MapPin className="w-4 h-4 text-surface-50" />}
              className="sm:w-[170px] truncate"
            >
              <option value="All">All Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </Select>
          </div>
        </Card>
      </motion.div>

      {/* Grid List */}
      <motion.div variants={slideUp}>
        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-[16px] font-medium text-surface-50 border border-dashed border-border rounded-[8px] bg-card/40">
            No staff members match the selected filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((staff, idx) => (
              <motion.div key={staff.uid} variants={slideUp} custom={idx}>
                <Card className="h-full border border-border rounded-[8px] bg-card group flex flex-col justify-between">
                  <CardContent className="p-8 space-y-6">
                    {/* Header Profile */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-background border border-border text-surface-cream font-bold flex items-center justify-center text-sm uppercase">
                            {staff.name.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <h3 className="text-[15px] font-bold text-surface-cream leading-tight">
                            {staff.name}
                          </h3>
                          <Badge color={staff.role === 'admin' ? 'cream' : 'blue'}>
                            {staff.role === 'admin' ? 'Admin' : 'Supervisor'}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(staff)}
                          title="Edit Staff"
                          className="h-9 w-9 text-surface-50 hover:bg-muted/50 rounded-full"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStaff(staff.uid, staff.name)}
                          title="Delete Staff"
                          className="h-9 w-9 text-surface-50 hover:bg-muted/50 rounded-full hover:text-fn-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Details list */}
                    <div className="space-y-3 pt-6 border-t border-border text-[13px] font-medium text-surface-cream">
                      <div className="flex items-center gap-3 text-surface-50">
                        <Phone className="w-4 h-4 text-blue shrink-0" />
                        <span>{staff.phone}</span>
                      </div>
                      {staff.email && (
                        <div className="flex items-center gap-3 text-surface-50">
                          <Mail className="w-4 h-4 text-blue shrink-0" />
                          <span className="truncate">{staff.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-surface-50">
                        <MapPin className="w-4 h-4 text-blue shrink-0" />
                        <span className="truncate text-surface-cream font-semibold">{getSiteName(staff.siteId)}</span>
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
              {/* Profile Photo */}
              <PhotoUpload
                label="Profile Photo"
                value={photo}
                onChange={setPhoto}
              />

              {/* Full Name */}
              <Input
                label="Full Name *"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kamble"
              />

              {/* Username */}
              <Input
                label="Username (for login)"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ramesh.kamble"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <Input
                  label="Phone Number *"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />

                {/* Email */}
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@firm.com"
                />
              </div>

              {/* Password */}
              <Input
                label={editingStaff ? 'Change Password (leave blank to keep current)' : 'Password *'}
                type="password"
                required={!editingStaff}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingStaff ? 'Keep current password' : 'Set login password'}
              />

              {/* Role */}
              <div>
                <label className="text-[11px] font-bold text-surface-50 uppercase tracking-widest block mb-2">System Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('supervisor')}
                    className={`p-3.5 text-[11px] uppercase tracking-wider font-bold rounded-full border flex items-center justify-center gap-2 transition-all ${
                      role === 'supervisor'
                        ? 'bg-surface-cream border-surface-cream text-just-black'
                        : 'bg-background border-border text-surface-50 hover:bg-muted'
                    }`}
                  >
                    <HardHat className="w-4 h-4" />
                    Supervisor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3.5 text-[11px] uppercase tracking-wider font-bold rounded-full border flex items-center justify-center gap-2 transition-all ${
                      role === 'admin'
                        ? 'bg-surface-cream border-surface-cream text-just-black'
                        : 'bg-background border-border text-surface-50 hover:bg-muted'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Administrator
                  </button>
                </div>
              </div>

              {/* Assigned Site */}
              <Select
                label="Assigned Job Site"
                value={assignedSiteId}
                onChange={(e) => setAssignedSiteId(e.target.value)}
                className="text-surface-cream"
              >
                <option value="">Global Assignment (All Sites / Owner)</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </Select>

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
