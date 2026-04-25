import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from '../hooks/useToast';
import { StatCard, Card, Badge, Table, Button, Tabs, Pagination } from '../components/UI';
import { Clock, CheckCircle, Calendar, TrendingUp, Play, Square, Plus, Send } from 'lucide-react';
import styles from './Dashboard.module.css';

const statusBadge = (s) => {
  const map = { active: 'warning', completed: 'success', draft: 'default', submitted: 'accent', approved: 'success', rejected: 'danger' };
  return <Badge variant={map[s] || 'default'}>{s}</Badge>;
};

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [todayLog, setTodayLog] = useState(null);
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attPage, setAttPage] = useState(1);
  const [attPages, setAttPages] = useState(1);
  const [timesheets, setTimesheets] = useState([]);
  const [tsPage, setTsPage] = useState(1);
  const [tsPages, setTsPages] = useState(1);
  const [currentTs, setCurrentTs] = useState(null);
  const [weekStart, setWeekStart] = useState('');
  const [loading, setLoading] = useState({});
  const [punchLoading, setPunchLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }));

  const fetchTodayLog = useCallback(async () => {
    try {
      const { data } = await api.get('/attendance/today');
      setTodayLog(data.log);
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    setLoad('stats', true);
    try {
      const { data } = await api.get('/attendance/stats');
      setStats(data);
    } catch {} finally { setLoad('stats', false); }
  }, []);

  const fetchAttendance = useCallback(async (page = 1) => {
    setLoad('att', true);
    try {
      const { data } = await api.get(`/attendance/history?page=${page}&limit=15`);
      setAttendance(data.logs);
      setAttPages(data.pages);
    } catch {} finally { setLoad('att', false); }
  }, []);

  const fetchTimesheets = useCallback(async (page = 1) => {
    setLoad('ts', true);
    try {
      const { data } = await api.get(`/timesheets/me?page=${page}&limit=10`);
      setTimesheets(data.timesheets);
      setTsPages(data.pages);
    } catch {} finally { setLoad('ts', false); }
  }, []);

  const fetchCurrentTs = useCallback(async () => {
    try {
      const { data } = await api.get('/timesheets/current');
      setCurrentTs(data.timesheet);
      setWeekStart(data.weekStart);
    } catch {}
  }, []);

  useEffect(() => { fetchTodayLog(); fetchStats(); fetchCurrentTs(); }, []);
  useEffect(() => { if (activeTab === 'attendance') fetchAttendance(attPage); }, [activeTab, attPage]);
  useEffect(() => { if (activeTab === 'timesheets') { fetchTimesheets(tsPage); fetchCurrentTs(); } }, [activeTab, tsPage]);

  const handlePunchIn = async () => {
    setPunchLoading(true);
    try {
      await api.post('/attendance/punch-in');
      toast.success('Punched in successfully!');
      fetchTodayLog(); fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Punch-in failed.');
    } finally { setPunchLoading(false); }
  };

  const handlePunchOut = async () => {
    setPunchLoading(true);
    try {
      await api.post('/attendance/punch-out');
      toast.success('Punched out. Have a great day!');
      fetchTodayLog(); fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Punch-out failed.');
    } finally { setPunchLoading(false); }
  };

  const handleSubmitTs = async (id) => {
    try {
      await api.post(`/timesheets/${id}/submit`);
      toast.success('Timesheet submitted for approval!');
      fetchTimesheets(tsPage); fetchCurrentTs();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Submission failed.');
    }
  };

  const tabItems = [
    { label: 'Overview', value: 'overview' },
    { label: 'Attendance', value: 'attendance' },
    { label: 'Timesheets', value: 'timesheets' },
  ];

  const punchedIn = !!todayLog?.punchIn && !todayLog?.punchOut;
  const completed = !!todayLog?.punchOut;

  const attColumns = [
    { key: 'date', label: 'Date', render: v => fmtDate(v) },
    { key: 'punchIn', label: 'Punch In', render: v => fmtTime(v) },
    { key: 'punchOut', label: 'Punch Out', render: v => fmtTime(v) },
    { key: 'hoursWorked', label: 'Hours', render: v => v ? `${v}h` : '—' },
    { key: 'status', label: 'Status', render: v => statusBadge(v) },
  ];

  const tsColumns = [
    { key: 'weekStart', label: 'Week Starting', render: v => fmtDate(v) },
    { key: 'weekEnd', label: 'Week Ending', render: v => fmtDate(v) },
    { key: 'totalHours', label: 'Total Hrs', render: v => `${v}h` },
    { key: 'status', label: 'Status', render: v => statusBadge(v) },
    { key: '_id', label: 'Action', render: (id, row) => row.status === 'draft'
        ? <Button size="sm" variant="secondary" icon={Send} onClick={() => handleSubmitTs(id)}>Submit</Button>
        : null
    },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.pageSub}>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Tabs tabs={tabItems} active={activeTab} onChange={v => setSearchParams({ tab: v })} />
      </div>

      {activeTab === 'overview' && (
        <div className={styles.fade}>
          {/* Clock widget */}
          <Card className={styles.clockCard}>
            <div className={styles.clockLeft}>
              <div className={styles.clockTime}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
              <div className={styles.clockDate}>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div className={styles.clockStatus}>
                {!todayLog && <span className={styles.statusChip}>Not punched in today</span>}
                {punchedIn && <span className={`${styles.statusChip} ${styles.statusIn}`}>🟢 On shift since {fmtTime(todayLog.punchIn)}</span>}
                {completed && <span className={`${styles.statusChip} ${styles.statusDone}`}>✅ Completed — {todayLog.hoursWorked}h worked</span>}
              </div>
            </div>
            <div className={styles.clockRight}>
              {!todayLog && (
                <button className={`${styles.punchBtn} ${styles.punchIn}`} onClick={handlePunchIn} disabled={punchLoading}>
                  <Play size={22} />
                  <span>Punch In</span>
                </button>
              )}
              {punchedIn && (
                <button className={`${styles.punchBtn} ${styles.punchOut}`} onClick={handlePunchOut} disabled={punchLoading}>
                  <Square size={22} />
                  <span>Punch Out</span>
                </button>
              )}
              {completed && (
                <div className={styles.doneMsg}>
                  <CheckCircle size={28} style={{ color: 'var(--success)' }} />
                  <span>Day complete!</span>
                </div>
              )}
            </div>
          </Card>

          {/* Stats */}
          <div className={styles.statsGrid}>
            <StatCard label="Days This Month" value={stats?.totalDays} icon={Calendar} color="accent" loading={loading.stats} />
            <StatCard label="Present Days" value={stats?.presentDays} icon={CheckCircle} color="success" loading={loading.stats} />
            <StatCard label="Total Hours" value={stats?.totalHours ? `${stats.totalHours}h` : null} icon={Clock} color="warning" loading={loading.stats} />
            <StatCard label="Avg Hours/Day" value={stats?.avgHours ? `${stats.avgHours}h` : null} icon={TrendingUp} color="accent" loading={loading.stats} />
          </div>

          {/* Current week timesheet */}
          <Card>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Current Week Timesheet</h3>
              {currentTs?.status === 'draft' && (
                <Button size="sm" icon={Send} onClick={() => handleSubmitTs(currentTs._id)}>Submit</Button>
              )}
            </div>
            {!currentTs
              ? <p className={styles.emptyMsg}>No timesheet for this week yet. Go to <strong>Timesheets</strong> tab to create one.</p>
              : (
                <div className={styles.tsPreview}>
                  <div className={styles.tsRow}><span>Week</span><strong>{fmtDate(currentTs.weekStart)} – {fmtDate(currentTs.weekEnd)}</strong></div>
                  <div className={styles.tsRow}><span>Total Hours</span><strong>{currentTs.totalHours}h</strong></div>
                  <div className={styles.tsRow}><span>Entries</span><strong>{currentTs.entries?.length} days logged</strong></div>
                  <div className={styles.tsRow}><span>Status</span>{statusBadge(currentTs.status)}</div>
                </div>
              )
            }
          </Card>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className={styles.fade}>
          <Card padding={false}>
            <div className={styles.tableHeader}><h3>Attendance History</h3></div>
            <Table columns={attColumns} data={attendance} loading={loading.att} emptyMsg="No attendance records found." />
            <div style={{ padding: '16px 24px' }}>
              <Pagination page={attPage} pages={attPages} onChange={p => { setAttPage(p); fetchAttendance(p); }} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'timesheets' && (
        <div className={styles.fade}>
          <TimesheetTab
            timesheets={timesheets}
            tsColumns={tsColumns}
            loading={loading.ts}
            currentTs={currentTs}
            weekStart={weekStart}
            onRefresh={() => { fetchTimesheets(tsPage); fetchCurrentTs(); }}
            tsPage={tsPage}
            tsPages={tsPages}
            onPageChange={p => { setTsPage(p); fetchTimesheets(p); }}
          />
        </div>
      )}
    </div>
  );
}

function TimesheetTab({ timesheets, tsColumns, loading, currentTs, weekStart, onRefresh, tsPage, tsPages, onPageChange }) {
  const [form, setForm] = useState({ entries: generateWeekEntries(weekStart) });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentTs?.entries?.length) {
      setForm({ entries: currentTs.entries });
    } else {
      setForm({ entries: generateWeekEntries(weekStart) });
    }
  }, [currentTs, weekStart]);

  const updateEntry = (i, field, val) => {
    setForm(p => {
      const entries = [...p.entries];
      entries[i] = { ...entries[i], [field]: val };
      return { ...p, entries };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const mon = new Date(weekStart);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      await api.post('/timesheets', {
        weekStart,
        weekEnd: sun.toISOString().split('T')[0],
        entries: form.entries.filter(e => e.hours > 0)
      });
      toast.success('Timesheet saved as draft!');
      onRefresh();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const canEdit = !currentTs || currentTs.status === 'draft' || currentTs.status === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)' }}>
            This Week {weekStart ? `— w/c ${new Date(weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
          </h3>
          {canEdit && <Button icon={Plus} loading={saving} onClick={handleSave}>Save Draft</Button>}
        </div>
        {canEdit ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {form.entries.map((entry, i) => (
              <div key={entry.date} className={styles.tsEntry}>
                <span className={styles.tsDay}>{new Date(entry.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <input
                  type="number" min="0" max="12" step="0.5"
                  className={styles.tsHoursInput}
                  value={entry.hours}
                  onChange={e => updateEntry(i, 'hours', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>hrs</span>
                <input
                  type="text"
                  className={styles.tsDescInput}
                  value={entry.description}
                  onChange={e => updateEntry(i, 'description', e.target.value)}
                  placeholder="What did you work on?"
                />
                <input
                  type="text"
                  className={styles.tsProjInput}
                  value={entry.project}
                  onChange={e => updateEntry(i, 'project', e.target.value)}
                  placeholder="Project"
                />
              </div>
            ))}
            <div className={styles.tsTotalRow}>
              <strong>Total</strong>
              <strong>{form.entries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0)}h</strong>
            </div>
          </div>
        ) : (
          <p className={styles.emptyMsg}>Timesheet is <strong>{currentTs?.status}</strong> — {currentTs?.status === 'submitted' ? 'awaiting admin approval.' : 'no further edits allowed.'}</p>
        )}
      </Card>

      <Card padding={false}>
        <div className={styles.tableHeader}><h3>Timesheet History</h3></div>
        <Table columns={tsColumns} data={timesheets} loading={loading} emptyMsg="No timesheets submitted yet." />
        <div style={{ padding: '16px 24px' }}>
          <Pagination page={tsPage} pages={tsPages} onChange={onPageChange} />
        </div>
      </Card>
    </div>
  );
}

function generateWeekEntries(weekStart) {
  if (!weekStart) return [];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    return {
      date: d.toISOString().split('T')[0],
      hours: (dow === 0 || dow === 6) ? 0 : 8,
      description: '',
      project: 'General'
    };
  });
}
