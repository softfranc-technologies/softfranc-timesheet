import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Clock, FileText, Users, LogOut,
  Sun, Moon, Menu, X, User, ChevronRight, Activity
} from 'lucide-react';
import styles from './Layout.module.css';

const navItems = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin?tab=attendance', icon: Clock, label: 'Attendance' },
    { to: '/admin?tab=timesheets', icon: FileText, label: 'Timesheets' },
    { to: '/admin?tab=employees', icon: Users, label: 'Employees' },
  ],
  employee: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard?tab=attendance', icon: Clock, label: 'My Attendance' },
    { to: '/dashboard?tab=timesheets', icon: FileText, label: 'Timesheets' },
  ]
};

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = navItems[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (to) => {
    const path = to.split('?')[0];
    return location.pathname === path;
  };

  return (
    <div className={styles.root}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <Activity size={18} />
            </div>
            <div>
              <div className={styles.brandName}>SoftFranc</div>
              <div className={styles.brandSub}>Attendance System</div>
            </div>
          </div>

          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userRole}>{user?.role === 'admin' ? 'Administrator' : user?.position || 'Employee'}</div>
            </div>
          </div>

          <nav className={styles.nav}>
            {items.map(({ to, icon: Icon, label }) => (
              <Link
                key={label}
                to={to}
                className={`${styles.navItem} ${isActive(to) ? styles.navActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={17} />
                <span>{label}</span>
                {isActive(to) && <ChevronRight size={14} className={styles.navArrow} />}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <Link to="/profile" className={styles.navItem} onClick={() => setSidebarOpen(false)}>
            <User size={17} />
            <span>Profile</span>
          </Link>
          <button className={styles.navItem} onClick={toggleTheme}>
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={handleLogout}>
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className={styles.headerRight}>
            <button className={styles.iconBtn} onClick={toggleTheme}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/profile" className={styles.headerUser}>
              <div className={styles.headerAvatar}>{user?.name?.charAt(0).toUpperCase()}</div>
              <span>{user?.name}</span>
            </Link>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
