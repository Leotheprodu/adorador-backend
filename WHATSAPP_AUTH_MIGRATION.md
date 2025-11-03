# Migración de Autenticación: Email a WhatsApp

## Resumen de Cambios

Hemos migrado el sistema de autenticación de Adorador de verificación por email a verificación por WhatsApp. Esto elimina la dependencia de servicios SMTP y utiliza WhatsApp como método de verificación principal.

## Cambios Realizados

### 1. Base de Datos (Prisma Schema)

- **Campo `email`**: Cambiado de requerido a opcional en el modelo `Users`
- **Campo `phone`**: Cambiado de opcional a requerido y único
- **Tabla `Temporal_token_pool`**:
  - `userEmail` → `userPhone`
  - Relación actualizada para usar `phone` en lugar de `email`

### 2. Servicios Actualizados

- **TemporalTokenPoolService**: Adaptado para manejar tokens con números de teléfono
- **UsersService**: Métodos actualizados para usar teléfono como identificador principal
- **AuthService**: Login ahora usa número de teléfono

### 3. DTOs y Validaciones

- **CreateUserDto**: `phone` ahora requerido, `email` opcional
- **LoginDto**: Usa `phone` en lugar de `email`
- Validación de formato de teléfono internacional añadida

### 4. Nuevos Endpoints

- `POST /temporal-token-pool/verify-whatsapp`: Endpoint para verificación desde el bot

## Flujo de Registro y Verificación

### 1. Registro de Usuario

```bash
POST /users
{
  "name": "Juan Pérez",
  "phone": "+573001234567",
  "password": "password123",
  "email": "juan@email.com" // opcional
}
```

**Respuesta:**

```json
{
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "phone": "+573001234567",
    "email": "juan@email.com",
    "status": "inactive"
  },
  "verificationToken": "abc123...",
  "whatsappMessage": "Para verificar tu cuenta en Adorador, envía este mensaje a WhatsApp: \"registro-adorador:abc123...\"",
  "message": "Usuario creado. Verificación de WhatsApp requerida."
}
```

### 2. Verificación por WhatsApp

Cuando el usuario envía el mensaje al bot de WhatsApp:

```
registro-adorador:abc123def456...
```

El bot debe extraer el token y hacer la llamada de verificación:

```bash
POST /temporal-token-pool/verify-whatsapp
{
  "token": "abc123def456...",
  "phoneNumber": "+573001234567"
}
```

### 3. Login

```bash
POST /auth/login
{
  "phone": "+573001234567",
  "password": "password123"
}
```

## Implementación en el Bot de WhatsApp

### Handler de Mensajes de Registro

Debes agregar un handler en tu bot que detecte mensajes que empiecen con "registro-adorador:":

```typescript
// En tu bot de WhatsApp
async function handleRegistrationMessage(message: Message) {
  const messageText = message.body;

  // Verificar si es un mensaje de registro
  if (messageText.startsWith('registro-adorador:')) {
    const token = messageText.replace('registro-adorador:', '').trim();
    const phoneNumber = message.from.replace('@c.us', ''); // Formato sin @c.us

    try {
      // Llamar al endpoint de verificación
      const response = await fetch(
        'http://tu-backend-url/temporal-token-pool/verify-whatsapp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            phoneNumber: `+${phoneNumber}`, // Asegurar formato +país+número
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        // Verificación exitosa
        await message.reply(
          '✅ ¡Cuenta verificada exitosamente! Ya puedes usar Adorador.',
        );
      } else {
        // Error en la verificación
        await message.reply(`❌ Error en la verificación: ${result.message}`);
      }
    } catch (error) {
      console.error('Error verifying registration:', error);
      await message.reply('❌ Error técnico. Intenta de nuevo más tarde.');
    }
  }
}

// Agregar este handler a tu sistema de procesamiento de mensajes
```

### Configuración del Bot

1. **Variables de Entorno**: Asegúrate de tener la URL del backend configurada
2. **Permisos**: El bot debe poder recibir mensajes de números no guardados
3. **Rate Limiting**: Considera limitar verificaciones por número para evitar spam

### Ejemplo de Integración Completa

```typescript
// business handler para registro de usuarios
export class AdoradorRegistrationHandler {
  private backendUrl: string;

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
  }

  async handleMessage(message: Message): Promise<boolean> {
    const text = message.body.trim();

    if (text.startsWith('registro-adorador:')) {
      await this.processRegistration(message, text);
      return true; // Mensaje procesado
    }

    return false; // No es un mensaje de registro
  }

  private async processRegistration(message: Message, text: string) {
    const token = text.replace('registro-adorador:', '').trim();

    if (!token) {
      await message.reply('❌ Token de verificación inválido.');
      return;
    }

    // Extraer número de teléfono del remitente
    const phoneNumber = this.formatPhoneNumber(message.from);

    try {
      const response = await this.verifyToken(token, phoneNumber);

      if (response.success) {
        await message.reply(
          '✅ *¡Cuenta verificada exitosamente!*\n\n' +
            'Ya puedes usar Adorador con tu número de WhatsApp.\n' +
            'Para iniciar sesión, ve a la aplicación e ingresa tu número de teléfono y contraseña.',
        );
      } else {
        await message.reply(`❌ ${response.message}`);
      }
    } catch (error) {
      await message.reply(
        '❌ Error técnico durante la verificación.\n' +
          'Intenta de nuevo en unos minutos.',
      );
    }
  }

  private formatPhoneNumber(whatsappId: string): string {
    // Convertir de formato WhatsApp (573001234567@c.us) a formato internacional (+573001234567)
    const number = whatsappId.replace('@c.us', '');
    return `+${number}`;
  }

  private async verifyToken(token: string, phoneNumber: string) {
    const response = await fetch(
      `${this.backendUrl}/temporal-token-pool/verify-whatsapp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, phoneNumber }),
      },
    );

    return await response.json();
  }
}
```

## Notas Importantes

1. **Formato de Números**: Los números deben estar en formato internacional (+país+número)
2. **Tokens Temporales**: Los tokens expiran en 15 minutos
3. **Seguridad**: El endpoint de verificación valida que el número coincida con el token
4. **Status de Usuario**: Los usuarios empiezan con status "inactive" hasta verificar WhatsApp

## Testing

Para probar la implementación:

1. Crear un usuario nuevo
2. Usar el token generado para simular mensaje en WhatsApp
3. Verificar que el usuario quede activo
4. Intentar login con el número de teléfono

## Rollback (Si es Necesario)

Si necesitas volver al sistema anterior:

1. Ejecutar migración reversa en Prisma
2. Revertir cambios en servicios y DTOs
3. Reactivar sistema de email
