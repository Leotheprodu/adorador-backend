# Adorador Backend API

<p align="center">
  API REST para la aplicación de gestión de bandas de adoración, eventos y canciones.
</p>

## 📋 Descripción

**Adorador Backend** es una API REST construida con NestJS que proporciona una plataforma completa para la gestión de bandas de adoración, iglesias, eventos y canciones. Permite a los usuarios organizar servicios de adoración, gestionar setlists en tiempo real a través de WebSockets, y mantener un catálogo de canciones con letras y acordes.

## 🚀 Tecnologías

- **[NestJS](https://nestjs.com/)** v10 - Framework progresivo de Node.js
- **[Prisma](https://www.prisma.io/)** v5 - ORM para TypeScript/Node.js
- **[MySQL](https://www.mysql.com/)** - Base de datos relacional
- **[JWT](https://jwt.io/)** - Autenticación basada en tokens (Access & Refresh tokens)
- **[WebSockets](https://socket.io/)** - Comunicación en tiempo real para eventos
- **[Swagger](https://swagger.io/)** - Documentación interactiva de API
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** - Encriptación de contraseñas
- **[Nodemailer](https://nodemailer.com/)** - Envío de emails (verificación, recuperación de contraseña)
- **[EJS](https://ejs.co/)** - Templates para emails
- **TypeScript** - Tipado estático

## ✨ Características Principales

### Autenticación y Autorización

- Sistema de autenticación JWT con access y refresh tokens
- Verificación de email con tokens temporales
- Recuperación de contraseña mediante email
- Sistema de roles y permisos granular (usuarios, admin, roles de iglesia)
- Guards personalizados para protección de rutas

### Gestión de Usuarios

- CRUD completo de usuarios
- Perfiles de usuario con información detallada
- Sistema de roles dinámico
- Membresías a iglesias con roles específicos

### Bandas y Eventos

- Gestión de bandas de adoración
- Creación y administración de eventos/servicios
- Asignación de miembros a bandas con roles específicos
- Sistema de permisos por banda (admin, event manager, musician)

### Eventos en Tiempo Real (WebSockets)

- Gestión de setlists en tiempo real
- Sincronización de cambios entre usuarios
- Actualización de canciones durante eventos en vivo

### Canciones

- Catálogo de canciones con letras y acordes
- Soporte para múltiples versiones de letras
- Gestión de acordes por sección de letra
- Organización de canciones por banda

### Iglesias

- Gestión de iglesias
- Sistema de membresías
- Roles personalizados por iglesia (worship leader, musician, etc.)

## 📁 Estructura del Proyecto

```
src/
├── auth/                    # Módulo de autenticación
│   ├── guards/             # Guards de autenticación y permisos
│   ├── services/           # Servicios JWT
│   ├── dto/                # DTOs de autenticación
│   └── auth.swagger.ts     # Documentación Swagger
├── users/                  # Módulo de usuarios
│   ├── dto/
│   └── users.swagger.ts
├── bands/                  # Módulo de bandas
│   ├── dto/
│   └── bands.swagger.ts
├── churches/               # Módulo de iglesias
│   ├── dto/
│   └── churches.swagger.ts
├── events/                 # Módulo de eventos
│   ├── events.gateway.ts   # WebSocket Gateway
│   ├── dto/
│   └── events.swagger.ts
├── songs/                  # Módulo de canciones
│   ├── dto/
│   └── songs.swagger.ts
├── songs-lyrics/           # Módulo de letras de canciones
├── songs-chords/           # Módulo de acordes
├── memberships/            # Módulo de membresías
├── church-roles/           # Módulo de roles de iglesia
├── church-member-roles/    # Módulo de roles de miembros
├── email/                  # Módulo de emails
├── temporal-token-pool/    # Módulo de tokens temporales
└── prisma.service.ts       # Servicio de Prisma
```

## 🔧 Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd adorador-backend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL="mysql://usuario:password@localhost:3306/adorador"

# JWT
JWT_SECRET="tu-secreto-jwt"
JWT_REFRESH_SECRET="tu-secreto-refresh-jwt"

# Email
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="tu-password-email"

# Aplicación
PORT=3000
NODE_ENV=development
IPDEV=localhost

# CORS
CORS_ORIGIN="http://localhost:3001"
```

4. **Ejecutar migraciones de Prisma**

```bash
npx prisma migrate dev
```

5. **Generar cliente de Prisma**

```bash
npx prisma generate
```

## 🏃 Ejecución

### Modo desarrollo

```bash
npm run start:dev
```

### Modo producción

```bash
npm run build
npm run start:prod
```

### Modo debug

```bash
npm run start:debug
```

## 📚 Documentación API

Una vez que la aplicación esté corriendo, accede a la documentación interactiva de Swagger:

```
http://localhost:3000/api
```

La documentación incluye:

- Descripción detallada de todos los endpoints
- Esquemas de request/response
- Autenticación con Bearer token
- Ejemplos de uso
- Pruebas interactivas de endpoints

## 🔑 Endpoints Principales

### Autenticación (`/auth`)

- `POST /auth/login` - Iniciar sesión
- `POST /auth/refresh` - Refrescar token
- `GET /auth/logout` - Cerrar sesión
- `GET /auth/check-login-status` - Verificar estado de autenticación
- `GET /auth/verify-email/:token` - Verificar email
- `POST /auth/forgot-password` - Solicitar recuperación de contraseña
- `POST /auth/new-password` - Establecer nueva contraseña

### Usuarios (`/users`)

- `GET /users` - Obtener todos los usuarios
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear nuevo usuario
- `POST /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario
- `GET /users/add-role/:id/:roleId` - Agregar rol a usuario
- `GET /users/delete-role/:id/:roleId` - Eliminar rol de usuario

### Bandas (`/bands`)

- `GET /bands` - Obtener todas las bandas
- `GET /bands/user-bands` - Obtener bandas del usuario autenticado
- `GET /bands/:id` - Obtener banda por ID
- `POST /bands` - Crear nueva banda
- `PATCH /bands/:id` - Actualizar banda
- `DELETE /bands/:id` - Eliminar banda

### Iglesias (`/churches`)

- `GET /churches` - Obtener todas las iglesias
- `GET /churches/:id` - Obtener iglesia por ID
- `POST /churches` - Crear nueva iglesia
- `PATCH /churches/:id` - Actualizar iglesia
- `DELETE /churches/:id` - Eliminar iglesia

### Eventos (`/bands/:bandId/events`)

- `GET /bands/:bandId/events` - Obtener eventos de una banda
- `GET /bands/:bandId/events/:id` - Obtener evento específico (público)
- `POST /bands/:bandId/events` - Crear nuevo evento
- `PATCH /bands/:bandId/events/:id` - Actualizar evento
- `DELETE /bands/:bandId/events/:id` - Eliminar evento
- `POST /bands/:bandId/events/:id/songs` - Agregar canciones a evento
- `DELETE /bands/:bandId/events/:id/songs` - Eliminar canciones de evento
- `PATCH /bands/:bandId/events/:id/songs` - Actualizar canciones de evento

### Canciones (`/bands/:bandId/songs`)

- Ver catálogo de canciones por banda
- CRUD completo de canciones
- Gestión de letras y acordes

## 🔐 Autenticación

La API utiliza JWT para autenticación:

1. **Login**: Envía credenciales a `/auth/login`
2. **Recibe**: Access token (corta duración) y Refresh token (larga duración)
3. **Uso**: Incluye el access token en el header `Authorization: Bearer <token>`
4. **Renovación**: Usa el refresh token en `/auth/refresh` para obtener nuevos tokens

### Ejemplo de autenticación

```typescript
// Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}

// Uso del token
GET /users
Headers: {
  "Authorization": "Bearer eyJhbGc..."
}
```

## 🔄 WebSockets

La aplicación incluye comunicación en tiempo real para eventos:

```typescript
// Conectar al WebSocket
socket.connect('http://localhost:3000/events');

// Escuchar actualizaciones de eventos
socket.on('eventUpdated', (data) => {
  console.log('Event updated:', data);
});
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura de tests
npm run test:cov
```

## 📦 Scripts Disponibles

```bash
npm run build          # Compilar proyecto
npm run format         # Formatear código con Prettier
npm run lint           # Ejecutar ESLint
npm run migrate        # Ejecutar migraciones de Prisma (producción)
```

## 🗄️ Base de Datos

El proyecto utiliza Prisma como ORM con MySQL. Los modelos principales incluyen:

- **Users**: Usuarios del sistema
- **Roles**: Roles de aplicación (user, admin)
- **Churches**: Iglesias
- **ChurchRoles**: Roles dentro de iglesias
- **Memberships**: Membresías de usuarios a iglesias
- **Bands**: Bandas de adoración
- **MembersofBands**: Miembros de bandas
- **Events**: Eventos/Servicios
- **Songs**: Canciones
- **SongsLyrics**: Letras de canciones
- **SongsChords**: Acordes de canciones
- **Temporal_token_pool**: Pool de tokens temporales

### Comandos de Prisma

```bash
npx prisma studio          # Abrir interfaz visual de BD
npx prisma migrate dev     # Crear y aplicar migración
npx prisma migrate deploy  # Aplicar migraciones (producción)
npx prisma generate        # Generar cliente de Prisma
```

## 👨‍💻 Autor

**Leonardo Serrano** - [Leotheprodu](https://github.com/Leotheprodu)

## 📄 Licencia

Este proyecto es privado y no tiene licencia pública.

## 🤝 Contribuir

Si deseas contribuir al proyecto, por favor contacta al autor.

## 📞 Soporte

Para soporte o preguntas, contacta al equipo de desarrollo.
