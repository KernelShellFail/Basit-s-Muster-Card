import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { showToast } from '../../components/Toast';
import { 
  Calendar, 
  MapPin, 
  Moon, 
  Clock, 
  FileCheck, 
  Upload, 
  Camera, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Search
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, Worker } from '../../services/db';

export const Attendance = () => {
  const { workers, sites, activeSiteId, saveAttendance, currentLanguage, selectedRole } = useAppStore();
  const { t } = useTranslation(currentLanguage);

  // States
  const [selectedDate, setSelectedDate] = useState('2026-07-04');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state grid for attendance before committing
  const [attendanceSheet, setAttendanceSheet] = useState<Record<string, Partial<AttendanceRecord>>>({});

  // Filter workers assigned to the active site
  const siteWorkers = workers.filter(w => w.currentSiteId === activeSiteId && w.status === 'Active');

  // Load existing records from LocalDB if present for this date & site
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
        // Defaults
        sheet[worker.id] = {
          workerId: worker.id,
          date: selectedDate,
          status: 'Present', // default optimistic state
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

  // Simulate Geo GPS checkin
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

  // Simulate Photo Upload Proof
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
    
    // Ensure all records have valid keys
    const sanitized = recordsToSave.map(r => ({
      ...r,
      id: r.id || `att-${r.workerId}-${r.date}`
    }));

    saveAttendance(sanitized);
    showToast(`Attendance muster sheet finalized for ${selectedDate}.`);
  };

  // Filter workers based on search
  const filteredSiteWorkers = siteWorkers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-construction-850 dark:text-white">{t('attendance')} Logs</h1>
          <p className="text-xs text-construction-500 mt-1">Supervisors: Mark daily presence, shift statuses, and attach geolocated photo proofs.</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-4 h-4 text-construction-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 text-construction-850 dark:text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-safety-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid Settings Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4.5 h-4.5 text-construction-450 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search workers in this site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white focus:ring-2 focus:ring-safety-500 focus:outline-none"
          />
        </div>

        <div className="text-[10px] font-bold text-construction-500 shrink-0">
          Workers count: {filteredSiteWorkers.length} active
        </div>
      </div>

      {/* Workers Attendance List */}
      <div className="space-y-3">
        {filteredSiteWorkers.length === 0 ? (
          <div className="p-12 text-center text-xs font-medium text-construction-450 border border-dashed border-construction-200 dark:border-construction-800 rounded-2xl">
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
              <div 
                key={worker.id}
                className="p-4 rounded-2xl bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:shadow-md"
              >
                {/* Worker basic profile */}
                <div className="flex items-center gap-3 shrink-0">
                  <img src={worker.photo} alt={worker.name} className="w-10 h-10 rounded-full object-cover border border-construction-200" />
                  <div>
                    <h4 className="text-xs font-bold text-construction-850 dark:text-white leading-tight">{worker.name}</h4>
                    <p className="text-[10px] text-construction-500 mt-0.5">{worker.id} • {worker.trade} ({worker.skillLevel})</p>
                  </div>
                </div>

                {/* Status Marking Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {(['Present', 'Half-Day', 'Absent', 'Paid-Leave', 'Weekly-Off'] as AttendanceStatus[]).map(st => {
                    const btnStyleMap: Record<AttendanceStatus, string> = {
                      'Present': 'border-emerald-200 text-emerald-700 hover:bg-emerald-500/10 dark:border-emerald-800/40 dark:text-emerald-400',
                      'Half-Day': 'border-amber-200 text-amber-700 hover:bg-amber-500/10 dark:border-amber-800/40 dark:text-amber-400',
                      'Absent': 'border-red-200 text-red-700 hover:bg-red-500/10 dark:border-red-800/40 dark:text-red-400',
                      'Paid-Leave': 'border-sky-200 text-sky-700 hover:bg-sky-500/10 dark:border-sky-800/40 dark:text-sky-400',
                      'Weekly-Off': 'border-slate-200 text-slate-700 hover:bg-slate-500/10 dark:border-slate-800/40 dark:text-slate-400',
                      'Unpaid-Leave': '',
                      'Holiday': ''
                    };

                    const activeStyleMap: Record<AttendanceStatus, string> = {
                      'Present': 'bg-emerald-500 text-white font-extrabold shadow-sm border-emerald-500 hover:bg-emerald-500',
                      'Half-Day': 'bg-amber-400 text-construction-950 font-extrabold shadow-sm border-amber-400 hover:bg-amber-400',
                      'Absent': 'bg-red-500 text-white font-extrabold shadow-sm border-red-500 hover:bg-red-500',
                      'Paid-Leave': 'bg-sky-500 text-white font-extrabold shadow-sm border-sky-500 hover:bg-sky-500',
                      'Weekly-Off': 'bg-slate-400 text-white font-extrabold shadow-sm border-slate-400 hover:bg-slate-400',
                      'Unpaid-Leave': '',
                      'Holiday': ''
                    };

                    const isActive = status === st;
                    
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(worker.id, st)}
                        className={`text-[10px] font-bold border px-2.5 py-1.5 rounded-xl transition-all ${
                          isActive ? activeStyleMap[st] : btnStyleMap[st]
                        }`}
                      >
                        {st === 'Present' ? 'Present (हाजिर)' :
                         st === 'Half-Day' ? 'Half-Day (आधा दिन)' :
                         st === 'Absent' ? 'Absent (गैरहाजिर)' :
                         st === 'Paid-Leave' ? 'Paid Leave (सवैतनिक)' : 'Weekly Off (साप्ताहिक छुट्टी)'}
                      </button>
                    );
                  })}
                </div>

                {/* Overtime & Night Shift Panel */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Night Shift Toggle */}
                  <button
                    onClick={() => handleToggleNightShift(worker.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                      isNightShift 
                        ? 'bg-construction-800 text-white border-construction-700 dark:bg-construction-700 dark:border-construction-600' 
                        : 'border-construction-200 dark:border-construction-800 text-construction-600 dark:text-construction-400 hover:bg-construction-50'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Night (रात)
                  </button>

                  {/* OT Hours Slider/Input */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-construction-450" />
                    <span className="text-[10px] font-bold text-construction-600 dark:text-construction-400">OT:</span>
                    <select
                      value={overtimeHours}
                      onChange={(e) => handleOTChange(worker.id, Number(e.target.value))}
                      className="text-[10px] font-bold bg-white dark:bg-construction-950 border border-construction-200 dark:border-construction-800 rounded-lg px-2 py-1 focus:outline-none"
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
                <div className="flex flex-1 items-center gap-2 min-w-[150px]">
                  <input
                    type="text"
                    placeholder="Remarks / notes..."
                    value={remarks}
                    onChange={(e) => handleRemarksChange(worker.id, e.target.value)}
                    className="flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-800 dark:text-white focus:outline-none"
                  />
                  
                  {/* GPS Coordinates verify */}
                  <button
                    onClick={() => triggerGpsCheckin(worker.id)}
                    className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                      hasGps 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300' 
                        : 'border-construction-200 dark:border-construction-800 text-construction-550 hover:bg-construction-50'
                    }`}
                    title="Simulate Site GPS Scan"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </button>

                  {/* Photo proof checkin */}
                  <button
                    onClick={() => triggerPhotoUpload(worker.id)}
                    className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                      hasPhoto 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300' 
                        : 'border-construction-200 dark:border-construction-800 text-construction-550 hover:bg-construction-50'
                    }`}
                    title="Attach Camera Check-in Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save Button */}
      {siteWorkers.length > 0 && (
        <div className="flex justify-end p-4 bg-white dark:bg-construction-900 border border-construction-200 dark:border-construction-800 rounded-2xl shadow-sm">
          <button
            onClick={handleSaveSheet}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-construction-950 bg-safety-500 hover:bg-safety-600 shadow-md transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            Finalize & Save Attendance Muster
          </button>
        </div>
      )}

    </div>
  );
};
