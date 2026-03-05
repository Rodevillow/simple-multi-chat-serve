# Simple Multi Chat (Nuxt 4 + PWA + Express + Socket.IO + PostgreSQL)

Полноценный простой чат в одном репозитории:
- `app/` — фронтенд на **Nuxt 4** c **PWA**.
- `server/` — backend на **Express + Socket.IO + Prisma + PostgreSQL**.
- Архитектура backend: разбиение по слоям в стиле DDD (`domain`, `application`, `infrastructure`, `presentation`).

## Что реализовано

- Регистрация: `email + nickname + имя/фамилия (опционально) + пароль + повтор`.
- Логин по `email + пароль`.
- JWT-авторизация.
- Список чатов слева:
  - мини-аватар,
  - имя/ник/email fallback,
  - превью последнего сообщения.
- Полотно чата справа:
  - если чат не выбран — заглушка,
  - если выбран — сообщения + отправка.
- Создание direct-чата по email пользователя.
- Realtime обновления через Socket.IO.
- PWA-манифест и автообновление service worker.
- Базовые unit-тесты на use-case/domain.

## Требования

- Node.js `>=20.19.0` (или `>=22.12.0` для Nuxt 4)
- npm `>=10`
- PostgreSQL (у тебя уже есть docker-контейнер)

## Переменные окружения

Скопируй пример:

```bash
cp .env.example .env
```

Текущий `.env.example` уже настроен под твой кейс:

```env
DATABASE_URL="postgresql://test:test@localhost:5432/test?schema=public"
JWT_SECRET="change_me"
SERVER_PORT="4000"
CLIENT_ORIGIN="http://localhost:3000,http://localhost:3001"
BODY_LIMIT="10mb"
NUXT_PUBLIC_API_BASE="http://localhost:4000"
```

Если у тебя в Postgres другие user/password — поменяй `DATABASE_URL`.
Если фронт запускается не на `3000`, добавь его origin в `CLIENT_ORIGIN`.

## Установка

```bash
npm install
```

## Инициализация БД

Вариант для быстрого старта (без миграций):

```bash
npm run prisma:generate
npm run prisma:push
```

Вариант с миграцией:

```bash
npm run prisma:generate
npm run prisma:migrate --workspace server -- --name init
```

## Запуск в dev

```bash
npm run dev
```

Поднимутся:
- frontend: `http://localhost:3000`
- backend: `http://localhost:4000`

Если `3000` занят, Nuxt автоматически выберет следующий свободный порт (например, `3001`).

Health-check API:

```bash
curl http://localhost:4000/api/health
```

## Тесты

```bash
npm test
```

## Production build

```bash
npm run build
```

## Структура backend (DDD-style)

```text
server/src
  domain/
    entities/
    repositories/
    services/
    errors/
  application/
    use-cases/
  infrastructure/
    config/
    db/
    repositories/
    security/
  presentation/
    http/
    socket/
```

## Быстрый сценарий проверки

1. Открой `http://localhost:3000`.
2. Зарегистрируй пользователя A.
3. В другом браузере/инкогнито зарегистрируй пользователя B.
4. У пользователя A создай чат по email пользователя B.
5. Отправляй сообщения с обеих сторон и проверь realtime.
