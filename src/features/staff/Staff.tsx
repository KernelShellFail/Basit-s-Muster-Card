import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  X, 
  HardHat, 
  UserSquare2
} from 'lucide-react';
import { UserProfile, Role } from '../../services/db';

export const Staff = () => {
  const { users, sites, addUser, removeUser, currentLanguage } = useAppStore();
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

  // Handle Edit Trigger
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

  // Handle Open Create Modal
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

  // Save staff member
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

  // Delete staff member
  const handleDeleteStaff = (uid: string, userName: string) => {
    if (confirm(`Are you sure you want to remove ${userName} from staff list?`)) {
      removeUser(uid);
      showToast('Staff profile deleted.');
    }
  };

  // Get site name helper
  const getSiteName = (siteId?: string) => {
    if (!siteId) return 'Global (Unassigned)';
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown Site';
  };

  // Filter list of users (excluding 'owner' and 'labour' mock users for staff list)
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
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-construction-850 dark:text-white">Staff Directory</h1>
          <p className="text-xs text-construction-500 mt-1">Manage project administrators, field supervisors, and assign their job sites.</p>
        </div>
        
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 shadow-md transition-colors shrink-0 align-self-start"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff (स्टाफ जोड़ें)
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-construction-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-construction-250 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500 placeholder-construction-400 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-construction-250 dark:border-construction-800 rounded-xl bg-white dark:bg-construction-950">
            <ShieldAlert className="w-3.5 h-3.5 text-construction-400" />
            <select
              value={roleFilter}
              onChange={(e: any) => setRoleFilter(e.target.value)}
              className="text-xs bg-transparent text-construction-650 dark:text-construction-300 outline-none border-none pr-2"
            >
              <option value="All">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="supervisor">Supervisors</option>
            </select>
          </div>

          {/* Site Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-construction-250 dark:border-construction-800 rounded-xl bg-white dark:bg-construction-950">
            <MapPin className="w-3.5 h-3.5 text-construction-400" />
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="text-xs bg-transparent text-construction-650 dark:text-construction-300 outline-none border-none pr-2 max-w-[150px]"
            >
              <option value="All">All Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {filteredStaff.length === 0 ? (
        <div className="p-12 text-center text-xs text-construction-450 border border-dashed border-construction-200 dark:border-construction-800 rounded-2xl bg-white dark:bg-construction-900 shadow-sm">
          No staff members match the selected filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(staff => (
            <div 
              key={staff.uid}
              className="p-5 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm relative group overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-construction-100 dark:bg-construction-800/80 text-construction-800 dark:text-white font-extrabold flex items-center justify-center border border-construction-200 dark:border-construction-700/60 uppercase">
                      {staff.name.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-construction-850 dark:text-white flex items-center gap-1.5">
                        {staff.name}
                      </h3>
                      <span className={`mt-1 inline-flex text-[9px] font-black px-2 py-0.5 rounded-full ${
                        staff.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {staff.role === 'admin' ? 'Administrator' : 'Supervisor'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditClick(staff)}
                      className="p-1.5 rounded-lg border border-construction-150 dark:border-construction-800/50 hover:bg-construction-50 dark:hover:bg-construction-950 text-construction-600 dark:text-construction-450 transition-colors"
                      title="Edit Staff"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(staff.uid, staff.name)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-500/10 text-red-500 dark:border-red-950/25 transition-colors"
                      title="Delete Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 border-t border-construction-100 dark:border-construction-800/40 pt-3 text-[11px] font-semibold text-construction-650 dark:text-construction-350">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-construction-400" />
                    <span>{staff.phone}</span>
                  </div>
                  {staff.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-construction-400" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-safety-500" />
                    <span className="truncate text-construction-800 dark:text-white font-bold">{getSiteName(staff.siteId)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-construction-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-construction-400 hover:bg-construction-50 dark:hover:bg-construction-950 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black text-construction-850 dark:text-white flex items-center gap-2 mb-4">
              <UserSquare2 className="w-5 h-5 text-safety-500" />
              {editingStaff ? 'Edit Staff Profile' : 'Register New Staff'}
            </h3>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-[10px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kamble"
                  className="w-full text-xs px-3.5 py-2.5 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500 placeholder-construction-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Phone */}
                <div>
                  <label className="text-[10px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full text-xs px-3.5 py-2.5 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500 placeholder-construction-400 outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@mustermate.com"
                    className="w-full text-xs px-3.5 py-2.5 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500 placeholder-construction-400 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold text-construction-660 dark:text-construction-400 block mb-1">
                  {editingStaff ? 'Change Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingStaff ? 'Keep current password' : 'Set login password'}
                  className="w-full text-xs px-3.5 py-2.5 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500 placeholder-construction-400 outline-none"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-[10px] font-bold text-construction-600 dark:text-construction-400 block mb-1">System Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('supervisor')}
                    className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                      role === 'supervisor'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                        : 'border-construction-200 dark:border-construction-800 text-construction-600 dark:text-construction-400 hover:bg-construction-50 dark:hover:bg-construction-950'
                    }`}
                  >
                    <HardHat className="w-4 h-4" />
                    Supervisor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                      role === 'admin'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-600'
                        : 'border-construction-200 dark:border-construction-800 text-construction-600 dark:text-construction-400 hover:bg-construction-50 dark:hover:bg-construction-950'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Administrator
                  </button>
                </div>
              </div>

              {/* Assigned Site */}
              <div>
                <label className="text-[10px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Assigned Job Site</label>
                <select
                  value={assignedSiteId}
                  onChange={(e) => setAssignedSiteId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:ring-2 focus:ring-safety-500 outline-none"
                >
                  <option value="">Global Assignment (All Sites / Owner)</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-construction-150 dark:border-construction-800/40 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-construction-250 dark:border-construction-800 rounded-xl text-xs font-bold text-construction-600 dark:text-construction-350 hover:bg-construction-50 dark:hover:bg-construction-950 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 transition-colors shadow-md"
                >
                  {editingStaff ? 'Save Changes' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
