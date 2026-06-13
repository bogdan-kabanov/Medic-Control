import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Pill, CalendarClock, ClipboardList, User } from "lucide-react";
import styles from "./BottomNav.module.scss";

const navItems = [
  { to: "/", icon: <Home size={20} />, labelKey: "nav.home" },
  { to: "/medications", icon: <Pill size={20} />, labelKey: "nav.meds" },
  { to: "/appointments", icon: <CalendarClock size={20} />, labelKey: "nav.appts" },
  { to: "/history", icon: <ClipboardList size={20} />, labelKey: "nav.history" },
  { to: "/profile", icon: <User size={20} />, labelKey: "nav.profile" },
];

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
          end={item.to === "/"}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
