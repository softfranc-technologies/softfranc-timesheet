import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from '../hooks/useToast';
import { Card, Button, Input } from '../components/UI';
import { User, Lock, Save } from 'lucide-react';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    department: user?.department || '',
    position: user?.position || ''
  });
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const { data } = await api.put('/users/profile', profile);
      updateUser({ name: data.user.name, department: data.user.department, position: data.user.position });
      toast.success('Profile updated!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update profile.');
    } finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async () => {
    const errs = {};
    if (!pw.current) errs.current = 'Required';
    if (!pw.newPw || pw.newPw.length < 6) errs.newPw = 'Min 6 characters';
    if (pw.newPw !== pw.confirm) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setPwLoading(true);
    try {
      await api.put('/users/change-password', { currentPassword: pw.current, newPassword: pw.newPw });
      toast.success('Password changed successfully!');
      setPw({ current: '', newPw: '', confirm: '' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to change password.');
    } finally { setPwLoading(false); }
  };

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Profile Settings</h1>
        <p className={styles.pageSub}>Manage your account information and security.</p>
      </div>

      <div className={styles.grid}>
        {/* Avatar card */}
        <Card className={styles.avatarCard}>
          <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div className={styles.avatarName}>{user?.name}</div>
          <div className={styles.avatarEmail}>{user?.email}</div>
          <div className={styles.avatarBadge}>{user?.role === 'admin' ? 'Administrator' : user?.position || 'Employee'}</div>
          {user?.department && <div className={styles.avatarDept}>{user.department}</div>}
        </Card>

        <div className={styles.forms}>
          {/* Profile info */}
          <Card>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconWrap}><User size={18} /></div>
              <div>
                <h2 className={styles.cardTitle}>Personal Information</h2>
                <p className={styles.cardSub}>Update your name and work details.</p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <Input
                label="Full Name"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
              />
              <Input
                label="Email"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6 }}
              />
              <Input
                label="Department"
                value={profile.department}
                onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
                placeholder="e.g. Engineering"
              />
              <Input
                label="Position / Job Title"
                value={profile.position}
                onChange={e => setProfile(p => ({ ...p, position: e.target.value }))}
                placeholder="e.g. Software Developer"
              />
            </div>

            <div className={styles.formActions}>
              <Button icon={Save} loading={profileLoading} onClick={handleProfileSave}>Save Changes</Button>
            </div>
          </Card>

          {/* Change password */}
          <Card>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIconWrap} ${styles.cardIconWarning}`}><Lock size={18} /></div>
              <div>
                <h2 className={styles.cardTitle}>Change Password</h2>
                <p className={styles.cardSub}>Use a strong password with at least 6 characters.</p>
              </div>
            </div>

            <div className={styles.formStack}>
              <Input
                label="Current Password"
                type="password"
                value={pw.current}
                onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
                error={pwErrors.current}
              />
              <Input
                label="New Password"
                type="password"
                value={pw.newPw}
                onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))}
                placeholder="••••••••"
                error={pwErrors.newPw}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={pw.confirm}
                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
                error={pwErrors.confirm}
              />
            </div>

            <div className={styles.formActions}>
              <Button variant="secondary" icon={Lock} loading={pwLoading} onClick={handlePasswordChange}>Update Password</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
