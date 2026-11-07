# EventOps

B2B SaaS PWA для мероприятий: лагеря, свадьбы, корпоративные тренинги.

- **Backend:** Django 5 + DRF + SimpleJWT, база Supabase PostgreSQL (без `DB_HOST` будет SQLite)
- **Frontend:** React 18 + Vite, react-router, TanStack Query, PWA (vite-plugin-pwa)

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
| Гость | «Я гость» → телефон `+996 700 111 222`, код `ALA001` |

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
| tasks, badges, badge-templates, CSV | всё | нет |
| `/api/my/badge/` | — | свой бейдж |
| `/api/public/badges/<token>/` | без входа (проверка по QR) | |

## Структура фронта

```
frontend/src/
  api/client.js        fetch + JWT + refresh
  api/hooks.js         useList / useItem / useCrud (react-query)
  auth/AuthContext.jsx вход сотрудника и гостя, /api/me/
  pages/LoginPage.jsx
  pages/VerifyPage.jsx публичная страница из QR (/verify/:token)
  pages/staff/         события, участники, расписание, задачи, оплаты
  pages/guest/         программа, бейдж, оплата (мобильный вид)
  styles/              tokens.css (палитра) + app.css
```

## Что дальше

- Хранить чеки в Supabase Storage с подписанными ссылками (сейчас `media/` открыт по прямой ссылке, только в DEBUG)
- Пагинация в DRF, когда участников станет больше сотни
- Один пользователь в нескольких событиях (сейчас `get_participant` берёт первое)
- Выбор исполнителя задачи (нужен endpoint со списком сотрудников)
- Мультиарендность (организации) для B2B
