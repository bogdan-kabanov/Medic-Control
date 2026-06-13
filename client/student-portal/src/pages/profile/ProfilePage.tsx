import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { LogOut } from "lucide-react";
import { useGetMyProfileQuery } from "@/entities/profile/api/profileApi";
import { logout } from "@/shared/auth/authSlice";
import { LangSwitcher } from "@/widgets/lang-switcher/LangSwitcher";
import type { RootState } from "@/app/store";
import styles from "./ProfilePage.module.scss";

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: profile, isLoading } = useGetMyProfileQuery();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Use profile from API if available, otherwise fallback to auth user data
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user?.firstName || user?.email || "";

  const initials = displayName
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{t("profile.title")}</h1>
        <LangSwitcher />
      </div>

      <div className={styles.card}>
        <div className={styles.avatar}>{initials || "?"}</div>
        <div className={styles.name}>{displayName}</div>
        {user?.email && <div className={styles.email}>{user.email}</div>}

        {isLoading && <div className={styles.loading}>{t("common.loading")}</div>}

        {profile && (
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t("profile.grade")}</span>
              <span className={styles.infoValue}>{profile.grade}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t("profile.age")}</span>
              <span className={styles.infoValue}>{profile.age} {t("profile.yearsOld")}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t("profile.conditions")}</span>
              {profile.diseases && profile.diseases.length > 0 ? (
                <div className={styles.tags}>
                  {profile.diseases.map((d) => (
                    <span key={d} className={styles.tagDisease}>{d}</span>
                  ))}
                </div>
              ) : (
                <span className={styles.none}>{t("profile.noneRecorded")}</span>
              )}
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t("profile.medications")}</span>
              {profile.medications && profile.medications.length > 0 ? (
                <div className={styles.tags}>
                  {profile.medications.map((m, i) => (
                    <span key={i} className={styles.tagMed}>
                      {typeof m === "string" ? m : `${m.name} ${m.dosage}`}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={styles.none}>{t("profile.noneRecorded")}</span>
              )}
            </div>
            {profile.counselor && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t("profile.counselor")}</span>
                <div className={styles.counselorCard}>
                  <div className={styles.counselorName}>{profile.counselor.name}</div>
                  <div className={styles.counselorPhone}>{profile.counselor.phone}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {!profile && !isLoading && (
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t("profile.role")}</span>
              <span className={styles.infoValue}>{user?.role}</span>
            </div>
          </div>
        )}
      </div>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={18} />
        {t("profile.logout")}
      </button>
    </div>
  );
}
