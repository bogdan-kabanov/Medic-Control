import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetInventoryQuery,
  useAddInventoryItemMutation,
  useUpdateInventoryItemMutation,
} from "@/entities/inventory/api/inventoryApi";
import type { InventoryItem, AddInventoryBody, UpdateInventoryBody } from "@/entities/inventory/api/inventoryApi";
import styles from "./InventoryPage.module.scss";

const UNITS = ["Tablets", "Puffs", "ML", "Pieces"] as const;

function getStatus(item: InventoryItem): "low" | "warning" | "ok" {
  if (item.currentStock <= item.minThreshold) return "low";
  if (item.currentStock < item.minThreshold * 2) return "warning";
  return "ok";
}

export function InventoryPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const { data: items = [], isLoading, error } = useGetInventoryQuery({ search });
  const [addItem, { isLoading: adding }] = useAddInventoryItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateInventoryItemMutation();

  const getStatusBadge = (item: InventoryItem) => {
    const status = getStatus(item);
    switch (status) {
      case "low":
        return <span className={`${styles.badge} ${styles.badgeRed}`}>{t("inventory.lowStock")}</span>;
      case "warning":
        return <span className={`${styles.badge} ${styles.badgeOrange}`}>{t("inventory.warning")}</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgeGreen}`}>{t("inventory.inStock")}</span>;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("inventory.title")}</h1>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          {t("inventory.addItem")}
        </button>
      </div>

      <div className={styles.searchWrapper}>
        <input
          className={styles.searchInput}
          placeholder={t("inventory.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <div className={styles.loading}>{t("common.loading")}</div>}
      {error && <div className={styles.error}>{t("common.error")}</div>}

      {!isLoading && !error && items.length === 0 && (
        <div className={styles.empty}>{t("inventory.searchPlaceholder")}</div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("inventory.name")}</th>
              <th>{t("inventory.unit")}</th>
              <th>{t("inventory.currentStock")}</th>
              <th>{t("inventory.minThreshold")}</th>
              <th>{t("inventory.status")}</th>
              <th>{t("inventory.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{t(`inventory.units.${item.unit}`)}</td>
                <td>{item.currentStock}</td>
                <td>{item.minThreshold}</td>
                <td>{getStatusBadge(item)}</td>
                <td>
                  <button className={styles.editBtn} onClick={() => setEditItem(item)}>
                    {t("inventory.edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAddModal && (
        <AddModal
          adding={adding}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            await addItem(data).unwrap();
            setShowAddModal(false);
          }}
        />
      )}

      {editItem && (
        <EditModal
          item={editItem}
          updating={updating}
          onClose={() => setEditItem(null)}
          onSubmit={async (body) => {
            await updateItem({ id: editItem.id, body }).unwrap();
            setEditItem(null);
          }}
        />
      )}
    </div>
  );
}

function AddModal({
  onClose,
  onSubmit,
  adding,
}: {
  onClose: () => void;
  onSubmit: (data: AddInventoryBody) => Promise<void>;
  adding: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    unit: "Tablets" as string,
    quantity: "",
    minThreshold: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: form.name,
      unit: form.unit,
      quantity: Number(form.quantity),
      minThreshold: Number(form.minThreshold),
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{t("inventory.modalAddTitle")}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>{t("inventory.name")}</label>
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("inventory.unit")}</label>
            <select
              className={styles.input}
              value={form.unit}
              onChange={(e) => handleChange("unit", e.target.value)}
              required
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`inventory.units.${u}`)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("inventory.quantity")}</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("inventory.minThreshold")}</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              value={form.minThreshold}
              onChange={(e) => handleChange("minThreshold", e.target.value)}
              required
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={adding}>
              {adding ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({
  item,
  onClose,
  onSubmit,
  updating,
}: {
  item: InventoryItem;
  onClose: () => void;
  onSubmit: (body: UpdateInventoryBody) => Promise<void>;
  updating: boolean;
}) {
  const { t } = useTranslation();
  const [currentStock, setCurrentStock] = useState(String(item.currentStock));
  const [minThreshold, setMinThreshold] = useState(String(item.minThreshold));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      currentStock: Number(currentStock),
      minThreshold: Number(minThreshold),
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{t("inventory.modalEditTitle")}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>{t("inventory.name")}</label>
            <input className={styles.input} value={item.name} disabled />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("inventory.currentStock")}</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("inventory.minThreshold")}</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              required
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={updating}>
              {updating ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
