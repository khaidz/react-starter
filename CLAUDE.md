# React Starter — Frontend

React 19 + TypeScript + Vite + Mantine v8

## Cấu trúc src/

```
src/
├── api/          # API functions, một file per resource (*.api.ts)
├── assets/       # Static files
├── components/   # Shared/reusable components
├── hooks/        # Custom React hooks
├── layouts/      # Layout wrappers
├── lib/          # Utilities (http client, notify, permissions, export)
├── pages/        # Feature pages, tổ chức theo feature folder
├── routes/       # React Router config
├── store/        # Zustand stores
└── types/        # TypeScript type definitions
```

## Patterns chính

### HTTP Client — `src/lib/http.ts`
- Axios instance với base URL từ `VITE_API_BASE_URL`
- Request interceptor: tự gắn Bearer token từ auth store
- Response interceptor: tự refresh token khi 401, queue các request đang chờ
- Helper functions: `get<T>()`, `post<T>()`, `put<T>()`, `patch<T>()`, `del<T>()`
- Response unwrap `ApiResponse<T>` → trả về data trực tiếp

### API Files — `src/api/*.api.ts`
Mỗi resource có 1 file, ví dụ `users.api.ts`, `roles.api.ts`. Dùng helpers từ `lib/http.ts`.

### State — `src/store/`
- `auth.store.ts`: `accessToken`, `refreshToken`, `user`, persist localStorage key `auth`
- `loading.store.ts`: global loading state
- Dùng Zustand với `persist` middleware cho auth

### Routing — `src/routes/`
- `index.tsx`: entry point router
- `public-routes.ts`: wrapped trong `GuestGuard`
- `private-routes.ts`: wrapped trong `AuthGuard` + `PermissionGuard`
- Guard components: `auth-guard.tsx`, `permission-guard.tsx` trong `components/`

### UI — Mantine v8
Ưu tiên Mantine components, không tự viết CSS khi Mantine có sẵn:
- Forms: `@mantine/form`
- Notifications: `lib/notify.ts` (wrapper cho `@mantine/notifications`)
- Modals: `@mantine/modals`
- Charts: `@mantine/charts` (Recharts underneath)
- Data table: `components/data-table/`
- File upload: `components/file-uploader/`

### Permissions
- Hook: `use-permission.ts`
- Guard: `permission-guard.tsx`
- Helpers: `lib/permissions.ts`

### WebSocket
- Hook: `use-notification-socket.ts` — STOMP over SockJS
- Component: `components/notification-bell/`

## Features đã có
- Auth (login, register, verify email, forgot password, reset password, OAuth Azure AD/Google)
- User management, Role, Permission, Department (tree view)
- API Keys
- File upload/management
- Job scheduling (cron editor)
- Leave management (types, requests, balances)
- Real-time notifications (WebSocket)

## Env
```
VITE_API_BASE_URL=http://localhost:8989
```
