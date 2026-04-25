import styles from './UI.module.css';
import { Loader2 } from 'lucide-react';

// --- Button ---
export const Button = ({ children, variant = 'primary', size = 'md', loading, icon: Icon, className = '', ...props }) => (
  <button
    className={`${styles.btn} ${styles[`btn_${variant}`]} ${styles[`btn_${size}`]} ${loading ? styles.btnLoading : ''} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? <Loader2 size={15} className={styles.spinner} /> : Icon ? <Icon size={15} /> : null}
    {children}
  </button>
);

// --- Card ---
export const Card = ({ children, className = '', padding = true, ...props }) => (
  <div className={`${styles.card} ${padding ? styles.cardPad : ''} ${className}`} {...props}>
    {children}
  </div>
);

// --- Input ---
export const Input = ({ label, error, icon: Icon, className = '', ...props }) => (
  <div className={styles.fieldWrap}>
    {label && <label className={styles.label}>{label}</label>}
    <div className={styles.inputWrap}>
      {Icon && <Icon size={16} className={styles.inputIcon} />}
      <input className={`${styles.input} ${Icon ? styles.inputWithIcon : ''} ${error ? styles.inputError : ''} ${className}`} {...props} />
    </div>
    {error && <span className={styles.errorMsg}>{error}</span>}
  </div>
);

// --- Select ---
export const Select = ({ label, error, children, className = '', ...props }) => (
  <div className={styles.fieldWrap}>
    {label && <label className={styles.label}>{label}</label>}
    <select className={`${styles.input} ${error ? styles.inputError : ''} ${className}`} {...props}>
      {children}
    </select>
    {error && <span className={styles.errorMsg}>{error}</span>}
  </div>
);

// --- Badge ---
export const Badge = ({ children, variant = 'default' }) => (
  <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{children}</span>
);

// --- Stat Card ---
export const StatCard = ({ label, value, icon: Icon, trend, color = 'accent', loading }) => (
  <Card className={styles.statCard}>
    <div className={styles.statTop}>
      <span className={styles.statLabel}>{label}</span>
      {Icon && (
        <div className={`${styles.statIcon} ${styles[`statIcon_${color}`]}`}>
          <Icon size={18} />
        </div>
      )}
    </div>
    {loading
      ? <div className={styles.statSkeleton} />
      : <div className={styles.statValue}>{value ?? '—'}</div>
    }
    {trend && <div className={styles.statTrend}>{trend}</div>}
  </Card>
);

// --- Table ---
export const Table = ({ columns, data, loading, emptyMsg = 'No data found.' }) => (
  <div className={styles.tableWrap}>
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} className={styles.th} style={{ width: col.width }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key} className={styles.td}>
                  <div className={styles.skeleton} />
                </td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr><td colSpan={columns.length} className={styles.tdEmpty}>{emptyMsg}</td></tr>
        ) : (
          data.map((row, i) => (
            <tr key={row._id || i} className={styles.tr}>
              {columns.map(col => (
                <td key={col.key} className={styles.td}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// --- Modal ---
export const Modal = ({ open, onClose, title, children, width = 480 }) => {
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
};

// --- Tabs ---
export const Tabs = ({ tabs, active, onChange }) => (
  <div className={styles.tabs}>
    {tabs.map(tab => (
      <button
        key={tab.value}
        className={`${styles.tab} ${active === tab.value ? styles.tabActive : ''}`}
        onClick={() => onChange(tab.value)}
      >
        {tab.label}
        {tab.count != null && (
          <span className={`${styles.tabCount} ${active === tab.value ? styles.tabCountActive : ''}`}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

// --- Pagination ---
export const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <div className={styles.pagination}>
      <button className={styles.pageBtn} onClick={() => onChange(page - 1)} disabled={page <= 1}>‹ Prev</button>
      <span className={styles.pageInfo}>Page {page} of {pages}</span>
      <button className={styles.pageBtn} onClick={() => onChange(page + 1)} disabled={page >= pages}>Next ›</button>
    </div>
  );
};
