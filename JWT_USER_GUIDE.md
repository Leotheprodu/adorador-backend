# JWT User Information - Migración desde Session

## Comparación: Session vs JWT

### ✅ Información Disponible en JWT (Tipada)

| **Antes (Session)**      | **Ahora (JWT)**       | **Tipo**               | **Descripción**                 |
| ------------------------ | --------------------- | ---------------------- | ------------------------------- |
| `session.userId`         | `user.sub`            | `number`               | ID del usuario                  |
| `session.name`           | `user.name`           | `string`               | Nombre completo del usuario     |
| `session.email`          | `user.email`          | `string`               | Email del usuario               |
| `session.isLoggedIn`     | `true` (implícito)    | `boolean`              | Si JWT es válido, está logueado |
| `session.roles`          | `user.roles`          | `number[]`             | Array de IDs de roles           |
| `session.memberships`    | `user.memberships`    | `UserMembership[]`     | Membresías en iglesias          |
| `session.membersofBands` | `user.membersofBands` | `UserBandMembership[]` | Membresías en bandas            |

## Tipos Disponibles

### JwtPayload (Interface Principal)

```typescript
interface JwtPayload {
  sub: number; // userId
  email: string; // email del usuario
  name: string; // nombre completo
  roles: number[]; // IDs de roles de app
  memberships: UserMembership[]; // membresías en iglesias
  membersofBands: UserBandMembership[]; // membresías en bandas
  iat?: number; // timestamp creación
  exp?: number; // timestamp expiración
}
```

### UserMembership (Membresías en Iglesias)

```typescript
interface UserMembership {
  id: number;
  church: {
    id: number;
    name: string;
  };
  roles: {
    id: number;
    name: string;
    churchRoleId: number;
  }[];
  since: Date;
}
```

### UserBandMembership (Membresías en Bandas)

```typescript
interface UserBandMembership {
  id: number;
  role: string;
  isAdmin: boolean;
  isEventManager: boolean;
  band: {
    id: number;
    name: string;
  };
  // Nota: Solo se incluyen bandas activas (active: true)
  // La propiedad 'active' se filtra en la consulta
}
```

## Formas de Acceder a la Información

### 1. Decorador @GetUser() - Completo

```typescript
@Get('profile')
@CheckLoginStatus('loggedIn')
getProfile(@GetUser() user: JwtPayload) {
  console.log('User ID:', user.sub);
  console.log('Name:', user.name);
  console.log('Roles:', user.roles);
  console.log('Memberships:', user.memberships);
  console.log('Bands:', user.membersofBands);
  return user;
}
```

### 2. Decorador @GetUser() - Propiedades Específicas

```typescript
@Get('name')
@CheckLoginStatus('loggedIn')
getName(@GetUser('name') userName: string) {
  return { name: userName };
}

@Get('userId')
@CheckLoginStatus('loggedIn')
getUserId(@GetUser('sub') userId: number) {
  return { userId };
}
```

### 3. Decorador @GetUser() - Formato Compatible con Session

```typescript
@Get('legacy')
@CheckLoginStatus('loggedIn')
getLegacyFormat(@GetUser('sessionFormat') session: SessionCompatible) {
  console.log('User ID:', session.userId); // Igual que antes
  console.log('Is Logged:', session.isLoggedIn); // true
  console.log('Roles:', session.roles);
  return session;
}
```

### 4. Request Direct Access

```typescript
@Get('direct')
@CheckLoginStatus('loggedIn')
getProfileDirect(@Req() req: Request) {
  const user = req.user as JwtPayload;
  return {
    id: user.sub,
    name: user.name,
    roles: user.roles
  };
}
```

## Ejemplos de Uso Común

### Verificar si es Admin

```typescript
@Get('admin-check')
@CheckLoginStatus('loggedIn')
checkAdmin(@GetUser() user: JwtPayload) {
  const isAdmin = user.roles.includes(userRoles.admin.id);
  return { isAdmin };
}
```

### Obtener Iglesias del Usuario

```typescript
@Get('churches')
@CheckLoginStatus('loggedIn')
getUserChurches(@GetUser('memberships') memberships: UserMembership[]) {
  return memberships.map(m => ({
    id: m.church.id,
    name: m.church.name,
    roles: m.roles.map(r => r.name)
  }));
}
```

### Obtener Bandas del Usuario

```typescript
@Get('bands')
@CheckLoginStatus('loggedIn')
getUserBands(@GetUser('membersofBands') bands: UserBandMembership[]) {
  // Ya filtradas por active: true en la consulta
  return bands.map(b => ({
    id: b.band.id,
    name: b.band.name,
    role: b.role,
    isAdmin: b.isAdmin,
    isEventManager: b.isEventManager
  }));
}
```

### Verificar Permisos en Banda

```typescript
@Get('band-permissions/:bandId')
@CheckLoginStatus('loggedIn')
checkBandPermissions(
  @GetUser() user: JwtPayload,
  @Param('bandId', ParseIntPipe) bandId: number
) {
  const bandMembership = user.membersofBands.find(b => b.band.id === bandId);
  if (!bandMembership) {
    throw new ForbiddenException('Not a member of this band');
  }

  return {
    canEdit: bandMembership.isAdmin,
    canManageEvents: bandMembership.isEventManager,
    role: bandMembership.role
  };
}
```

## Migración de Código Existente

### Antes (Session)

```typescript
const userId = session.userId;
const userName = session.name;
const isAdmin = session.roles.includes(userRoles.admin.id);
```

### Después (JWT)

```typescript
const userId = user.sub;
const userName = user.name;
const isAdmin = user.roles.includes(userRoles.admin.id);
```

### O usando formato compatible:

```typescript
// Si tienes mucho código que usar session.*, puedes usar:
@GetUser('sessionFormat') session: SessionCompatible

// Y el código existente funciona igual:
const userId = session.userId;
const userName = session.name;
const isAdmin = session.roles.includes(userRoles.admin.id);
```

## Ventajas del Nuevo Sistema

1. **Tipado Completo**: IntelliSense sabe exactamente qué propiedades están disponibles
2. **Sin Consultas BD**: Toda la info está en el token
3. **Más Rápido**: No hay overhead de session store
4. **Escalable**: Funciona con múltiples servidores
5. **Compatible iOS**: Sin problemas de cookies

## Actualización Automática

La información del usuario se actualiza automáticamente cuando:

- El token se renueva (cada 15 minutos)
- El usuario hace login nuevamente
- Se usa el endpoint `/auth/refresh`
