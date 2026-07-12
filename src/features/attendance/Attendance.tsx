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

export const Attendance = () => {
  const { workers, sites, activeSiteId, saveAttendance, currentLanguage } = useAppStore();
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
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      
      {/* Title */}
      <motion.div variants={slideUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{t('attendance')} Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Supervisors: Mark daily presence, shift statuses, and attach geolocated photo proofs.</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-bold bg-background border border-input rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-brand-500 focus:outline-none transition-shadow"
          />
        </div>
      </motion.div>

      {/* Grid Settings Bar */}
      <motion.div variants={slideUp}>
        <Card glass>
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Input
                type="text"
                placeholder="Search workers in this site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5 text-muted-foreground" />}
              />
            </div>

            <div className="text-sm font-bold text-muted-foreground shrink-0 bg-accent/50 px-4 py-2 rounded-xl border border-border">
              Workers count: <span className="text-foreground">{filteredSiteWorkers.length}</span> active
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Workers Attendance List */}
      <motion.div variants={slideUp} className="space-y-3">
        {filteredSiteWorkers.length === 0 ? (
          <div className="p-12 text-center text-sm font-medium text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-accent/30">
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
              <Card key={worker.id} glass className="overflow-visible hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Worker basic profile */}
                  <div className="flex items-center gap-4 shrink-0 lg:w-[220px]">
                    <img src={worker.photo} alt={worker.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-tight">{worker.name}</h4>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{worker.id} • {worker.trade}</p>
                    </div>
                  </div>

                  {/* Status Marking Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(['Present', 'Half-Day', 'Absent', 'Paid-Leave', 'Weekly-Off'] as AttendanceStatus[]).map(st => {
                      const isActive = status === st;
                      let baseClass = "text-[11px] font-bold border px-3 py-1.5 rounded-xl transition-all ";
                      
                      if (isActive) {
                        if (st === 'Present') baseClass += "bg-emerald-500 text-white border-emerald-500 shadow-sm";
                        else if (st === 'Half-Day') baseClass += "bg-amber-400 text-amber-950 border-amber-400 shadow-sm";
                        else if (st === 'Absent') baseClass += "bg-destructive text-white border-destructive shadow-sm";
                        else if (st === 'Paid-Leave') baseClass += "bg-blue-500 text-white border-blue-500 shadow-sm";
                        else if (st === 'Weekly-Off') baseClass += "bg-muted-foreground text-background border-muted-foreground shadow-sm";
                      } else {
                        if (st === 'Present') baseClass += "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10";
                        else if (st === 'Half-Day') baseClass += "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10";
                        else if (st === 'Absent') baseClass += "border-destructive/30 text-destructive hover:bg-destructive/10";
                        else if (st === 'Paid-Leave') baseClass += "border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10";
                        else if (st === 'Weekly-Off') baseClass += "border-border text-muted-foreground hover:bg-accent";
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
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleToggleNightShift(worker.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                        isNightShift 
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' 
                          : 'border-border text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <Moon className="w-5 h-5" />
                      Night
                    </button>

                    <div className="flex items-center gap-2 bg-accent/50 px-3 py-1.5 rounded-xl border border-border">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-foreground">OT:</span>
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
                    <Input
                      type="text"
                      placeholder="Remarks / notes..."
                      value={remarks}
                      onChange={(e) => handleRemarksChange(worker.id, e.target.value)}
                      className="h-8 text-xs px-3"
                    />
                    
                    <button
                      onClick={() => triggerGpsCheckin(worker.id)}
                      className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                        hasGps 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                          : 'border-border text-muted-foreground hover:bg-accent'
                      }`}
                      title="Simulate Site GPS Scan"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => triggerPhotoUpload(worker.id)}
                      className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                        hasPhoto 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                          : 'border-border text-muted-foreground hover:bg-accent'
                      }`}
                      title="Attach Camera Check-in Photo"
                    >
                      <Camera className="w-5 h-5" />
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
