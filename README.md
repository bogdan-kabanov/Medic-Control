# MedCare — школьный медицинский кабинет

Система управления школьным медкабинетом: два клиентских приложения поверх микросервисного бэкенда.

- **Nurse Panel** — панель медсестры (десктоп/планшет): ученики, журнал визитов, направления к врачам, напоминания, отчёты
- **Student Portal** — PWA для учеников: напоминания о лекарствах, направления, история визитов

Роли: Nurse, Admin, Student (RBAC). Подробная проектная документация — в [documentation.md](documentation.md).

## Архитектура
Монорепозиторий (pnpm workspaces + Turborepo):

| Каталог | Назначение |
|---|---|
| `services/auth` | аутентификация и роли |
| `services/students` | база учеников |
| `services/visits` | визиты |
| `services/appointments` | направления к врачам |
| `services/medications` | лекарства и напоминания |
| `services/notifications` | уведомления |
| `services/reports` | отчёты |
| `client/nurse-panel`, `client/student-portal` | фронтенд |
| `packages/contracts` | общие типы и контракты |

Инфраструктура в `docker-compose.yml`: PostgreSQL 16, Redis 7, RabbitMQ.

## Запуск
Требуется Node.js ≥ 22, pnpm ≥ 9, Docker.
```bash
docker compose up -d
pnpm install
pnpm dev:all-services
pnpm dev:nurse-panel
pnpm dev:student-portal
```
