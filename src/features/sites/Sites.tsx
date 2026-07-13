import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  MapPin, 
  Map, 
  Plus, 
  Users, 
  Navigation,
  Edit2,
  Trash2
} from 'lucide-react';
import type { Site } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { slideUp, staggerContainer } from '../../utils/animations';
import { useSites, useUsers, useAddSite, useRemoveSite } from '../../api/queries';

export const Sites = () => {
  const { currentLanguage } = useAppStore();
  const { data: sites = [] } = useSites();
  const { data: users = [] } = useUsers();
  const { mutate: addSite } = useAddSite();
  const { mutate: removeSite } = useRemoveSite();
  const { t } = useTranslation(currentLanguage);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'on-hold'>('active');
  const [supervisorId, setSupervisorId] = useState('');

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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-[80px]">
      
      {/* Title */}
      <motion.div variants={slideUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[60px] font-medium tracking-[-1.8px] leading-[1] text-foreground">{t('sites')} Logs</h1>
          <p className="text-[16px] text-muted-foreground font-medium mt-4">Configure physical work locations, GPS parameters, and assign supervising staff.</p>
        </div>
        
        <Button
          onClick={() => {
            setEditingSiteId(null);
            setName('');
            setAddress('');
            setGpsCoordinates('');
            setStatus('active');
            setSupervisorId('');
            setShowAddModal(true);
          }}
          leftIcon={<Plus className="w-5 h-5" />}
          className="shrink-0"
        >
          {t('registerSite')}
        </Button>
      </motion.div>

      {/* Sites Grid */}
      <motion.div variants={slideUp} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sites.map(site => {
          const supervisorName = getSupervisorName(site.supervisorId);
          
          return (
            <Card key={site.id} className="overflow-hidden border border-border flex flex-col group transition-all duration-300">
              {/* Image banner mock */}
              <div className="h-40 bg-muted relative flex items-center justify-center border-b border-border overflow-hidden">
                <Map className="w-20 h-20 text-muted-foreground/30 transform group-hover:scale-110 transition-transform duration-500" />
                <span className={`absolute top-6 right-6 text-[10px] font-medium px-4 py-1.5 rounded-full uppercase tracking-[0.1em] ${
                  site.status === 'active' ? 'bg-foreground text-background' :
                  site.status === 'on-hold' ? 'bg-primary/20 text-foreground' :
                  'bg-muted-foreground text-background'
                }`}>
                  {site.status}
                </span>
                <span className="absolute bottom-6 left-6 text-[10px] font-medium uppercase tracking-[0.1em] bg-background text-foreground px-4 py-1.5 rounded-[28px] border border-border">
                  ID: {site.id}
                </span>
              </div>

              {/* Site Details */}
              <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-[20px] font-medium text-foreground truncate" title={site.name}>
                    {site.name}
                  </h3>
                  <p className="text-[14px] text-muted-foreground font-medium mt-2 flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{site.address}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-border text-[14px]">
                  {/* Supervisor */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest block">Supervisor</span>
                    <span className="font-medium text-foreground truncate block">{supervisorName}</span>
                  </div>

                  {/* Workers count */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest block">Workers Active</span>
                    <span className="font-medium text-foreground flex items-center gap-2 text-[16px]">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      {site.workersCount}
                    </span>
                  </div>
                </div>

                {/* GPS and Navigation details */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
                    <Navigation className="w-5 h-5 text-muted-foreground" />
                    <span className="truncate max-w-[120px]" title={site.gpsCoordinates}>{site.gpsCoordinates}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`https://maps.google.com/?q=${site.gpsCoordinates}`, '_blank')}
                      title="View Map"
                    >
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSiteClick(site)}
                      title="Edit Site"
                    >
                      <Edit2 className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSiteClick(site.id, site.name)}
                      title="Delete Site"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Modal: Register Site */}
      <AnimatePresence>
        {showAddModal && (
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title={editingSiteId ? 'Edit Construction Site' : 'Register New Construction Site'}
          >
            <form onSubmit={handleRegisterSite} className="space-y-6">
              {/* Name */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Site Location Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. BKC Commercial Towers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Physical Address *</label>
                <Input
                  type="text"
                  required
                  placeholder="Street and area coordinates..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* GPS Coordinates */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">GPS Coordinates (Latitude, Longitude)</label>
                <Input
                  type="text"
                  placeholder="e.g. 19.0596, 72.8682"
                  value={gpsCoordinates}
                  onChange={(e) => setGpsCoordinates(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Site Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>

                {/* Supervisor Assign */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Assign Supervisor</label>
                  <select
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select Supervisor</option>
                    {supervisorsList.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSiteId ? 'Update Site' : 'Register Site'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
