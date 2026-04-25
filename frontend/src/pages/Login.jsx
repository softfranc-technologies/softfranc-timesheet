import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from '../hooks/useToast';
import { Mail, Lock, Activity, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, loading } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      toast.error(msg);
      setErrors({ general: msg });
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <div className={styles.leftBrand}>
            <div className={styles.leftIcon}><Activity size={28} /></div>
            <span>SoftFranc</span>
          </div>
          <h2 className={styles.leftHeading}>Track time.<br />Work smarter.</h2>
          <p className={styles.leftSub}>Complete attendance and timesheet management for modern teams.</p>
          <div className={styles.features}>
            {['Real-time punch in/out', 'Weekly timesheet management', 'Admin approval workflows', 'Attendance analytics'].map(f => (
              <div key={f} className={styles.feature}>
                <span className={styles.featureDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <button className={styles.themeToggle} onClick={toggleTheme}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Activity size={20} /></div>
            <div>
              <h1 className={styles.cardTitle}>Sign in</h1>
              <p className={styles.cardSub}>to your SoftFranc account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {errors.general && (
              <div className={styles.alertError}>{errors.general}</div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Email address</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.icon} />
                <input
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                  placeholder="you@softfranc.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className={styles.err}>{errors.email}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.icon} />
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputPw} ${errors.password ? styles.inputErr : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <span className={styles.err}>{errors.password}</span>}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className={styles.hint}>
            Demo: <code>admin@softfranc.com</code> / <code>admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
