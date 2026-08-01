import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  Calendar, 
  MapPin, 
  Moon, 
  Clock, 
  FileCheck, 
  Camera, 
  Search
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, LocalDB } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { DatePicker } from '../../components/ui/DatePicker';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { slideUp, staggerContainer } from '../../utils/animations';
import { useWorkers, useSites, useAttendance, useUpdateAttendance } from '../../api/queries';
import { appConfig } from '../../config/appConfig';

export const Attendance = () => {
  const { activeSiteId, currentLanguage, currentUser } = useAppStore();
  const { data: workers = [] } = useWorkers();
  const { data: sites = [] } = useSites();
  const { data: attendance = [] } = useAttendance();
  const { mutate: saveAttendance } = useUpdateAttendance();
  const { t } = useTranslation(currentLanguage);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [attendanceSheet, setAttendanceSheet] = useState<Record<string, Partial<AttendanceRecord>>>({});

  const siteWorkers = workers.filter(w => w.currentSiteId === activeSiteId && w.status === 'Active');

  useEffect(() => {
    const sheet: Record<string, Partial<AttendanceRecord>> = {};
    
    siteWorkers.forEach(worker => {
      const record = attendance.find((r: AttendanceRecord) => r.workerId === worker.id && r.date === selectedDate);
      if (record) {
        sheet[worker.id] = { ...record };
      } else {
        sheet[worker.id] = {
          workerId: worker.id,
          date: selectedDate,
          status: 'Present', 
          isNightShift: false,
          overtimeHours: 0,
          siteId: activeSiteId,
          supervisorId: currentUser?.uid || '',
        };
      }
    });

    setAttendanceSheet(sheet);
  }, [selectedDate, activeSiteId, workers, attendance]);

  const handleStatusChange = (workerId: string, status: AttendanceStatus) => {
    setAttendanceSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        status
      }
    }));
  };

  const handleToggleNightShift = (workerId: string) => {
    setAttendanceSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        isNightShift: !prev[workerId].isNightShift
      }
    }));
  };

  const handleOTChange = (workerId: string, hours: number) => {
    setAttendanceSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        overtimeHours: hours
      }
    }));
  };

  const handleRemarksChange = (workerId: string, remarks: string) => {
    setAttendanceSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        remarks
      }
    }));
  };

  const triggerGpsCheckin = (workerId: string) => {
    const siteCoords = sites.find(s => s.id === activeSiteId)?.gpsCoordinates || '';
    if (!siteCoords) {
      showToast('No GPS coordinates configured for this site.', 'error');
      return;
    }
    setAttendanceSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        gpsCoordinates: siteCoords
      }
    }));
    showToast(`GPS verified for worker inside Geofence.`);
  };

  const triggerPhotoUpload = (workerId: string) => {
    setAttendanceSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        photoProof: appConfig.defaultAttendancePhoto
      }
    }));
    showToast(`Photo check-in proof uploaded.`);
  };

  const handleSaveSheet = () => {
    const recordsToSave = Object.values(attendanceSheet) as AttendanceRecord[];
    const sanitized = recordsToSave.map(r => ({
      ...r,
      id: r.id || `att-${r.workerId}-${r.date}`
    }));

    saveAttendance(sanitized);
    showToast(`Attendance muster sheet finalized for ${selectedDate}.`);
    LocalDB.createNotification({
      title: 'Attendance finalized',
      message: `Muster sheet for ${selectedDate} has been finalized across active sites.`,
      type: 'success',
      link: '/attendance',
    }).catch(() => {});
  };

  const filteredSiteWorkers = siteWorkers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      {/* Title */}
      <PageHeader
        eyebrow="attendance"
        eyebrowColor="text-pink"
        title={`${t('attendance')} Logs`}
        description="Supervisors: Mark daily presence, shift statuses, and attach geolocated photo proofs."
        actions={
          <div className="flex items-center gap-3 shrink-0">
            <Calendar className="w-5 h-5 text-pink" />
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              className="w-40"
            />
          </div>
        }
      />

      {/* Grid Settings Bar */}
      <motion.div variants={slideUp}>
        <Card className="p-8 rounded-[8px] bg-card border border-border flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex-1 w-full">
            <Input
              type="text"
              placeholder="Search workers in this site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5 text-surface-50" />}
            />
          </div>

          <div className="text-[11px] font-semibold text-surface-50 uppercase tracking-wider shrink-0 bg-background px-6 h-12 flex items-center rounded-[8px] border border-border">
            Workers count: <span className="text-surface-cream ml-1 font-bold">{filteredSiteWorkers.length}</span> <span className="ml-1 font-bold">active</span>
          </div>
        </Card>
      </motion.div>

      {/* Workers Attendance List */}
      <motion.div variants={slideUp} className="flex flex-col gap-4">
        {filteredSiteWorkers.length === 0 ? (
          <div className="p-12 text-center text-[16px] font-medium text-surface-50 border border-dashed border-border rounded-[8px] bg-card/40">
            No active workers found assigned to this site. Assign workers in Workers Directory.
          </div>
        ) : (
          filteredSiteWorkers.map(worker => {
            const sheetRecord = attendanceSheet[worker.id] || {};
            const status = sheetRecord.status || 'Present';
            const isNightShift = sheetRecord.isNightShift || false;
            const overtimeHours = sheetRecord.overtimeHours || 0;
            const hasGps = !!sheetRecord.gpsCoordinates;
            const hasPhoto = !!sheetRecord.photoProof;
            const remarks = sheetRecord.remarks || '';

            return (
              <Card key={worker.id} className="overflow-visible border border-border rounded-[8px] bg-card">
                <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Worker basic profile */}
                  <div className="flex items-center gap-4 shrink-0 lg:w-[220px]">
                    <img src={worker.photo} alt={worker.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                    <div>
                      <h4 className="text-[15px] font-bold text-surface-cream leading-tight">{worker.name}</h4>
                      <p className="text-[11px] uppercase tracking-wider text-surface-50 font-semibold mt-1">{worker.id} • {worker.trade}</p>
                    </div>
                  </div>

                  {/* Status Marking Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(['Present', 'Half-Day', 'Absent', 'Paid-Leave', 'Weekly-Off'] as AttendanceStatus[]).map(st => {
                      const isActive = status === st;
                      let baseClass = "text-[11px] font-bold uppercase tracking-wider border px-4 py-2.5 rounded-full transition-all ";
                      
                      if (isActive) {
                        if (st === 'Present') baseClass += "bg-highlight text-highlight-foreground border-highlight";
                        else if (st === 'Half-Day') baseClass += "bg-fn-warning/10 border border-fn-warning/30 text-fn-warning font-bold";
                        else if (st === 'Absent') baseClass += "bg-background border border-border text-surface-50/60";
                        else if (st === 'Paid-Leave') baseClass += "bg-background border border-border text-surface-cream font-bold";
                        else if (st === 'Weekly-Off') baseClass += "bg-background border border-border/40 text-surface-cream/80 font-bold";
                      } else {
                        baseClass += "border-border/85 text-surface-50 hover:bg-muted";
                      }
                      
                      if (st === 'Unpaid-Leave' || st === 'Holiday') return null;

                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(worker.id, st)}
                          className={baseClass}
                        >
                          {st === 'Present' ? 'Present' :
                           st === 'Half-Day' ? 'Half-Day' :
                           st === 'Absent' ? 'Absent' :
                           st === 'Paid-Leave' ? 'Paid Leave' : 'Weekly Off'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Overtime & Night Shift Panel */}
                  <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <button
                      onClick={() => handleToggleNightShift(worker.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all ${
                        isNightShift 
                          ? 'bg-highlight text-highlight-foreground border-highlight' 
                          : 'border-border/80 text-surface-50 hover:bg-muted'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      Night
                    </button>

                    <div className="flex items-center gap-2.5 bg-background px-4 py-2.5 rounded-full border border-border/80">
                      <Clock className="w-4 h-4 text-surface-50" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-surface-cream">OT:</span>
                      <select
                        value={overtimeHours}
                        onChange={(e) => handleOTChange(worker.id, Number(e.target.value))}
                        className="text-[11px] font-bold bg-transparent border-none p-0 text-surface-cream focus:ring-0 cursor-pointer"
                      >
                        <option value={0}>0 hrs</option>
                        <option value={1}>1 hr</option>
                        <option value={2}>2 hrs</option>
                        <option value={3}>3 hrs</option>
                        <option value={4}>4 hrs</option>
                      </select>
                    </div>
                  </div>

                  {/* Remarks & Proof Upload */}
                  <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                    <Input
                      type="text"
                      placeholder="Remarks / notes..."
                      value={remarks}
                      onChange={(e) => handleRemarksChange(worker.id, e.target.value)}
                      className="h-11"
                    />
                    
                    <button
                      onClick={() => triggerGpsCheckin(worker.id)}
                      className={`p-3 rounded-full border shrink-0 transition-colors ${
                        hasGps 
                          ? 'bg-fn-success/10 text-fn-success border-fn-success/20' 
                          : 'border-border/80 text-surface-50 hover:bg-muted'
                      }`}
                      title="Simulate Site GPS Scan"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => triggerPhotoUpload(worker.id)}
                      className={`p-3 rounded-full border shrink-0 transition-colors ${
                        hasPhoto 
                          ? 'bg-pink/10 text-pink border-pink/20' 
                          : 'border-border/80 text-surface-50 hover:bg-muted'
                      }`}
                      title="Attach Camera Check-in Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>

      {/* Save Button */}
      <AnimatePresence>
        {siteWorkers.length > 0 && (
          <motion.div variants={slideUp} initial="hidden" animate="visible" exit="hidden" className="flex justify-end pt-2">
            <Button onClick={handleSaveSheet} size="lg" leftIcon={<FileCheck className="w-5 h-5" />}>
              Finalize & Save Attendance Muster
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
