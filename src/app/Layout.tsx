import { NavLink, Outlet } from 'react-router';
import { Clapperboard, Image } from 'lucide-react';
import styles from './Layout.module.css';

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab);

export function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden>
            🦖
          </span>
          <span className={styles.name}>Rocksaurus</span>
          <span className={styles.badge}>Studio</span>
        </div>
        <nav className={styles.tabs} aria-label="Main">
          <NavLink to="/" end className={navClass}>
            <Clapperboard size={16} aria-hidden /> Studio
          </NavLink>
          <NavLink to="/brand" className={navClass}>
            <Image size={16} aria-hidden /> Channel art
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
