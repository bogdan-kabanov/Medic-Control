import { Outlet } from "react-router-dom";
import { Sidebar } from "../sidebar/Sidebar";
import styles from "./Layout.module.scss";

export function Layout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
