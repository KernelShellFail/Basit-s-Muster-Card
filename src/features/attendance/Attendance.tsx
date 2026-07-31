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
import { AttendanceRecord, AttendanceStatus, Worker } from '../../services/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { slideUp, staggerContainer } from '../../utils/animations';
import { useWorkers, useSites, useUpdateAttendance } from '../../api/queries';

export const Attendance = () => {
  const { activeSiteId, currentLanguage } = useAppStore();
  const { data: workers = [] } = useWorkers();
  const { data: sites = [] } = useSites();
  const { mutate: saveAttendance } = useUpdateAttendance();
  const { t } = useTranslation(currentLanguage);

  const [selectedDate, setSelectedDate] = useState('2026-07-04');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [attendanceSheet, setAttendanceSheet] = useState<Record<string, Partial<AttendanceRecord>>>({});

  const siteWorkers = workers.filter(w => w.currentSiteId === activeSiteId && w.status === 'Active');

  useEffect(() => {
    const existing = localStorage.getItem('mm_attendance') 
      ? JSON.parse(localStorage.getItem('mm_attendance') || '[]') 
      : [];

    const sheet: Record<string, Partial<AttendanceRecord>> = {};
    
    siteWorkers.forEach(worker => {
      const record = existing.find((r: AttendanceRecord) => r.workerId === worker.id && r.date === selectedDate);
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
          supervisorId: 'usr-super1',
        };
      }
    });

    setAttendanceSheet(sheet);
  }, [selectedDate, activeSiteId, workers]);

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
    const siteCoords = sites.find(s => s.id === activeSiteId)?.gpsCoordinates || '19.0264, 73.0725';
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
    const mockPhoto = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=150&q=80';
    setAttendanceSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        photoProof: mockPhoto
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
  };

  const filteredSiteWorkers = siteWorkers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-10 md:gap-16 lg:gap-20">
      
      {/* Title */}
      <motion.div variants={slideUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium tracking-[-0.03em] leading-[1.1] text-foreground">{t('attendance')} Logs</h1>
          <p className="text-[16px] text-muted-foreground font-medium mt-4">Supervisors: Mark daily presence, shift statuses, and attach geolocated photo proofs.</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm bg-background border border-border h-12 rounded-xl px-4 text-foreground focus:ring-1 focus:ring-ring focus:outline-none transition-shadow cursor-pointer"
          />
        </div>
      </motion.div>

      {/* Grid Settings Bar */}
      <motion.div variants={slideUp}>
        <Card className="p-8 rounded-[32px] bg-gradient-to-br from-card via-card to-background border border-border/80 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="relative flex-1 w-full">
            <Input
              type="text"
              placeholder="Search workers in this site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5 text-muted-foreground" />}
            />
          </div>

          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 bg-background px-6 h-12 flex items-center rounded-xl border border-border">
            Workers count: <span className="text-foreground ml-1 font-bold">{filteredSiteWorkers.length}</span> <span className="ml-1 font-bold">active</span>
          </div>
        </Card>
      </motion.div>

      {/* Workers Attendance List */}
      <motion.div variants={slideUp} className="flex flex-col gap-4">
        {filteredSiteWorkers.length === 0 ? (
          <div className="p-12 text-center text-[16px] font-medium text-muted-foreground border border-dashed border-border/80 rounded-[32px] bg-card/40">
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
              <Card key={worker.id} className="overflow-visible border border-border/80 rounded-[22px] bg-card/60 hover:bg-card hover:border-foreground/20 transition-all duration-300 shadow-sm">
                <CardContent className="p-6.5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Worker basic profile */}
                  <div className="flex items-center gap-4 shrink-0 lg:w-[220px]">
                    <img src={worker.photo} alt={worker.name} className="w-12 h-12 rounded-full object-cover border border-border/60" />
                    <div>
                      <h4 className="text-[15px] font-bold text-foreground leading-tight">{worker.name}</h4>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">{worker.id} • {worker.trade}</p>
                    </div>
                  </div>

                  {/* Status Marking Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(['Present', 'Half-Day', 'Absent', 'Paid-Leave', 'Weekly-Off'] as AttendanceStatus[]).map(st => {
                      const isActive = status === st;
                      let baseClass = "text-[11px] font-bold uppercase tracking-wider border px-4 py-2.5 rounded-full transition-all ";
                      
                      if (isActive) {
                        if (st === 'Present') baseClass += "bg-foreground text-background border-foreground shadow-sm";
                        else if (st === 'Half-Day') baseClass += "bg-primary/10 border border-primary/20 text-primary-foreground dark:text-primary font-bold";
                        else if (st === 'Absent') baseClass += "bg-background border border-border text-muted-foreground/60";
                        else if (st === 'Paid-Leave') baseClass += "bg-background border border-border text-foreground font-bold shadow-sm";
                        else if (st === 'Weekly-Off') baseClass += "bg-background border border-border/40 text-foreground/80 font-bold";
                      } else {
                        baseClass += "border-border/85 text-muted-foreground hover:bg-muted";
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
                          ? 'bg-foreground text-background border-foreground shadow-sm' 
                          : 'border-border/80 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      Night
                    </button>

                    <div className="flex items-center gap-2.5 bg-background px-4 py-2.5 rounded-full border border-border/80">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">OT:</span>
                      <select
                        value={overtimeHours}
                        onChange={(e) => handleOTChange(worker.id, Number(e.target.value))}
                        className="text-[11px] font-bold bg-transparent border-none p-0 text-foreground focus:ring-0 cursor-pointer"
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
                    <input
                      type="text"
                      placeholder="Remarks / notes..."
                      value={remarks}
                      onChange={(e) => handleRemarksChange(worker.id, e.target.value)}
                      className="w-full h-11 text-xs px-4 rounded-xl border border-border/80 bg-background text-foreground focus:ring-1 focus:ring-ring focus:outline-none transition-shadow"
                    />
                    
                    <button
                      onClick={() => triggerGpsCheckin(worker.id)}
                      className={`p-3 rounded-full border shrink-0 transition-colors ${
                        hasGps 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : 'border-border/80 text-muted-foreground hover:bg-muted'
                      }`}
                      title="Simulate Site GPS Scan"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => triggerPhotoUpload(worker.id)}
                      className={`p-3 rounded-full border shrink-0 transition-colors ${
                        hasPhoto 
                          ? 'bg-primary/10 text-primary-foreground dark:text-primary border-primary/20 shadow-[0_0_8px_rgba(190,255,80,0.15)]' 
                          : 'border-border/80 text-muted-foreground hover:bg-muted'
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
