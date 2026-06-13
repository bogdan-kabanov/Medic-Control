# MedCare — Система управления школьным медицинским кабинетом

**Версия:** 3.0  
**Дата:** 12.06.2026  
**Статус:** проектная документация (design doc), готовая к реализации.

---

## 0. Краткое описание

MedCare — веб-приложение для школьного медицинского кабинета. Состоит из **двух клиентских приложений**:

1. **Nurse Panel** (панель медсестры) — десктоп-first (с адаптивом на планшет). Ведёт базу учеников, фиксирует визиты, направляет к врачам, управляет напоминаниями и инвентарём.
2. **Student Portal** (личный кабинет ученика) — mobile-first PWA. Ученик видит свои напоминания о лекарствах, направления к врачам, историю визитов и отмечает приём препаратов.

Оба клиента работают на одном бэкенде (микросервисы), различаясь уровнем доступа (RBAC).

---

## 0.1. Роли пользователей

| Роль | Описание | Приложение | Доступ |
|------|----------|-----------|--------|
| **Nurse** | Медсестра. Основной пользователь. | Nurse Panel | Полный доступ ко всем данным и экранам. |
| **Admin** | Администратор. Управляет пользователями и настройками. | Nurse Panel | Всё что Nurse + управление пользователями, справочниками. |
| **Student** | Ученик. Взаимодействует только со своими данными. | Student Portal (PWA) | Только свои: напоминания, направления, история визитов. |

---

## 0.2. Экраны интерфейса

### Nurse Panel (десктоп + планшет)

| # | Экран | Описание |
|---|-------|----------|
| 1 | Dashboard | Сводка дня: кол-во учеников, напоминаний, визитов, алерты, лента событий. |
| 2 | Daily log | Журнал визитов за день + форма «Record visit». |
| 3 | Students | База учеников (CRUD), поиск, фильтры. |
| 4 | Appointments | Направления к врачам (карточки), статусы, приоритеты. |
| 5 | Med reminders | Таблица напоминаний о приёме лекарств. |
| 6 | Reports | Отчёты и аналитика. |
| 7 | Inventory | Инвентарь медкабинета (препараты, расходники). |

### Student Portal (mobile-first PWA)

| # | Экран | Описание |
|---|-------|----------|
| 1 | Home | Приветствие, ближайшие напоминания и направления. |
| 2 | My medications | Список назначенных лекарств + кнопка «Я принял». |
| 3 | My appointments | Мои направления к врачам со статусами. |
| 4 | Visit history | История посещений медкабинета. |
| 5 | Profile | Просмотр своих данных (без редактирования). |
| 6 | Notifications | Лента уведомлений (напоминания, смены статусов). |

---

## 1. Технологический стек

### Backend (микросервисы)

| Технология | Назначение |
|-----------|-----------|
| Node.js 22 LTS + TypeScript 5.x (strict) | Платформа и язык |
| Zod | Schema-first валидация, единый источник типов |
| Fastify 5 | HTTP-фреймворк (типобезопасный, быстрый) |
| Prisma ORM | Типобезопасный доступ к БД |
| PostgreSQL 16 | Основная реляционная БД (database-per-service) |
| Redis 7 | Кэш, планировщик напоминаний, blacklist JWT, push-подписки |
| RabbitMQ | Шина событий между сервисами (AMQP) |

### Frontend — Nurse Panel

| Технология | Назначение |
|-----------|-----------|
| React 18 + TypeScript (strict) | UI-библиотека |
| FSD (Feature-Sliced Design) | Архитектура слоёв |
| SCSS Modules | Стили (*.module.scss) |
| Redux Toolkit + RTK Query | Серверное состояние + UI состояние |

### Frontend — Student Portal (PWA)

| Технология | Назначение |
|-----------|-----------|
| React 18 + TypeScript (strict) | UI-библиотека |
| FSD (Feature-Sliced Design) | Архитектура слоёв |
| SCSS Modules | Стили (mobile-first) |
| Redux Toolkit + RTK Query | Серверное состояние + UI состояние |
| Workbox (vite-plugin-pwa) | Service Worker, offline-режим, push-уведомления |

> **Одно стейт-решение:** только Redux Toolkit. RTK Query — серверные данные; обычные slices — UI-состояние форм. MobX убран — два менеджера создают неопределённость ответственности.

### Инфраструктура

| Технология | Назначение |
|-----------|-----------|
| Docker + docker-compose | Локальная разработка |
| Kong | API Gateway (JWT verify, routing, rate-limit, CORS) |
| OpenTelemetry + Pino | Трассировка + структурные логи |
| Vitest + supertest + Playwright | Unit / API / e2e тесты |
| Web Push API | Push-уведомления для Student Portal |

---

## 2. Принцип «строгая типизация везде»

### 2.1. tsconfig (обязательные опции для back и оба front)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

ESLint: `@typescript-eslint/no-explicit-any: "error"`.

### 2.2. Schema-first

Каждая DTO описывается Zod-схемой **один раз**, тип выводится через `z.infer`. Ручных `interface` для DTO нет.

```typescript
export const StudentSchema = z.object({ /* ... */ });
export type Student = z.infer<typeof StudentSchema>;
```

### 2.3. Единый пакет контрактов `@medcare/contracts`

Монорепо npm-пакет, общий для всех сервисов И обоих клиентов:
- Zod-схемы (request / response / events)
- Выведенные типы
- Enums
- Branded ID типы
- Response wrappers (пагинация, ошибки)

### 2.4. Валидация на всех границах

Все входящие данные проходят Zod-валидацию ДО бизнес-логики:
- HTTP body, query, params
- Ответы внешних сервисов
- Сообщения из очереди (RabbitMQ)
- Переменные окружения (при старте)
- Ответы API на клиенте (`transformResponse`)

### 2.5. Branded ID

```typescript
export const StudentId = z.string().uuid().brand<"StudentId">();
export const VisitId = z.string().uuid().brand<"VisitId">();
export const AppointmentId = z.string().uuid().brand<"AppointmentId">();
export const ReminderId = z.string().uuid().brand<"ReminderId">();
export const UserId = z.string().uuid().brand<"UserId">();
export const InventoryItemId = z.string().uuid().brand<"InventoryItemId">();
```

### 2.6. Все перечисления — `z.enum`

Никаких свободных строк. Полный перечень в разделе 6.

### 2.7. Result-тип для бизнес-операций

```typescript
type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E };
```

---

## 3. Микросервисная архитектура

### 3.1. Принцип разделения

Каждый сервис:
- Владеет **отдельной PostgreSQL-базой** (database-per-service).
- Имеет собственные Prisma-миграции.
- Общается с другими только через REST (синхронно) или RabbitMQ (асинхронно).
- Не имеет прямого доступа к чужим данным.

### 3.2. Схема взаимодействия

```
┌────────────────────────┐       ┌──────────────────────────┐
│   Nurse Panel (React)  │       │  Student Portal (PWA)    │
│   Desktop + Tablet     │       │  Mobile-first            │
└───────────┬────────────┘       └────────────┬─────────────┘
            │                                 │
            └──────────┬──────────────────────┘
                       │ HTTPS (REST/JSON + WebSocket)
            ┌──────────▼──────────┐
            │   Kong API Gateway  │
            │  (JWT, RBAC, CORS,  │
            │   rate-limit)       │
            └──┬───┬───┬───┬───┬──┘
  ┌────────────┘   │   │   │   └────────────┐
  ▼                ▼   ▼   ▼                ▼
┌─────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────────────┐
│Auth svc │ │Students  │ │Visits svc   │ │Appointments svc  │
│         │ │svc       │ │             │ │                  │
└─────────┘ └──────────┘ └──────┬──────┘ └────────┬─────────┘
                                │                  │
┌──────────────────┐            │ event            │ event
│Medications svc   │            │                  │
│(reminders +      │◄───────────┼──────────────────┘
│ inventory)       │            │
└────────┬─────────┘            │
         │ event                │
         ▼                      ▼
┌────────────────────────────────────┐
│  Notifications svc                 │  (in-app WS + push)
└────────────────────────────────────┘
┌────────────────────────────────────┐
│  Reports svc                       │  (агрегации, dashboard)
└────────────────────────────────────┘
```

### 3.3. Перечень сервисов

#### auth-service (`medcare_auth`)
- Регистрация / логин (email + password).
- JWT: access token (15 мин) + refresh token (7 дней).
- RBAC: роли `nurse`, `admin`, `student`.
- Blacklist токенов при logout — Redis SET с TTL.
- Kong валидирует JWT через `GET /auth/verify` (кэш Redis 30 сек).
- Регистрация учеников: медсестра создаёт аккаунт ученика → ученик получает ссылку/код активации.

#### students-service (`medcare_students`)
- CRUD учеников: ФИО, класс, возраст, заболевания, препараты, куратор.
- Поиск/фильтрация по имени, классу, заболеванию.
- Справочники (diseases, medications).
- Связь student ↔ userId (для авторизации ученика в Student Portal).

#### visits-service (`medcare_visits`)
- Журнал ежедневных визитов.
- Создание визита — привязка по `studentId`.
- При `scheduleDoctorAppointment: true` → событие `visit.referral.created`.

#### appointments-service (`medcare_appointments`)
- Направления к врачам: тип врача, причина, дата, приоритет, статус.
- Слушает `visit.referral.created` → создаёт appointment (`priority: Medium` по умолчанию).
- Публикует `appointment.status.changed`.

#### medications-service (`medcare_medications`)
- Напоминания о приёме лекарств (расписание).
- Инвентарь медкабинета (остатки, приход/расход).
- Планировщик (Redis sorted-set) для проверки пропущенных приёмов.
- Эндпоинт для ученика: `PATCH /reminders/:id/confirm` — отметка «я принял».

#### notifications-service (`medcare_notifications`)
- Слушает события всех сервисов.
- Доставляет уведомления:
  - **In-app** — WebSocket (для Nurse Panel и Student Portal).
  - **Push** — Web Push API (для Student Portal, когда вкладка закрыта).
- Хранит подписки push-уведомлений (endpoint, keys).
- Хранит историю уведомлений для экрана «Notifications» в Student Portal.

#### reports-service (`medcare_reports`)
- Агрегация данных для Dashboard и Reports.
- Слушает события → строит materialized views.
- Отвечает на `GET /dashboard/summary`, `GET /reports`.

### 3.4. Межсервисное взаимодействие

| Тип | Механизм | Когда |
|-----|----------|-------|
| Синхронный | REST через Kong | Клиент → сервис; редко сервис → сервис (lookup) |
| Асинхронный | RabbitMQ (topic exchange) | Создание/смена статуса; уведомления |
| Реалтайм | WebSocket (через notifications-service) | Push уведомлений на клиент |

---

## 4. Выбор базы данных

### Основная: PostgreSQL 16

| Критерий | Почему PostgreSQL |
|----------|-------------------|
| Реляционность | Ученик ↔ визиты ↔ направления ↔ лекарства — FK |
| ACID | Медицинские записи — транзакционная целостность |
| Аналитика | GROUP BY, оконные функции для Reports |
| Типы | ENUM, JSONB, массивы |
| Prisma | Зрелая интеграция, авто-типы |

### Redis 7

| Применение | Механизм |
|-----------|----------|
| Кэш JWT-верификации | SET с TTL |
| Blacklist токенов | SET с TTL |
| Планировщик напоминаний | Sorted Set (score = timestamp) |
| Push-подписки (быстрый lookup) | HASH |
| Кэш dashboard | STRING с TTL |

### Database-per-service

| Сервис | База данных |
|--------|------------|
| auth-service | `medcare_auth` |
| students-service | `medcare_students` |
| visits-service | `medcare_visits` |
| appointments-service | `medcare_appointments` |
| medications-service | `medcare_medications` |
| notifications-service | `medcare_notifications` |
| reports-service | `medcare_reports` |

Миграции: каждый сервис — свои Prisma-миграции. В CI/CD `prisma migrate deploy` в init-контейнере перед стартом.

---

## 5. Модель данных и бизнес-логика

### 5.1. Students

**Поля:**

| Поле | Тип | Описание |
|------|-----|----------|
| id | StudentId | UUID, branded |
| userId | UserId / null | Связь с аккаунтом (для Student Portal) |
| firstName | string | Имя |
| lastName | string | Фамилия |
| grade | string | Класс ("Grade 11B") |
| age | number (int, 5–21) | Возраст |
| diseases | Disease[] | Заболевания (enum) |
| medications | MedicationRef[] | Назначенные препараты [{name, dosage}] |
| counselor | { name, phone } | Куратор |
| createdAt | ISO datetime | Дата добавления |
| updatedAt | ISO datetime | Последнее изменение |

**Экран Nurse Panel (Students):**
- Таблица: Name | Grade | Age | Diseases | Medications | Counselor | Actions
- Поиск по имени, классу, заболеванию; фильтр по классу.
- Действия: просмотр, редактирование, удаление.
- Кнопка «+ Add student».

**Экран Student Portal (Profile):**
- Ученик видит свои данные: имя, класс, заболевания, препараты, куратор.
- Редактирование запрещено (только просмотр).

### 5.2. Daily Log (визиты)

**Форма «Record visit» (Nurse Panel):**

| Поле | Тип | Описание |
|------|-----|----------|
| studentId | StudentId / null | Привязка к ученику (autocomplete) |
| firstName | string | Имя |
| lastName | string | Фамилия |
| grade | string | Класс |
| arrivalTime | string (HH:mm) | Время прихода |
| complaint | string | Жалоба |
| complaintType | VisitComplaintType | Тип жалобы (enum) |
| treatmentGiven | string | Лечение |
| scheduleDoctorAppointment | boolean | Направить к врачу |

**Логика:**
- Autocomplete по имени → заполнение studentId.
- Если ученик не найден → studentId = null, сохраняется текстом.
- При `scheduleDoctorAppointment: true` → событие `visit.referral.created` → авто-создание appointment с `priority: Medium`.

**Экран Student Portal (Visit history):**
- Список визитов ученика: дата, жалоба, лечение, было ли направление.
- Только просмотр.

### 5.3. Appointments (направления)

**Поля:**

| Поле | Тип | Описание |
|------|-----|----------|
| id | AppointmentId | UUID, branded |
| studentId | StudentId | Ученик |
| studentName | string | Для отображения (денормализация) |
| doctorType | DoctorType | Тип врача |
| reason | string | Причина |
| dateTime | ISO datetime | Дата/время приёма |
| priority | Priority | Emergency / High / Medium / Low |
| status | AppointmentStatus | Pending / Approved / Completed / Cancelled |
| createdAt | ISO datetime | Создано |

**Экран Nurse Panel (Appointments):**
- Карточки с бейджами приоритета/статуса.
- Действия: Approve, Cancel, Done.
- Вкладки: All | Pending | Approved | Completed.
- Кнопка «+ New appointment».

**Экран Student Portal (My appointments):**
- Список СВОИХ направлений (только текущие и прошлые).
- Ученик видит: тип врача, дату, статус. НЕ может менять статус.
- При смене статуса → push-уведомление.

**Откуда priority при авто-создании:**
- По умолчанию: `Medium`.
- Система предлагает повысить, если complaintType ∈ {Fever, Injury} → `High`. Медсестра подтверждает.
- `Emergency` — устанавливается только вручную.

### 5.4. Med Reminders (напоминания)

**Поля:**

| Поле | Тип | Описание |
|------|-----|----------|
| id | ReminderId | UUID, branded |
| studentId | StudentId | Ученик |
| studentName | string | Для отображения |
| medication | string | Препарат |
| dosage | string | Дозировка |
| dateTime | ISO datetime | Плановое время приёма |
| notes | string | Заметка ("Morning dose") |
| status | ReminderStatus | Pending / Done / Missed / EarlyIntake |
| confirmedAt | ISO datetime / null | Когда отметили |
| confirmedBy | "nurse" / "student" / null | Кто отметил |

**Экран Nurse Panel (Med reminders):**
- Таблица: Student | Medication | Dosage | Date & Time | Notes | Status.
- Действия: «+ Add reminder», «Done».
- Вкладки: All | Pending | Completed.

**Экран Student Portal (My medications):**
- Список СВОИХ напоминаний на сегодня и ближайшие.
- Кнопка **«Я принял»** — доступна в пределах окна приёма.
- Статусы отображаются бейджами: Pending (ожидается), Done (принято), Missed (пропущено), Early (рано).
- Push-уведомление за 5 минут до планового времени.

### 5.5. Логика приёма лекарств

#### Кто отмечает приём

| Актор | Интерфейс | Условие |
|-------|-----------|---------|
| Медсестра | Nurse Panel → Med reminders → кнопка «Done» | Всегда доступно |
| Ученик | Student Portal → My medications → кнопка «Я принял» | В пределах окна приёма |

#### Окно приёма (intake window)

```
windowStart = dateTime - 30 минут
windowEnd   = dateTime + 60 минут
```

Параметры конфигурируемые: `INTAKE_WINDOW_BEFORE_MIN=30`, `INTAKE_WINDOW_AFTER_MIN=60`.

#### Логика статусов

| Ситуация | Новый статус | Уведомление |
|----------|-------------|-------------|
| Отметка в пределах окна | `Done` | — |
| Отметка ДО windowStart | `EarlyIntake` | Push медсестре: «{student} принял {medication} раньше на {X} мин» |
| windowEnd прошёл, отметки нет | `Missed` | Push медсестре: «{student} пропустил {medication}»; Push ученику: «Вы пропустили приём» |
| Медсестра вручную → Done | `Done` | Перезаписывает Missed/EarlyIntake |

**Планировщик:** Redis sorted-set, score = windowEnd. Worker каждую минуту проверяет записи со score < now → ставит `Missed`.

#### Аудит

Таблица `reminder_status_log`:
```
id | reminderId | previousStatus | newStatus | changedBy | changedAt | reason
```

### 5.6. Инвентарь медкабинета

| Поле | Тип | Описание |
|------|-----|----------|
| id | InventoryItemId | UUID, branded |
| name | string | Название |
| unit | InventoryUnit | Tablets / Puffs / ML / Pieces |
| currentStock | number (int, ≥ 0) | Текущий остаток |
| minThreshold | number (int, ≥ 0) | Порог алерта |
| updatedAt | ISO datetime | Последнее обновление |

**Операции:**
- Приход: `POST /inventory` — увеличивает stock.
- Авто-расход: при выдаче лекарства в визите → событие `visit.treatment.given` → списание.
- Корректировка: `PATCH /inventory/:id`.
- Алерт: `currentStock ≤ minThreshold` → уведомление медсестре.

**Экран:** доступен в Nurse Panel (Tools → Inventory).

### 5.7. Dashboard (Nurse Panel)

| Виджет | Правило подсчёта |
|--------|-----------------|
| Total students | COUNT активных учеников |
| Med reminders today | COUNT reminders WHERE date = today |
| Visits today | COUNT visits WHERE date = today |
| Emergency alerts | COUNT appointments WHERE priority=Emergency AND status=Pending |
| Recent medical events | Лента последних 10 событий (визиты + статусы) |
| Today's visits | Список визитов + «Open log» |
| Today's medication reminders | Список напоминаний со статусами |

### 5.8. Reports (Nurse Panel)

| Тип отчёта | Описание | Параметры |
|-----------|----------|-----------|
| visits_summary | Визиты за период по классам/жалобам | from, to, groupBy |
| medication_compliance | % принятых/пропущенных | from, to, studentId? |
| appointments_summary | Направления: создано/завершено/отменено | from, to |
| frequent_visitors | Топ учеников по визитам | from, to, limit |
| inventory_usage | Расход препаратов | from, to |

### 5.9. Student Portal — Home

Экран Home (главный экран ученика):
- **Ближайшее напоминание** — карточка: препарат, дозировка, время, кнопка «Я принял».
- **Следующее направление** — карточка: врач, дата, статус.
- **Кол-во пропущенных** за неделю — мотивационный виджет.
- **Последний визит** — когда был в медкабинете.

### 5.10. Notifications (оба клиента)

**Nurse Panel:**
- Колокольчик в Topbar → dropdown со списком уведомлений.
- Типы: новый визит с referral, пропущенный приём, low stock, emergency.
- Подключение: WebSocket.

**Student Portal:**
- Экран «Notifications» — полная лента.
- Push-уведомления (даже при закрытом браузере):
  - «Через 5 минут — время принять {medication}»
  - «Вы пропустили приём {medication}»
  - «Ваше направление к {doctor} одобрено»
  - «Ваше направление завершено»
- Подключение: WebSocket (online) + Web Push (offline).

---

## 6. Контракты (Zod) — пакет `@medcare/contracts`

### 6.1. Enums

```typescript
export const Disease = z.enum([
  "ADHD", "Asthma", "Anxiety", "LactoseIntolerance",
  "Epilepsy", "Diabetes", "None",
]);
export type Disease = z.infer<typeof Disease>;

export const Priority = z.enum(["Emergency", "High", "Medium", "Low"]);
export type Priority = z.infer<typeof Priority>;

export const AppointmentStatus = z.enum(["Pending", "Approved", "Completed", "Cancelled"]);
export type AppointmentStatus = z.infer<typeof AppointmentStatus>;

export const ReminderStatus = z.enum(["Pending", "Done", "Missed", "EarlyIntake"]);
export type ReminderStatus = z.infer<typeof ReminderStatus>;

export const DoctorType = z.enum([
  "FamilyDoctor", "Pediatrician", "Neurologist",
  "Gastroenterologist", "Allergist", "Dermatologist", "Ophthalmologist",
]);
export type DoctorType = z.infer<typeof DoctorType>;

export const InventoryUnit = z.enum(["Tablets", "Puffs", "ML", "Pieces"]);
export type InventoryUnit = z.infer<typeof InventoryUnit>;

export const VisitComplaintType = z.enum([
  "Fever", "Injury", "StomachPain", "Headache",
  "Allergy", "MedicationGiven", "Other",
]);
export type VisitComplaintType = z.infer<typeof VisitComplaintType>;

export const UserRole = z.enum(["nurse", "admin", "student"]);
export type UserRole = z.infer<typeof UserRole>;

export const NotificationType = z.enum([
  "reminder_upcoming", "reminder_missed", "appointment_approved",
  "appointment_completed", "appointment_cancelled", "referral_created",
  "low_stock", "emergency_alert", "early_intake",
]);
export type NotificationType = z.infer<typeof NotificationType>;
```

### 6.2. Branded IDs

```typescript
export const StudentId = z.string().uuid().brand<"StudentId">();
export type StudentId = z.infer<typeof StudentId>;

export const VisitId = z.string().uuid().brand<"VisitId">();
export type VisitId = z.infer<typeof VisitId>;

export const AppointmentId = z.string().uuid().brand<"AppointmentId">();
export type AppointmentId = z.infer<typeof AppointmentId>;

export const ReminderId = z.string().uuid().brand<"ReminderId">();
export type ReminderId = z.infer<typeof ReminderId>;

export const UserId = z.string().uuid().brand<"UserId">();
export type UserId = z.infer<typeof UserId>;

export const InventoryItemId = z.string().uuid().brand<"InventoryItemId">();
export type InventoryItemId = z.infer<typeof InventoryItemId>;

export const NotificationId = z.string().uuid().brand<"NotificationId">();
export type NotificationId = z.infer<typeof NotificationId>;
```

### 6.3. Entity-схемы (Response)

```typescript
export const StudentSchema = z.object({
  id: StudentId,
  userId: UserId.nullable(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  grade: z.string().min(1),
  age: z.number().int().min(5).max(21),
  diseases: z.array(Disease),
  medications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
  })),
  counselor: z.object({
    name: z.string().min(1),
    phone: z.string().regex(/^\d{3}-\d{7}$/),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Student = z.infer<typeof StudentSchema>;

export const VisitSchema = z.object({
  id: VisitId,
  studentId: StudentId.nullable(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  grade: z.string().min(1),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  complaint: z.string().min(1),
  complaintType: VisitComplaintType,
  treatmentGiven: z.string(),
  scheduledDoctorAppointment: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Visit = z.infer<typeof VisitSchema>;

export const AppointmentSchema = z.object({
  id: AppointmentId,
  studentId: StudentId,
  studentName: z.string().min(1),
  doctorType: DoctorType,
  reason: z.string().min(1),
  dateTime: z.string().datetime(),
  priority: Priority,
  status: AppointmentStatus,
  createdAt: z.string().datetime(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

export const ReminderSchema = z.object({
  id: ReminderId,
  studentId: StudentId,
  studentName: z.string().min(1),
  medication: z.string().min(1),
  dosage: z.string().min(1),
  dateTime: z.string().datetime(),
  notes: z.string(),
  status: ReminderStatus,
  confirmedAt: z.string().datetime().nullable(),
  confirmedBy: z.enum(["nurse", "student"]).nullable(),
});
export type Reminder = z.infer<typeof ReminderSchema>;

export const InventoryItemSchema = z.object({
  id: InventoryItemId,
  name: z.string().min(1),
  unit: InventoryUnit,
  currentStock: z.number().int().min(0),
  minThreshold: z.number().int().min(0),
  updatedAt: z.string().datetime(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const NotificationSchema = z.object({
  id: NotificationId,
  userId: UserId,
  type: NotificationType,
  title: z.string().min(1),
  message: z.string().min(1),
  isRead: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof NotificationSchema>;
```

### 6.4. Request-схемы

```typescript
export const CreateVisitSchema = z.object({
  studentId: StudentId.nullable().default(null),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  grade: z.string().min(1),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  complaint: z.string().min(1),
  complaintType: VisitComplaintType,
  treatmentGiven: z.string().default(""),
  scheduleDoctorAppointment: z.boolean().default(false),
});
export type CreateVisit = z.infer<typeof CreateVisitSchema>;

export const CreateStudentSchema = StudentSchema.omit({
  id: true, userId: true, createdAt: true, updatedAt: true,
});
export type CreateStudent = z.infer<typeof CreateStudentSchema>;

export const UpdateStudentSchema = CreateStudentSchema.partial();
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;

export const CreateAppointmentSchema = z.object({
  studentId: StudentId,
  doctorType: DoctorType,
  reason: z.string().min(1),
  dateTime: z.string().datetime(),
  priority: Priority,
});
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;

export const CreateReminderSchema = z.object({
  studentId: StudentId,
  medication: z.string().min(1),
  dosage: z.string().min(1),
  dateTime: z.string().datetime(),
  notes: z.string().default(""),
});
export type CreateReminder = z.infer<typeof CreateReminderSchema>;

export const ConfirmReminderSchema = z.object({
  confirmedBy: z.enum(["nurse", "student"]),
});
export type ConfirmReminder = z.infer<typeof ConfirmReminderSchema>;

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1),
  unit: InventoryUnit,
  quantity: z.number().int().min(1),
  minThreshold: z.number().int().min(0).default(5),
});
export type CreateInventoryItem = z.infer<typeof CreateInventoryItemSchema>;
```

### 6.5. Response wrappers

```typescript
export const PaginationMeta = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  totalPages: z.number().int().min(0),
});
export type PaginationMeta = z.infer<typeof PaginationMeta>;

export function paginatedResponse<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    meta: PaginationMeta,
  });
}

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
```

### 6.6. События шины

```typescript
export const ReferralCreatedEvent = z.object({
  type: z.literal("visit.referral.created"),
  visitId: VisitId,
  studentId: StudentId,
  studentName: z.string(),
  reason: z.string(),
  complaintType: VisitComplaintType,
});

export const AppointmentStatusChangedEvent = z.object({
  type: z.literal("appointment.status.changed"),
  appointmentId: AppointmentId,
  studentId: StudentId,
  previousStatus: AppointmentStatus,
  newStatus: AppointmentStatus,
});

export const ReminderStatusChangedEvent = z.object({
  type: z.literal("reminder.status.changed"),
  reminderId: ReminderId,
  studentId: StudentId,
  previousStatus: ReminderStatus,
  newStatus: ReminderStatus,
  medication: z.string(),
});

export const VisitCreatedEvent = z.object({
  type: z.literal("visit.created"),
  visitId: VisitId,
  studentId: StudentId.nullable(),
  complaintType: VisitComplaintType,
  date: z.string(),
});

export const LowStockEvent = z.object({
  type: z.literal("inventory.low_stock"),
  itemId: InventoryItemId,
  name: z.string(),
  currentStock: z.number(),
  minThreshold: z.number(),
});

export const ReminderUpcomingEvent = z.object({
  type: z.literal("reminder.upcoming"),
  reminderId: ReminderId,
  studentId: StudentId,
  medication: z.string(),
  dateTime: z.string().datetime(),
});
```

---

## 7. REST API

### 7.1. Общие правила

- Базовый URL: `https://{domain}/api/v1`
- Версионирование: `/v1/` в URL. Breaking changes → `/v2/` (deprecation 3 мес.).
- Content-Type: `application/json`
- Авторизация: `Authorization: Bearer <access_token>`
- Пагинация: `?page=1&pageSize=20` (max 100).
- Все ответы обёрнуты: success → `{ data }` или `{ items, meta }`; error → `ApiErrorSchema`.

### 7.2. Auth

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| POST | /auth/login | public | Логин → {accessToken, refreshToken} |
| POST | /auth/refresh | public | Обновление access token |
| POST | /auth/logout | all | Logout + blacklist |
| GET | /auth/verify | internal | Валидация токена (Kong) |
| GET | /auth/me | all | Текущий пользователь + роль |
| POST | /auth/register-student | admin, nurse | Создать аккаунт ученика |
| POST | /auth/activate | public | Активация аккаунта по коду |

### 7.3. Students

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| GET | /students | nurse, admin | Список (пагинация + фильтры) |
| POST | /students | nurse, admin | Создать ученика |
| GET | /students/:id | nurse, admin | Получить ученика |
| PATCH | /students/:id | nurse, admin | Обновить |
| DELETE | /students/:id | nurse, admin | Soft-delete |
| GET | /students/autocomplete | nurse, admin | Поиск для формы (?q=) |
| GET | /students/me | student | Получить СВОИ данные |

### 7.4. Visits

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| GET | /visits | nurse, admin | Журнал за день (?date=) |
| POST | /visits | nurse, admin | Записать визит |
| GET | /visits/:id | nurse, admin | Получить визит |
| GET | /visits/my | student | Мои визиты (history) |

### 7.5. Appointments

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| GET | /appointments | nurse, admin | Все направления |
| POST | /appointments | nurse, admin | Создать вручную |
| GET | /appointments/:id | nurse, admin | Получить |
| PATCH | /appointments/:id/approve | nurse, admin | → Approved |
| PATCH | /appointments/:id/cancel | nurse, admin | → Cancelled |
| PATCH | /appointments/:id/complete | nurse, admin | → Completed |
| GET | /appointments/my | student | Мои направления |

### 7.6. Medications / Reminders

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| GET | /reminders | nurse, admin | Все напоминания |
| POST | /reminders | nurse, admin | Создать |
| PATCH | /reminders/:id/done | nurse, admin | Медсестра отмечает Done |
| PATCH | /reminders/:id/confirm | student | Ученик отмечает «Я принял» |
| GET | /reminders/my | student | Мои напоминания (today + upcoming) |
| GET | /inventory | nurse, admin | Инвентарь |
| POST | /inventory | nurse, admin | Приход |
| PATCH | /inventory/:id | nurse, admin | Корректировка |

### 7.7. Notifications

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| GET | /notifications | all | Мои уведомления (?unreadOnly=) |
| PATCH | /notifications/:id/read | all | Отметить прочитанным |
| PATCH | /notifications/read-all | all | Прочитать все |
| POST | /notifications/push-subscribe | student | Подписка на push |
| DELETE | /notifications/push-subscribe | student | Отписка от push |

### 7.8. Dashboard / Reports

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| GET | /dashboard/summary | nurse, admin | Сводка дня |
| GET | /dashboard/recent-events | nurse, admin | Лента событий |
| GET | /reports | nurse, admin | Отчёт (?type=&from=&to=) |

### 7.9. CORS

Kong config:
```
Access-Control-Allow-Origin: https://nurse.medcare.example.com, https://student.medcare.example.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

---

## 8. Клиент — Nurse Panel

### 8.1. Структура (FSD)

```
apps/nurse-panel/src/
├── app/
│   ├── providers/          — StoreProvider, RouterProvider
│   ├── styles/             — global.scss, variables.scss, tokens.scss, mixins.scss
│   ├── router/             — routes + RoleGuard
│   └── index.tsx
│
├── pages/
│   ├── dashboard/
│   ├── daily-log/
│   ├── students/
│   ├── appointments/
│   ├── med-reminders/
│   ├── reports/
│   └── inventory/
│
├── widgets/
│   ├── sidebar/
│   ├── topbar/             — search + notifications bell + user avatar
│   ├── students-table/
│   ├── visits-table/
│   ├── appointments-board/
│   ├── reminders-table/
│   ├── dashboard-cards/
│   └── inventory-table/
│
├── features/
│   ├── record-visit/
│   ├── add-student/
│   ├── edit-student/
│   ├── approve-appointment/
│   ├── cancel-appointment/
│   ├── add-reminder/
│   ├── complete-reminder/
│   ├── add-inventory/
│   └── search-students/
│
├── entities/
│   ├── student/            — api/ model/ ui/ index.ts
│   ├── visit/
│   ├── appointment/
│   ├── reminder/
│   ├── inventory-item/
│   ├── notification/
│   └── user/
│
└── shared/
    ├── ui/                 — Button, Input, Modal, Badge, Table, Tabs, SearchInput
    ├── lib/                — formatDate, formatTime, cn()
    ├── config/             — env (Zod validated)
    └── types/              — re-export @medcare/contracts
```

### 8.2. Адаптивность (Nurse Panel)

| Breakpoint | Layout | Примечание |
|-----------|--------|-----------|
| ≥ 1280px (desktop) | Sidebar слева (240px) + основной контент | Основной сценарий |
| 768–1279px (tablet) | Sidebar сворачивается в icons-only (64px) | Таблицы скроллятся горизонтально |
| < 768px (mobile) | Sidebar → bottom nav (5 иконок), упрощённый layout | Для экстренных ситуаций «на ходу» |

Реализация: SCSS mixins + CSS Grid. Breakpoints в `app/styles/mixins.scss`:
```scss
@mixin tablet { @media (max-width: 1279px) { @content; } }
@mixin mobile { @media (max-width: 767px) { @content; } }
```

### 8.3. Управление состоянием

- **RTK Query** — серверные данные (students, visits, appointments, reminders, inventory, notifications).
- **RTK slices** — UI-состояние (формы, модалки, фильтры, sidebar open/closed).
- Кэш-инвалидация по тегам: `Students`, `Visits`, `Appointments`, `Reminders`, `Inventory`, `Notifications`.

### 8.4. Конвенции

- `index.ts` — public API каждого slice.
- Компоненты: `PascalCase.tsx`.
- Стили: `ComponentName.module.scss`.
- Model: `camelCase` (studentsSlice.ts, selectors.ts).
- Импорты только из `index.ts` нижележащего слоя.

---

## 9. Клиент — Student Portal (PWA)

### 9.1. Структура (FSD)

```
apps/student-portal/src/
├── app/
│   ├── providers/
│   ├── styles/             — mobile-first tokens, variables
│   ├── router/
│   ├── sw/                 — service worker (Workbox)
│   └── index.tsx
│
├── pages/
│   ├── home/               — ближайшие напоминания + направления
│   ├── my-medications/     — список лекарств + кнопка «Я принял»
│   ├── my-appointments/    — мои направления
│   ├── visit-history/      — история визитов
│   ├── profile/            — мои данные (read-only)
│   ├── notifications/      — лента уведомлений
│   └── login/              — вход по коду/email
│
├── widgets/
│   ├── bottom-nav/         — нижняя навигация (Home, Meds, Appointments, Notifications, Profile)
│   ├── reminder-card/      — карточка напоминания с кнопкой
│   ├── appointment-card/
│   └── notification-list/
│
├── features/
│   ├── confirm-intake/     — кнопка «Я принял» + логика окна
│   ├── push-subscribe/     — подписка на push-уведомления
│   └── mark-notification-read/
│
├── entities/
│   ├── reminder/           — api/ model/ ui/
│   ├── appointment/
│   ├── visit/
│   ├── notification/
│   └── user/
│
└── shared/
    ├── ui/                 — Button, Card, Badge, StatusIndicator, BottomSheet
    ├── lib/
    ├── config/
    └── types/
```

### 9.2. Mobile-first дизайн

| Аспект | Решение |
|--------|---------|
| Layout | Одна колонка, bottom navigation (5 tabs) |
| Карточки | Полная ширина, скругление 12px, тени |
| Кнопка «Я принял» | Крупная (48px height), контрастный зелёный, tactile feedback |
| Touch targets | Минимум 44×44px (Apple HIG) |
| Pull-to-refresh | Обновление списков напоминаний |
| Skeleton loaders | При загрузке данных |
| Offline | Service worker кэширует последний стейт, показывает «offline» бейдж |

### 9.3. PWA возможности

| Feature | Реализация |
|---------|-----------|
| Installable | manifest.json, «Add to Home Screen» |
| Offline support | Workbox (cache-first для статики, network-first для API) |
| Push notifications | Web Push API + notifications-service |
| Background sync | Если «Я принял» нажали offline → sync при восстановлении |

### 9.4. Push-уведомления (flow)

```
1. Ученик открывает Student Portal → prompt «Разрешить уведомления?»
2. Если «Да» → browser генерирует PushSubscription (endpoint + keys)
3. POST /notifications/push-subscribe { subscription }
4. notifications-service сохраняет подписку в Redis HASH (userId → subscription)
5. Когда наступает событие (reminder.upcoming) →
   notifications-service → Web Push → браузер ученика → notification popup
```

---

## 10. Безопасность

### 10.1. Аутентификация

| Параметр | Nurse Panel | Student Portal |
|----------|-------------|---------------|
| Логин | Email + password | Email + password (или код активации) |
| Access token TTL | 15 мин | 15 мин |
| Refresh token TTL | 7 дней | 30 дней (мобильные реже перелогиниваются) |
| Хранение access | in-memory (JS) | in-memory (JS) |
| Хранение refresh | httpOnly cookie | httpOnly cookie |
| Алгоритм | RS256 | RS256 |

### 10.2. RBAC

| Ресурс | nurse | admin | student |
|--------|-------|-------|---------|
| Students (all) | ✅ CRUD | ✅ CRUD | ❌ |
| Students/me | — | — | ✅ read |
| Visits (all) | ✅ CRUD | ✅ CRUD | ❌ |
| Visits/my | — | — | ✅ read |
| Appointments (all) | ✅ CRUD | ✅ CRUD | ❌ |
| Appointments/my | — | — | ✅ read |
| Reminders (all) | ✅ CRUD | ✅ CRUD | ❌ |
| Reminders/my | — | — | ✅ read + confirm |
| Inventory | ✅ CRUD | ✅ CRUD | ❌ |
| Reports | ✅ read | ✅ read | ❌ |
| Users | ❌ | ✅ CRUD | ❌ |
| Notifications | ✅ own | ✅ own | ✅ own |

**Правило:** student видит ТОЛЬКО данные, где `studentId` совпадает с его привязанным профилем. Проверка на уровне сервиса (middleware).

### 10.3. Blacklist JWT

При logout → access token в Redis SET с TTL = оставшееся время жизни. Kong проверяет blacklist.

### 10.4. Аудит

Все мутации логируются:
```
{ userId, userRole, action, entity, entityId, timestamp, previousValue, newValue }
```

### 10.5. Прочее

- HTTPS обязателен.
- Rate limiting: 100 req/min (nurse/admin), 30 req/min (student).
- Input: Zod + html-escaping строк.
- SQL injection: Prisma (parameterized queries).
- CORS: ограничен доменами двух клиентов.
- Данные ученика видны ТОЛЬКО ему и медсестре/админу.

---

## 11. Инфраструктура

### 11.1. Монорепо (pnpm workspaces)

```
medcare/
├── packages/
│   └── contracts/              — @medcare/contracts (Zod, types, enums)
├── services/
│   ├── auth/
│   ├── students/
│   ├── visits/
│   ├── appointments/
│   ├── medications/
│   ├── notifications/
│   └── reports/
├── apps/
│   ├── nurse-panel/           — React (desktop-first)
│   └── student-portal/        — React PWA (mobile-first)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json                  — Turborepo для build/lint/test
```

### 11.2. Docker Compose (dev)

```yaml
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: medcare
      POSTGRES_PASSWORD: medcare_dev
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]
  kong:
    image: kong:3.6
    ports: ["8000:8000", "8001:8001"]
```

### 11.3. Миграции

- Каждый сервис: `services/{name}/prisma/migrations/`.
- Dev: `npx prisma migrate dev`.
- Prod: `npx prisma migrate deploy` в init-container.
- Независимые (не координируются между сервисами).

### 11.4. API Versioning

- URL prefix `/api/v1/`.
- Breaking change → `/api/v2/` + deprecation period (3 мес.).
- Non-breaking (добавление полей) — не меняет версию.

### 11.5. Деплой

| Компонент | Где |
|-----------|-----|
| Nurse Panel | Static hosting (Vercel / Nginx), домен nurse.medcare.example.com |
| Student Portal | Static hosting (Vercel / Nginx), домен app.medcare.example.com |
| Services | Docker containers (K8s или Docker Swarm) |
| PostgreSQL | Managed DB (AWS RDS / DigitalOcean) |
| Redis | Managed Redis (ElastiCache / DigitalOcean) |
| RabbitMQ | Managed или self-hosted container |

---

## 12. Порядок реализации

| Этап | Что | Результат |
|------|-----|----------|
| 1 | Монорепо + `@medcare/contracts` | pnpm workspace, все типы/схемы/enums |
| 2 | auth-service + Kong + Redis | Логин, JWT, RBAC, blacklist, регистрация ученика |
| 3 | students-service + Nurse Panel: экран Students | CRUD, поиск, фильтры |
| 4 | visits-service + Nurse Panel: Daily Log | Журнал, форма, авто-направление |
| 5 | appointments-service + Nurse Panel: Appointments | Направления, статусы |
| 6 | medications-service + Nurse Panel: Med Reminders | Напоминания, планировщик, инвентарь |
| 7 | notifications-service + Nurse Panel: колокольчик | WebSocket, in-app уведомления |
| 8 | reports-service + Nurse Panel: Dashboard + Reports | Агрегации, виджеты |
| 9 | **Student Portal: login + Home + My medications** | PWA, кнопка «Я принял», push |
| 10 | Student Portal: My appointments + Visit history | Направления, история |
| 11 | Student Portal: Notifications + Profile | Лента, push, offline |
| 12 | Адаптив Nurse Panel (tablet + mobile) | Responsive layout |
| 13 | E2E тесты + деплой | Playwright, CI/CD, production |

---

## 13. Глоссарий

| Термин | Определение |
|--------|------------|
| Nurse Panel | Веб-приложение медсестры (десктоп-first + адаптив) |
| Student Portal | PWA для ученика (mobile-first) |
| Visit | Одно посещение медкабинета |
| Referral | Направление к внешнему врачу (= Appointment) |
| Reminder | Одно запланированное событие приёма лекарства |
| Intake window | Интервал, в пределах которого приём считается нормальным (−30 / +60 мин) |
| Branded type | TS-тип с `__brand`, предотвращающий смешивание ID |
| FSD | Feature-Sliced Design — архитектура фронтенда |
| RTK | Redux Toolkit |
| PWA | Progressive Web App — устанавливаемое веб-приложение |
| Soft-delete | Запись помечается `deletedAt`, не удаляется физически |
| RBAC | Role-Based Access Control — доступ по ролям |
