import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useLoginMutation } from "@/shared/auth/authApi";
import { setCredentials } from "@/shared/auth/authSlice";
import styles from "./LoginPage.module.scss";

function parseJwt(token: string) {
  const base64Url = token.split(".")[1]!;
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await login({ email, password }).unwrap();
      const payload = parseJwt(result.accessToken);

      if (payload.role !== "student") {
        setError(t("login.notStudent"));
        return;
      }

      dispatch(setCredentials({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          studentId: payload.studentId,
          firstName: payload.firstName || email.split("@")[0] || "",
          lastName: "",
        },
      }));

      navigate("/");
    } catch (err: any) {
      setError(err?.data?.message || t("login.invalidCredentials"));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚕</span>
          <span className={styles.logoText}>MedCare</span>
        </div>
        <h1 className={styles.title}>{t("login.title")}</h1>
        <p className={styles.subtitle}>{t("login.subtitle")}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>{t("login.email")}</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@student.medcare.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t("login.password")}</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submitBtn} type="submit" disabled={isLoading}>
            {isLoading ? t("login.loggingIn") : t("login.signIn")}
          </button>
        </form>

        <div className={styles.hint}>
          <p>{t("login.demoAccounts")}:</p>
          <code>maya@student.medcare.com / 123456</code>
          <code>yoav@student.medcare.com / 123456</code>
        </div>
      </div>
    </div>
  );
}
