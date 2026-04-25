import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from '../hooks/useToast';
import { StatCard, Card, Badge, Table, Button, Tabs, Pagination, Modal, Input } from '../components/UI';
import { Users, Clock, FileText, TrendingUp, Check, X, UserPlus, Search, RefreshCw } from 'lucide-react';
import styles from './Dashboard.module.css';

const fmtTime = d => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const statusBadge = s => {
  const map = { active: 'warning', completed: 'success', draft: 'default', submitted: 'accent', approved: 'success', rejected: 'danger' };
  return <Badge variant={map[s] || 'default'}>{s}</Badge>;
};

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [dashStats, setDashStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attPage, setAttPage] = useState(1);
  const [attPages, setAttPages] = useState(1);
  const [timesheets, setTimesheets] = useState([]);
  const [tsPendingCount, setTsPendingCount] = useState(0);
  const [tsPage, setTsPage] = useState(1);
  const [tsPages, setTsPages] = useState(1);
  const [tsFilter, setTsFilter] = useState('submitted');
  const [employees, setEmployees] = useState([]);
  const [empPage, setEmpPage] = useState(1);
  const [empPages, setEmpPages] = useState(1);
  const [empSearch, setEmpSearch] = useState('');
  const [loading, setLoading] = useState({});
  const [addModal, setAddModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [newEmp, setNewEmp] = useState({ name: '', email: '', password: '', department: '', position: '' });
  const [addLoading, setAddLoading] = useState(false);

  const setLoad = (k, v) => setLoading(p => ({ ...p, [k]: v }));

  const fetchDash = useCallback(async () => {
    setLoad('dash', true);
    try { const { data } = await api.get('/admin/dashboard'); setDashStats(data); }
    catch {} finally { setLoad('dash', false); }
  }, []);

  const fetchAttendance = useCallback(async (page = 1) => {
    setLoad('att', true);
    try {
      const { data } = await api.get(`/admin/attendance/all?page=${page}&limit=20`);
      setAttendance(data.logs); setAttPages(data.pages);
    } catch {} finally { setLoad('att', false); }
  }, []);

  const fetchTimesheets = useCallback(async (page = 1, status = tsFilter) => {
    setLoad('ts', true);
    try {
      const { data } = await api.get(`/admin/timesheets?status=${status}&page=${page}&limit=15`);
      setTimesheets(data.timesheets); setTsPages(data.pages);
      if (status === 'submitted') setTsPendingCount(data.total);
    } catch {} finally { setLoad('ts', false); }
  }, [tsFilter]);

  const fetchEmployees = useCallback(async (page = 1, search = empSearch) => {
    setLoad('emp', true);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get(`/admin/users?page=${page}&limit=15${q}`);
      setEmployees(data.users); setEmpPages(data.pages);
    } catch {} finally { setLoad('emp', false); }
  }, [empSearch]);

  useEffect(() => { fetchDash(); }, []);
  useEffect(() => { if (activeTab === 'attendance') fetchAttendance(attPage); }, [activeTab, attPage]);
  useEffect(() => { if (activeTab === 'timesheets') fetchTimesheets(tsPage, tsFilter); }, [activeTab, tsPage, tsFilter]);
  useEffect(() => { if (activeTab === 'employees') fetchEmployees(empPage, empSearch); }, [activeTab, empPage]);
  // Fetch pending count on load
  useEffect(() => { api.get('/admin/timesheets?status=submitted&limit=1').then(r => setTsPendingCount(r.data.total)).catch(() => {}); }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/timesheets/${id}/approve`);
      toast.success('Timesheet approved!');
      fetchTimesheets(tsPage, tsFilter); fetchDash();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed.'); }
  };

  const handleReject = async () => {
    try {
      await api.put(`/admin/timesheets/${rejectModal}/reject`, { reason: rejectReason });
      toast.success('Timesheet rejected.');
      setRejectModal(null); setRejectReason('');
      fetchTimesheets(tsPage, tsFilter); fetchDash();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed.'); }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-active`);
      toast.success(`Employee ${isActive ? 'deactivated' : 'activated'}.`);
      fetchEmployees(empPage, empSearch);
    } catch (e) { toast.error('Failed.'); }
  };

  const handleAddEmployee = async () => {
    if (!newEmp.name || !newEmp.email || !newEmp.password) { toast.error('Name, email, password required.'); return; }
    setAddLoading(true);
    try {
      await api.post('/admin/users', newEmp);
      toast.success('Employee added!');
      setAddModal(false);
      setNewEmp({ name: '', email: '', password: '', department: '', position: '' });
      fetchEmployees(empPage, empSearch); fetchDash();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to add employee.'); }
    finally { setAddLoading(false); }
  };

  const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Attendance', value: 'attendance' },
    { label: 'Timesheets', value: 'timesheets', count: tsPendingCount },
    { label: 'Employees', value: 'employees' },
  ];

  const attColumns = [
    { key: 'userId', label: 'Employee', render: v => v?.name || '—' },
    { key: 'date', label: 'Date', render: v => fmtDate(v) },
    { key: 'punchIn', label: 'In', render: v => fmtTime(v) },
    { key: 'punchOut', label: 'Out', render: v => fmtTime(v) },
    { key: 'hoursWorked', label: 'Hours', render: v => v ? `${v}h` : '—' },
    { key: 'status', label: 'Status', render: v => statusBadge(v) },
  ];

  const tsColumns = [
    { key: 'userId', label: 'Employee', render: v => <div><div style={{ fontWeight: 600, color: 'var(--text)' }}>{v?.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v?.department}</div></div> },
    { key: 'weekStart', label: 'Week', render: (v, row) => `${fmtDate(v)} – ${fmtDate(row.weekEnd)}` },
    { key: 'totalHours', label: 'Hours', render: v => `${v}h` },
    { key: 'status', label: 'Status', render: v => statusBadge(v) },
    { key: 'submittedAt', label: 'Submitted', render: v => fmtDate(v) },
    { key: '_id', label: 'Actions', render: (id, row) => row.status === 'submitted' ? (
      <div style={{ display: 'flex', gap: 6 }}>
        <Button size="sm" variant="success" icon={Check} onClick={() => handleApprove(id)}>Approve</Button>
        <Button size="sm" variant="danger" icon={X} onClick={() => setRejectModal(id)}>Reject</Button>
      </div>
    ) : null },
  ];

  const empColumns = [
    { key: 'name', label: 'Name', render: (v, row) => <div><div style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div></div> },
    { key: 'department', label: 'Dept' },
    { key: 'position', label: 'Position' },
    { key: 'lastLogin', label: 'Last Login', render: v => fmtDate(v) },
    { key: 'isActive', label: 'Status', render: v => <Badge variant={v ? 'success' : 'danger'}>{v ? 'Active' : 'Inactive'}</Badge> },
    { key: '_id', label: 'Action', render: (id, row) => (
      <Button size="sm" variant={row.isActive ? 'danger' : 'success'} onClick={() => handleToggleActive(id, row.isActive)}>
        {row.isActive ? 'Deactivate' : 'Activate'}
      </Button>
    )},
  ];

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSub}>Manage your team's attendance, timesheets, and more.</p>
        </div>
        <Tabs tabs={tabs} active={activeTab} onChange={v => setSearchParams({ tab: v })} />
      </div>

      {activeTab === 'overview' && (
        <div className={styles.fade}>
          <div className={styles.statsGrid}>
            <StatCard label="Total Employees" value={dashStats?.totalEmployees} icon={Users} color="accent" loading={loading.dash} />
            <StatCard label="Today's Attendance" value={dashStats?.todayAttendance} icon={Clock} color="success" loading={loading.dash} trend="Employees checked in today" />
            <StatCard label="Pending Timesheets" value={dashStats?.pendingTimesheets} icon={FileText} color="warning" loading={loading.dash} />
            <StatCard label="Monthly Hours" value={dashStats?.monthlyHours ? `${dashStats.monthlyHours}h` : null} icon={TrendingUp} color="accent" loading={loading.dash} />
          </div>

          {/* Recent attendance */}
          <Card padding={false}>
            <div className={styles.tableHeader}>
              <h3>Today's Attendance</h3>
            </div>
            <RecentAttendance />
          </Card>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className={styles.fade}>
          <Card padding={false}>
            <div className={styles.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>All Attendance Logs</h3>
              <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => fetchAttendance(attPage)}>Refresh</Button>
            </div>
            <Table columns={attColumns} data={attendance} loading={loading.att} />
            <div style={{ padding: '16px 24px' }}>
              <Pagination page={attPage} pages={attPages} onChange={p => { setAttPage(p); fetchAttendance(p); }} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'timesheets' && (
        <div className={styles.fade}>
          <Card padding={false}>
            <div className={styles.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h3>Timesheet Management</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {['submitted', 'approved', 'rejected', 'draft'].map(s => (
                  <Button key={s} size="sm" variant={tsFilter === s ? 'primary' : 'ghost'} onClick={() => { setTsFilter(s); setTsPage(1); fetchTimesheets(1, s); }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <Table columns={tsColumns} data={timesheets} loading={loading.ts} emptyMsg={`No ${tsFilter} timesheets.`} />
            <div style={{ padding: '16px 24px' }}>
              <Pagination page={tsPage} pages={tsPages} onChange={p => { setTsPage(p); fetchTimesheets(p, tsFilter); }} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className={styles.fade}>
          <Card padding={false}>
            <div className={styles.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h3>Employees</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', width: 200 }}
                    placeholder="Search name or email…"
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchEmployees(1, empSearch)}
                  />
                </div>
                <Button size="sm" icon={UserPlus} onClick={() => setAddModal(true)}>Add Employee</Button>
              </div>
            </div>
            <Table columns={empColumns} data={employees} loading={loading.emp} emptyMsg="No employees found." />
            <div style={{ padding: '16px 24px' }}>
              <Pagination page={empPage} pages={empPages} onChange={p => { setEmpPage(p); fetchEmployees(p, empSearch); }} />
            </div>
          </Card>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Employee">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Full Name *" value={newEmp.name} onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))} placeholder="Alice Johnson" />
          <Input label="Email *" type="email" value={newEmp.email} onChange={e => setNewEmp(p => ({ ...p, email: e.target.value }))} placeholder="alice@softfranc.com" />
          <Input label="Password *" type="password" value={newEmp.password} onChange={e => setNewEmp(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
          <Input label="Department" value={newEmp.department} onChange={e => setNewEmp(p => ({ ...p, department: e.target.value }))} placeholder="Engineering" />
          <Input label="Position" value={newEmp.position} onChange={e => setNewEmp(p => ({ ...p, position: e.target.value }))} placeholder="Software Developer" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button loading={addLoading} onClick={handleAddEmployee}>Create Employee</Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Timesheet" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Reason (optional)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain reason for rejection…" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject Timesheet</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RecentAttendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.get(`/admin/attendance/all?date=${today}&limit=10`)
      .then(r => setLogs(r.data.logs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cols = [
    { key: 'userId', label: 'Employee', render: v => v?.name || '—' },
    { key: 'punchIn', label: 'Punched In', render: v => fmtTime(v) },
    { key: 'punchOut', label: 'Punched Out', render: v => fmtTime(v) },
    { key: 'hoursWorked', label: 'Hours', render: v => v ? `${v}h` : '—' },
    { key: 'status', label: 'Status', render: v => statusBadge(v) },
  ];

  return <Table columns={cols} data={logs} loading={loading} emptyMsg="No attendance recorded today." />;
}
