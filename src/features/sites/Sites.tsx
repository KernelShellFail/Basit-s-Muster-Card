import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  MapPin, 
  Map, 
  Plus, 
  X, 
  User, 
  Users, 
  Activity, 
  CheckCircle,
  Clock,
  Navigation
} from 'lucide-react';
import type { Site } from '../../services/db';

export const Sites = () => {
  const { sites, addSite, removeSite, currentLanguage, users } = useAppStore();
  const { t } = useTranslation(currentLanguage);

  // States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'on-hold'>('active');
  const [supervisorId, setSupervisorId] = useState('');

  // Mock list of supervisors
  const supervisorsList = users.filter(u => u.role === 'supervisor');

  const handleEditSiteClick = (site: Site) => {
    setEditingSiteId(site.id);
    setName(site.name);
    setAddress(site.address);
    setGpsCoordinates(site.gpsCoordinates);
    setStatus(site.status);
    setSupervisorId(site.supervisorId || '');
    setShowAddModal(true);
  };

  const handleRegisterSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      showToast('Name and Address are required!', 'error');
      return;
    }

    if (editingSiteId) {
      const existing = sites.find(s => s.id === editingSiteId);
      const updatedSite: Site = {
        ...existing,
        id: editingSiteId,
        name,
        address,
        gpsCoordinates,
        status,
        supervisorId,
        workersCount: existing?.workersCount || 0
      };
      addSite(updatedSite);
      showToast(`Site ${name} updated successfully!`);
    } else {
      const newId = `site-0${sites.length + 1}`;
      const newSite: Site = {
        id: newId,
        name,
        address,
        gpsCoordinates,
        status,
        supervisorId,
        workersCount: 0
      };
      addSite(newSite);
      showToast(`Site ${name} registered successfully!`);
    }
    
    setShowAddModal(false);
    setEditingSiteId(null);
    setName('');
    setAddress('');
    setGpsCoordinates('');
    setSupervisorId('');
  };

  const handleDeleteSiteClick = (siteId: string, siteName: string) => {
    if (confirm(`Are you sure you want to delete ${siteName}? This will reset assignments for all workers assigned to this site.`)) {
      removeSite(siteId);
      showToast(`Site ${siteName} deleted.`);
    }
  };

  const getSupervisorName = (id: string) => {
    const supervisor = supervisorsList.find(s => s.uid === id);
    return supervisor ? supervisor.name : 'Not Assigned';
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-construction-850 dark:text-white">{t('sites')} Logs</h1>
          <p className="text-xs text-construction-500 mt-1">Configure physical work locations, GPS parameters, and assign supervising staff.</p>
        </div>
        
        <button
          onClick={() => {
            setEditingSiteId(null);
            setName('');
            setAddress('');
            setGpsCoordinates('');
            setStatus('active');
            setSupervisorId('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 shadow-md transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('registerSite')}
        </button>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map(site => {
          const supervisorName = getSupervisorName(site.supervisorId);
          
          return (
            <div 
              key={site.id}
              className="rounded-2xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Image banner mock */}
              <div className="h-32 bg-construction-100 dark:bg-construction-850 relative flex items-center justify-center border-b border-construction-200 dark:border-construction-800">
                <Map className="w-12 h-12 text-construction-400 opacity-60" />
                <span className={`absolute top-4 right-4 text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                  site.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                  site.status === 'on-hold' ? 'bg-amber-500/10 text-amber-600' :
                  'bg-slate-500/10 text-slate-600'
                }`}>
                  {site.status.toUpperCase()}
                </span>
                <span className="absolute bottom-4 left-4 text-[9px] font-bold bg-construction-900/60 text-white px-2 py-0.5 rounded-md">
                  ID: {site.id}
                </span>
              </div>

              {/* Site Details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-construction-850 dark:text-white truncate" title={site.name}>
                    {site.name}
                  </h3>
                  <p className="text-xs text-construction-500 mt-1 flex items-start gap-1">
                    <MapPin className="w-4 h-4 text-safety-500 shrink-0 mt-0.5" />
                    <span className="truncate">{site.address}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-construction-100 dark:border-construction-800/60 text-xs">
                  {/* Supervisor */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-construction-400 uppercase tracking-wider block">Supervisor</span>
                    <span className="font-semibold text-construction-800 dark:text-white truncate block">{supervisorName}</span>
                  </div>

                  {/* Workers count */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-construction-400 uppercase tracking-wider block">Workers Active</span>
                    <span className="font-extrabold text-construction-900 dark:text-white flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-construction-500" />
                      {site.workersCount}
                    </span>
                  </div>
                </div>

                {/* GPS and Navigation details */}
                <div className="flex items-center justify-between pt-3 border-t border-construction-100 dark:border-construction-800/40 mt-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-construction-500 font-semibold">
                    <Navigation className="w-3.5 h-3.5 text-safety-500" />
                    <span>{site.gpsCoordinates}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a 
                      href={`https://maps.google.com/?q=${site.gpsCoordinates}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-safety-600 hover:text-safety-500"
                    >
                      View Map
                    </a>
                    <button
                      onClick={() => handleEditSiteClick(site)}
                      className="text-[10px] font-bold text-construction-650 hover:text-construction-950 dark:text-construction-400 dark:hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSiteClick(site.id, site.name)}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register Site */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-construction-950 rounded-2xl border border-construction-200 dark:border-construction-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-construction-200 dark:border-construction-800 flex items-center justify-between bg-construction-50 dark:bg-construction-900/50">
              <h3 className="text-sm font-black text-construction-850 dark:text-white">
                {editingSiteId ? 'Edit Construction Site' : 'Register New Construction Site'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-construction-200 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-355"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterSite} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Site Location Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BKC Commercial Towers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:outline-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Physical Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street and area coordinates..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:outline-none"
                />
              </div>

              {/* GPS Coordinates */}
              <div>
                <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">GPS Coordinates (Latitude, Longitude)</label>
                <input
                  type="text"
                  placeholder="e.g. 19.0596, 72.8682"
                  value={gpsCoordinates}
                  onChange={(e) => setGpsCoordinates(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div>
                  <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Site Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>

                {/* Supervisor Assign */}
                <div>
                  <label className="text-[11px] font-bold text-construction-600 dark:text-construction-400 block mb-1">Assign Supervisor</label>
                  <select
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white rounded-lg focus:ring-2 focus:ring-safety-500"
                  >
                    <option value="">Select Supervisor</option>
                    {supervisorsList.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
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
                  Register Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
