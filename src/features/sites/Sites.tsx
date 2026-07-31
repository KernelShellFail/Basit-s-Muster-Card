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
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { staggerContainer } from '../../utils/animations';
import { useSites, useUsers, useAddSite, useRemoveSite } from '../../api/queries';
import { makeId } from '../../config/appConfig';

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
      const newId = makeId('site');
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

  const statusBadgeColor = (s: Site['status']) => {
    if (s === 'active') return 'success' as const;
    if (s === 'on-hold') return 'warning' as const;
    return 'muted' as const;
  };

  const resetForm = () => {
    setEditingSiteId(null);
    setName('');
    setAddress('');
    setGpsCoordinates('');
    setStatus('active');
    setSupervisorId('');
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      <PageHeader
        eyebrow="sites"
        eyebrowColor="text-blue"
        title={`${t('sites')} Logs`}
        description="Configure physical work locations, GPS parameters, and assign supervising staff."
        actions={
          <Button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            {t('registerSite')}
          </Button>
        }
      />

      {/* Sites Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sites.map(site => {
          const supervisorName = getSupervisorName(site.supervisorId);
          
          return (
            <Card key={site.id} className="overflow-hidden border border-border flex flex-col group transition-all duration-300">
              {/* Image banner mock */}
              <div className="h-28 bg-background relative flex items-center justify-center border-b border-border overflow-hidden">
                <Map className="w-14 h-14 text-surface-50/30 transform group-hover:scale-110 transition-transform duration-500" />
                <span className="absolute top-4 right-4">
                  <Badge color={statusBadgeColor(site.status)}>{site.status}</Badge>
                </span>
                <span className="absolute bottom-4 left-4">
                  <Badge color="muted">ID: {site.id}</Badge>
                </span>
              </div>

              {/* Site Details */}
              <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-[24px] font-semibold text-surface-cream truncate" title={site.name}>
                    {site.name}
                  </h3>
                  <p className="text-[14px] text-surface-50 font-medium mt-2 flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-blue shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{site.address}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-5 border-y border-border">
                  <div>
                    <span className="text-[11px] font-medium text-surface-50 uppercase tracking-widest block mb-2">Supervisor</span>
                    <span className="font-semibold text-surface-cream truncate block text-[14px]">{supervisorName}</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-surface-50 uppercase tracking-widest block mb-2">Workers Active</span>
                    <span className="font-semibold text-surface-cream flex items-center gap-2 text-[16px]">
                      <Users className="w-5 h-5 text-blue" />
                      {site.workersCount}
                    </span>
                  </div>
                </div>

                {/* GPS and Navigation details */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-[13px] text-surface-50 font-medium min-w-0">
                    <Navigation className="w-4 h-4 text-blue shrink-0" />
                    <span className="truncate" title={site.gpsCoordinates}>{site.gpsCoordinates}</span>
                  </div>

                  <div className="flex items-center gap-1 bg-card rounded-full border border-border p-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`https://maps.google.com/?q=${site.gpsCoordinates}`, '_blank')}
                      title="View Map"
                      className="h-10 w-10"
                    >
                      <MapPin className="w-4 h-4 text-surface-50" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSiteClick(site)}
                      title="Edit Site"
                      className="h-10 w-10"
                    >
                      <Edit2 className="w-4 h-4 text-surface-50" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSiteClick(site.id, site.name)}
                      title="Delete Site"
                      className="h-10 w-10 text-fn-error hover:bg-fn-error/10 hover:text-fn-error"
                    >
                      <Trash2 className="w-4 h-4" />
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
              <div>
                <Input
                  label="Site Location Name *"
                  type="text"
                  required
                  placeholder="e.g. BKC Commercial Towers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Physical Address *"
                  type="text"
                  required
                  placeholder="Street and area coordinates..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="GPS Coordinates (Latitude, Longitude)"
                  type="text"
                  placeholder="e.g. 19.0596, 72.8682"
                  value={gpsCoordinates}
                  onChange={(e) => setGpsCoordinates(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Site Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </Select>

                <Select
                  label="Assign Supervisor"
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                >
                  <option value="">Select Supervisor</option>
                  {supervisorsList.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
                </Select>
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
