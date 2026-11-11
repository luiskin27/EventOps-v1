# EventOps

B2B SaaS PWA для мероприятий: лагеря, свадьбы, корпоративные тренинги.

- **Backend:** Django 5 + DRF + SimpleJWT, база Supabase PostgreSQL (без `DB_HOST` будет SQLite)
- **Frontend:** React 18 + Vite, Tailwind CSS 3, react-router, TanStack Query, lucide-react, PWA (vite-plugin-pwa)
- **Дизайн:** макеты EventOps (Tailwind, Inter, indigo-600, светлая и тёмная темы) — фронт повторяет их классы один в один

## Запуск

```powershell
copy .env.example .env          # заполнить DB_* от Supabase
docker compose up -d --build -V # -V пересоздаёт node_modules после новых npm-пакетов
docker compose exec backend python manage.py seed_demo
```

- Фронт: http://localhost:5173
- API: http://localhost:8000/api/
- Админка Django: http://localhost:8000/admin/

`seed_demo` создаёт демо-данные (его можно запускать повторно):

| Кто | Как войти |
| --- | --- |
| Организатор | «Я организатор» → `staff1` / `staff12345` |
| Гость свадьбы | «Я гость» → телефон `+996 700 222 333`, код `AIT001` |
| Участник лагеря (оплаты и документы) | «Я гость» → телефон `+996 700 111 222`, код `ALA001` |

## Как устроен вход

Роль определяет **backend**, фронт её не выбирает.

| | Endpoint | Кто |
| --- | --- | --- |
| Организатор | `POST /api/token/` (логин + пароль) | `User.is_staff = True` |
| Гость | `POST /api/guest/login/` (телефон + код) | `Participant` с `guest_code` |
| Кто я | `GET /api/me/` → `kind: "staff" \| "guest"` | любой вошедший |

Токены хранятся в `localStorage`. На 401 `src/api/client.js` один раз обновляет access через `/api/token/refresh/`.

## Права в API

| Ресурс | Сотрудник | Гость |
| --- | --- | --- |
| events, roles, participants | всё | читает только своё событие или себя |
| schedule, documents | всё | только `is_public` своего события |
| payment-items | всё | читает статьи своего события |
| payments | всё (принять/отклонить) | свои платежи + отправка чека (статус всегда `PENDING`) |
| document-types | всё | читает типы своего события |
| participant-documents | всё (принять/отклонить, комментарий обязателен при отклонении) | свои документы + загрузка (статус всегда `PENDING`) |
| `participant-documents/<id>/file/` | любой файл | только свой; без входа — 401 |
| tasks, badges, badge-templates, CSV | всё | нет |
| team | всё | нет |
| schedule-links | всё | нет |
| `/api/public/schedule/<token>/` | без входа: расписание по ссылке (своя аудитория + пункты для гостей) | |
| `/api/my/badge/` | — | свой бейдж |
| `/api/public/badges/<token>/` | без входа (проверка по QR): `admitted` = бейдж активен + всё оплачено + обязательные документы приняты | |

## Структура фронта

```
frontend/src/
  api/client.js          fetch + JWT + refresh
  api/hooks.js           useList / useItem / useCrud (react-query)
  auth/AuthContext.jsx   вход участника и организатора, /api/me/
  theme.jsx              светлая / тёмная тема (класс dark на <html>)
  layout/AppShell.jsx    Sidebar + Topbar + выдвижное меню на телефоне
  ui/                    кнопки, бейджи статусов, модалки, BadgeCard
  pages/LoginPage.jsx    вход (по макету «Регистрация»)
  pages/VerifyPage.jsx   проверка по QR (/verify/:token): допущен / не допущен
  pages/staff/           мероприятия, обзор, задачи, расписание, участники,
                         проверка оплат, бейджи, настройки
  pages/guest/           кабинет, расписание, оплата (загрузка чека), бейдж
```

## Что есть в макетах, но пока нет в API

- Регистрация участника с паролем (сейчас организатор добавляет участника, тот входит по телефону и коду)
- Роль «Заказчик», отчёты и бюджет, сегменты расписания, метки и исполнители задач, списки/рассылки

## Что дальше

- Хранить чеки в Supabase Storage с подписанными ссылками (сейчас `media/` открыт по прямой ссылке, только в DEBUG)
- Пагинация в DRF, когда участников станет больше сотни
- Один пользователь в нескольких событиях (сейчас `get_participant` берёт первое)
- Выбор исполнителя задачи (нужен endpoint со списком сотрудников)
- Мультиарендность (организации) для B2B
