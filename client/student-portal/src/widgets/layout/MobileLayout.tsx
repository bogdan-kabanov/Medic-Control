import { Outlet } from "react-router-dom";
import { BottomNav } from "@/widgets/bottom-nav/BottomNav";
import styles from "./MobileLayout.module.scss";

export function MobileLayout() {
  return (
    <div className={styles.layout}>
      <div className={styles.content}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
