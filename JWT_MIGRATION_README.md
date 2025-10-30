# Migración a JWT - Instrucciones de Implementación

## ✅ Cambios Completados

La migración de sesiones a JWT está **completada**. A continuación se detallan todos los cambios realizados:

### 🔧 Cambios en el Backend

#### 1. **Nuevas Dependencias Instaladas**

- `@nestjs/jwt` - Módulo JWT de NestJS
- `jsonwebtoken` - Biblioteca JWT para Node.js
- `@types/jsonwebtoken` - Tipos para TypeScript

#### 2. **Schema de Base de Datos Actualizado**

- ✅ Agregado campo `refreshToken` al modelo `Users`
- ✅ Eliminado modelo `Session` (ya no necesario)
- ✅ Migraciones creadas y aplicadas

#### 3. **Nuevos Servicios y Guards**

- ✅ `AuthJwtService` - Maneja generación y verificación de tokens
- ✅ `JwtAuthGuard` - Guard para validar JWT tokens
- ✅ Decorador `@GetUser()` para extraer datos del usuario

#### 4. **Controladores Actualizados**

- ✅ `AuthController` - Login, logout y refresh token endpoints
- ✅ `PermissionsGuard` - Adaptado para trabajar con JWT
- ✅ Todas las funciones utilitarias actualizadas

#### 5. **Configuración**

- ✅ `AuthModule` configurado con JWT
- ✅ `main.ts` - Removido middleware de sesiones
- ✅ CORS actualizado (credentials: false)

#### 6. **Limpieza**

- ✅ Dependencias de sesiones removidas
- ✅ Middleware de sesiones eliminado
- ✅ Modelo Session eliminado de la BD

---

## 🚀 Configuración Necesaria

### Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# JWT Configuration
JWT_ACCESS_SECRET=tu_secreto_muy_seguro_access_token_aqui_cambiar_en_produccion
JWT_REFRESH_SECRET=tu_secreto_muy_seguro_refresh_token_aqui_cambiar_en_produccion
```

**⚠️ IMPORTANTE:** Cambia los secretos en producción por valores únicos y seguros.

---

## 📱 Cambios Necesarios en el Frontend/Mobile

### 1. **Actualizar Llamadas de Login**

**Antes (Sessions):**

```javascript
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Para cookies
  body: JSON.stringify({ email, password }),
});
```

**Ahora (JWT):**

```javascript
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const data = await response.json();
if (data.accessToken) {
  // Guardar tokens en localStorage/SecureStore
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
}
```

### 2. **Enviar JWT en Requests**

**Todas las peticiones autenticadas:**

```javascript
const token = localStorage.getItem('accessToken');
const response = await fetch('/api/endpoint', {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### 3. **Manejo de Refresh Token**

```javascript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } else {
    // Token inválido, redirigir a login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
}

// Interceptor para renovar token automáticamente
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        error.config.headers['Authorization'] = `Bearer ${newToken}`;
        return axios.request(error.config);
      }
    }
    return Promise.reject(error);
  },
);
```

### 4. **Logout**

```javascript
async function logout() {
  const token = localStorage.getItem('accessToken');

  await fetch('/auth/logout', {
    headers: { Authorization: `Bearer ${token}` },
  });

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
}
```

---

## 🔍 Nuevos Endpoints

### POST `/auth/refresh`

Renueva el access token usando el refresh token.

**Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

---

## 🎯 Beneficios de la Migración

1. **✅ Funciona en iOS** - No hay problemas con cookies
2. **🔒 Más Seguro** - Tokens con expiración corta
3. **📱 Multiplataforma** - Compatible con todas las apps
4. **⚡ Mejor Rendimiento** - Sin consultas de sesión a BD
5. **🌐 Stateless** - Escalable y sin estado

---

## ⚠️ Notas Importantes

1. **Tokens Cortos**: Access tokens expiran en 15 minutos
2. **Refresh Automático**: Implementa el interceptor para renovar automáticamente
3. **Almacenamiento Seguro**: En móviles, usa SecureStore en lugar de localStorage
4. **Logout Completo**: Siempre limpia tokens del cliente al hacer logout

---

## 🧪 Testing

Para probar la migración:

1. **Login**: Verifica que recibes `accessToken` y `refreshToken`
2. **Requests Autenticados**: Usa `Authorization: Bearer <token>`
3. **Refresh**: Testa el endpoint `/auth/refresh`
4. **Logout**: Verifica que se limpie el refreshToken de la BD

¡La migración está completa y lista para usar! 🎉
