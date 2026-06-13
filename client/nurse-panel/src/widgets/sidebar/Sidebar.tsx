import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { Activity, LayoutDashboard, ClipboardList, Users, CalendarClock, Pill, Package, LogOut } from "lucide-react";
import { LangSwitcher } from "@/widgets/lang-switcher/LangSwitcher";
import { logout } from "@/shared/auth/authSlice";
import type { RootState } from "@/app/store";
import styles from "./Sidebar.module.scss";

const NAV_ITEMS = [
  { path: "/", labelKey: "nav.dashboard", icon: <LayoutDashboard size={20} /> },
  { path: "/daily-log", labelKey: "nav.dailyLog", icon: <ClipboardList size={20} /> },
  { path: "/students", labelKey: "nav.students", icon: <Users size={20} /> },
  { path: "/appointments", labelKey: "nav.appointments", icon: <CalendarClock size={20} /> },
  { path: "/med-reminders", labelKey: "nav.medReminders", icon: <Pill size={20} /> },
  { path: "/inventory", labelKey: "nav.inventory", icon: <Package size={20} /> },
] as const;

export function Sidebar() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}><Activity size={24} /></span>
        <span className={styles.logoText}>MedCare</span>
      </div>

      <nav className={styles.nav}>
        <p className={styles.section}>MAIN</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <LangSwitcher />

        {user && (
          <div className={styles.userBlock}>
            <div className={styles.userAvatar}>
              {user.firstName?.[0] || user.email[0]?.toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.firstName || user.email.split("@")[0]}</span>
              <span className={styles.userRole}>{user.role}</span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title={t("login.logout")}>
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
