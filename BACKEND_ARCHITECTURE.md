# 🏗️ Backend Architecture Guide

> Guía completa de patrones y mejores prácticas para crear módulos en el backend de Adorador

---

## 🎯 Filosofía Principal

### Separación de Responsabilidades
- **Controladores** → Manejo de peticiones HTTP y respuestas
- **Servicios** → Lógica de negocio y operaciones de base de datos
- **DTOs** → Validación y tipado de datos de entrada
- **Swagger** → Documentación de API
- **Guards** → Autenticación y autorización
- **Interfaces** → Tipos compartidos (WebSocket, respuestas, etc.)

### Regla de Oro
**Cada capa debe tener una responsabilidad clara.** Los controladores orquestan, los servicios ejecutan la lógica.

---

## 📁 Estructura de Módulos

### Patrón Estándar

```
module-name/
├── dto/                          # Data Transfer Objects
│   ├── create-resource.dto.ts    # DTO para creación
│   ├── update-resource.dto.ts    # DTO para actualización
│   └── custom-action.dto.ts      # DTOs para acciones específicas
├── interfaces/                   # TypeScript interfaces
│   └── resource.interface.ts
├── guards/                       # Guards personalizados (opcional)
│   └── custom.guard.ts
├── module.controller.ts          # Controlador REST
├── module.service.ts             # Servicio con lógica de negocio
├── module.swagger.ts             # Decoradores de Swagger
├── module.gateway.ts             # Gateway WebSocket (opcional)
├── module.module.ts              # Módulo de NestJS
└── module.controller.spec.ts     # Tests del controlador
```

### Ejemplo Real: Módulo de Events

```
events/
├── dto/
│   ├── create-event.dto.ts           # ✅ Validación de creación
│   ├── update-event.dto.ts           # ✅ Validación de actualización
│   ├── add-songs-to-event.dto.ts     # ✅ Acción personalizada
│   └── update-songs-to-event.dto.ts  # ✅ Acción personalizada
├── interfaces/
│   └── websocket-messages.interface.ts  # ✅ Tipos WebSocket
├── events.controller.ts           # ✅ 445 líneas - endpoints REST
├── events.service.ts              # ✅ 292 líneas - lógica de negocio
├── events.swagger.ts              # ✅ 245 líneas - documentación
├── events.gateway.ts              # ✅ WebSocket para eventos en tiempo real
├── events.module.ts               # ✅ Configuración del módulo
└── ws.guard.ts                    # ✅ Guard para WebSocket
```

---

## 🎮 Controladores (Controllers)

Los controladores son responsables de:
- Recibir peticiones HTTP
- Validar autenticación/autorización mediante decoradores
- Delegar lógica a servicios
- Manejar errores con try-catch
- Enviar respuestas HTTP con status codes apropiados

### Anatomía de un Controlador

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpException,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ApiCreateEvent } from './events.swagger';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { CheckLoginStatus } from '../auth/decorators/permissions.decorators';
import { catchHandle } from '../chore/utils/catchHandle';

@Controller('bands/:bandId/events')  // ← Ruta base con parámetros
@ApiTags('Events of Bands')          // ← Tag de Swagger
@UseGuards(PermissionsGuard)         // ← Guard global del controlador
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  @ApiCreateEvent()                  // ← Decorador de Swagger personalizado
  @CheckLoginStatus('loggedIn')      // ← Guard específico del endpoint
  @Post()
  async create(
    @Body() createEventDto: CreateEventDto,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const event = await this.eventsService.create(createEventDto, bandId);
      
      // ✅ Validación de resultado
      if (!event) {
        throw new HttpException(
          'Failed to create event',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // ✅ Respuesta con status code apropiado
      res.status(HttpStatus.CREATED).send(event);
    } catch (e) {
      // ✅ Manejo centralizado de errores
      catchHandle(e);
    }
  }
}
```

### Patrón: Try-Catch con catchHandle

**Todos los métodos del controlador deben usar este patrón:**

```typescript
async methodName(...params) {
  try {
    // 1. Llamar al servicio
    const result = await this.service.methodName(...params);
    
    // 2. Validar resultado
    if (!result) {
      throw new HttpException('Error message', HttpStatus.BAD_REQUEST);
    }
    
    // 3. Respuesta exitosa
    res.status(HttpStatus.OK).send(result);
  } catch (e) {
    // 4. Manejo de errores
    catchHandle(e);
  }
}
```

### Patrón: Validaciones de Negocio

Las validaciones de negocio van en el controlador antes de llamar al servicio:

```typescript
@Patch(':id')
async update(
  @Param('id', ParseIntPipe) id: number,
  @Param('bandId', ParseIntPipe) bandId: number,
  @Body() updateEventDto: UpdateEventDto,
  @Res() res: Response,
) {
  try {
    // ✅ Verificar que el recurso exista
    const existingEvent = await this.eventsService.findOne(id, bandId);
    if (!existingEvent) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    // ✅ Validación de regla de negocio
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const eventDate = new Date(existingEvent.date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < currentDate) {
      throw new HttpException(
        'Cannot update past events',
        HttpStatus.BAD_REQUEST,
      );
    }

    // ✅ Ejecutar actualización
    const event = await this.eventsService.update(id, updateEventDto, bandId);
    if (!event) {
      throw new HttpException('Event not updated', HttpStatus.BAD_REQUEST);
    }
    
    res.status(HttpStatus.OK).send(event);
  } catch (e) {
    catchHandle(e);
  }
}
```

### Patrón: Respuestas HTTP

```typescript
// ✅ BIEN: Status code apropiado
res.status(HttpStatus.CREATED).send(event);      // POST - Creación
res.status(HttpStatus.OK).send(events);          // GET - Lectura
res.status(HttpStatus.OK).send(updatedEvent);    // PUT/PATCH - Actualización
res.status(HttpStatus.OK).send({ message: 'Event deleted' });  // DELETE

// ❌ MAL: Sin especificar status code
return event;  // NestJS usará 200 por defecto, no es explícito
```

### Decoradores de Permisos

```typescript
// Verificar que el usuario esté autenticado
@CheckLoginStatus('loggedIn')

// Endpoint público (con o sin autenticación)
@CheckLoginStatus('public')

// Verificar que el usuario sea admin de la banda
@CheckBandAdmin({
  checkBy: 'paramBandId',
  key: 'bandId',
})

// Verificar rol en iglesia
@CheckChurch({
  checkBy: 'paramBandId',
  key: 'bandId',
  churchRolesBypass: [
    churchRoles.worshipLeader.id,
    churchRoles.musician.id,
  ],
})
```

### Obtener Usuario Autenticado

```typescript
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtPayload } from '../auth/services/jwt.service';

@Post()
async create(
  @GetUser() user: JwtPayload,  // ← Usuario del JWT
  @Res() res: Response,
) {
  try {
    const userId = user.sub;
    const userName = user.name;
    // ...
  } catch (e) {
    catchHandle(e);
  }
}
```

---

## 🔧 Servicios (Services)

Los servicios contienen toda la lógica de negocio y operaciones con la base de datos.

### Anatomía de un Servicio

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(createEventDto: CreateEventDto, bandId: number) {
    return this.prisma.events.create({
      data: { ...createEventDto, bandId },
    });
  }

  // READ ALL
  async findAll(bandId: number) {
    return this.prisma.events.findMany({
      where: { bandId },
      orderBy: { date: 'asc' },
      omit: {
        createdAt: true,
        updatedAt: true,
        bandId: true,
      },
      include: {
        _count: {
          select: { songs: true },
        },
      },
    });
  }

  // READ ONE
  async findOne(id: number, bandId: number) {
    return this.prisma.events.findUnique({
      where: { id, bandId },
      select: {
        id: true,
        title: true,
        date: true,
        // ... campos específicos
      },
    });
  }

  // UPDATE
  async update(id: number, updateEventDto: UpdateEventDto, bandId: number) {
    return this.prisma.events.update({
      where: { id, bandId },
      data: updateEventDto,
    });
  }

  // DELETE
  async remove(id: number, bandId: number) {
    return this.prisma.events.delete({
      where: { id, bandId },
    });
  }
}
```

### Patrón: CRUD Básico

Todo servicio debe tener estos métodos base (si aplica):

```typescript
class ResourceService {
  // CREATE
  async create(createDto: CreateDto, ...additionalParams) { }
  
  // READ
  async findAll(...filters) { }
  async findOne(id: number, ...additionalParams) { }
  
  // UPDATE
  async update(id: number, updateDto: UpdateDto, ...additionalParams) { }
  
  // DELETE
  async remove(id: number, ...additionalParams) { }
}
```

### Patrón: Operaciones Complejas

Para operaciones que involucran múltiples pasos:

```typescript
async addSongsToEvent(id: number, addSongsToEventDto: AddSongsToEventDto) {
  const { songDetails } = addSongsToEventDto;

  // ✅ Transformar datos
  const data = songDetails.map(({ songId, order, transpose }) => ({
    eventId: id,
    songId,
    order,
    transpose,
  }));

  // ✅ Operación masiva
  const result = await this.prisma.songsEvents.createMany({
    data,
  });

  return result;
}
```

### Patrón: Operaciones con Promise.all

```typescript
async updateSongsEvent(
  id: number,
  updateSongsEventDto: UpdateSongsEventDto,
): Promise<void> {
  const { songDetails } = updateSongsEventDto;

  const updatePromises = songDetails.map(({ songId, order, transpose }) => {
    const updateData: { order?: number; transpose?: number } = {};
    if (order !== undefined) updateData.order = order;
    if (transpose !== undefined) updateData.transpose = transpose;

    return this.prisma.songsEvents.update({
      where: {
        eventId_songId: { eventId: id, songId },
      },
      data: updateData,
    });
  });

  await Promise.all(updatePromises);
}
```

### Patrón: Selección de Campos

```typescript
// ✅ BIEN: Usar select para campos específicos
async findOne(id: number, bandId: number) {
  return this.prisma.events.findUnique({
    where: { id, bandId },
    select: {
      id: true,
      title: true,
      date: true,
      songs: {
        select: {
          transpose: true,
          order: true,
          song: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
}

// ✅ BIEN: Usar omit para excluir campos
async findAll(bandId: number) {
  return this.prisma.events.findMany({
    where: { bandId },
    omit: {
      createdAt: true,
      updatedAt: true,
    },
  });
}
```

### Naming Conventions

```typescript
// Servicios CRUD
async create(...)      // Crear recurso
async findAll(...)     // Obtener todos
async findOne(...)     // Obtener uno
async update(...)      // Actualizar
async remove(...)      // Eliminar (no usar 'delete', está reservado)

// Servicios personalizados
async addSongsToEvent(...)           // Agregar relación
async deleteSongsFromEvent(...)      // Eliminar relación
async updateSongsEvent(...)          // Actualizar relación
async getEventSongs(...)             // Obtener relación específica
async changeBandEventManager(...)    // Cambiar estado
async getEventManagerByEventId(...)  // Obtener dato específico
```

---

## 📝 DTOs (Data Transfer Objects)

Los DTOs definen la estructura y validación de los datos de entrada.

### Anatomía de un DTO

```typescript
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  date: Date;
}
```

### Validadores Comunes

```typescript
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class ExampleDto {
  // Campos requeridos
  @IsNotEmpty()
  @IsString()
  name: string;

  // Campos opcionales
  @IsOptional()
  @IsString()
  description?: string;

  // Números
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(100)
  age: number;

  // Email
  @IsNotEmpty()
  @IsEmail()
  email: string;

  // Arrays
  @IsNotEmpty()
  @IsArray()
  tags: string[];

  // Enums
  @IsNotEmpty()
  @IsEnum(['admin', 'user', 'guest'])
  role: string;

  // Strings con longitud
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  // Booleanos
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  // URLs
  @IsOptional()
  @IsUrl()
  website?: string;
}
```

### Patrón: Update DTO

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';

// ✅ BIEN: Usar PartialType para hacer todos los campos opcionales
export class UpdateEventDto extends PartialType(CreateEventDto) {}
```

### Patrón: DTOs Complejos

```typescript
import { IsNotEmpty, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO anidado
class SongDetailDto {
  @IsNotEmpty()
  @IsNumber()
  songId: number;

  @IsNotEmpty()
  @IsNumber()
  order: number;

  @IsNumber()
  transpose: number;
}

// DTO principal con array de objetos anidados
export class AddSongsToEventDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SongDetailDto)
  songDetails: SongDetailDto[];
}
```

### Naming Conventions

```typescript
// DTOs CRUD
create-resource.dto.ts    // CreateResourceDto
update-resource.dto.ts    // UpdateResourceDto

// DTOs de acciones personalizadas
add-songs-to-event.dto.ts           // AddSongsToEventDto
remove-songs-from-event.dto.ts      // RemoveSongsFromEventDto
update-songs-event.dto.ts           // UpdateSongsEventDto
```

---

## 📚 Swagger Documentation

La documentación de Swagger se maneja en archivos dedicados con decoradores personalizados.

### Anatomía de Swagger Decorators

```typescript
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiCreateEvent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new event',
      description: 'Create a new event for a specific band. Requires authentication.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiCreatedResponse({
      description: 'Event created successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
    ApiBadRequestResponse({
      description: 'Failed to create event',
    }),
  );
}
```

### Uso en Controlador

```typescript
import { ApiCreateEvent } from './events.swagger';

@Controller('bands/:bandId/events')
@ApiTags('Events of Bands')
export class EventsController {
  @ApiCreateEvent()  // ← Decorador personalizado
  @Post()
  async create(...) { }
}
```

### Decoradores de Swagger Comunes

```typescript
// Operación básica
ApiOperation({
  summary: 'Short description',
  description: 'Long description with details',
})

// Autenticación
ApiBearerAuth()  // Requiere JWT token

// Parámetros
ApiParam({
  name: 'id',
  description: 'Resource ID',
  type: 'number',
  example: 1,
})

// Body
ApiBody({
  type: CreateResourceDto,
  description: 'Resource creation data',
})

// Respuestas exitosas
ApiCreatedResponse({ description: 'Resource created' })      // 201
ApiOkResponse({ description: 'Resource retrieved' })         // 200

// Respuestas de error
ApiUnauthorizedResponse({ description: 'Not authenticated' })  // 401
ApiNotFoundResponse({ description: 'Resource not found' })     // 404
ApiBadRequestResponse({ description: 'Invalid data' })         // 400
```

### Patrón: Response con Ejemplo

```typescript
ApiOkResponse({
  description: 'Event deleted successfully',
  schema: {
    example: {
      message: 'Event deleted',
    },
  },
})
```

### Naming Convention

```typescript
// Archivo: module.swagger.ts
export function ApiCreateResource() { }   // POST
export function ApiGetAllResources() { }  // GET (lista)
export function ApiGetResource() { }      // GET (uno)
export function ApiUpdateResource() { }   // PUT/PATCH
export function ApiDeleteResource() { }   // DELETE

// Acciones personalizadas
export function ApiAddSongsToEvent() { }
export function ApiRemoveSongsFromEvent() { }
export function ApiUpdateEventSongs() { }
```

---

## 🛡️ Manejo de Errores

### catchHandle Utility

El proyecto usa una utilidad centralizada para manejo de errores:

```typescript
// src/chore/utils/catchHandle.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const catchHandle = (e: any) => {
  console.error(e);
  
  // Error de Prisma (database)
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
  } 
  // Error de validación de Prisma
  else if (e instanceof Prisma.PrismaClientValidationError) {
    throw new HttpException('Data Validation Error', HttpStatus.BAD_REQUEST);
  } 
  // Error HTTP de NestJS
  else if (e instanceof HttpException) {
    throw new HttpException(e.getResponse(), e.getStatus());
  } 
  // Error desconocido
  else {
    throw new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};
```

### Patrón de Uso

```typescript
async methodName(...params) {
  try {
    // Lógica del método
  } catch (e) {
    catchHandle(e);  // ← Siempre usar catchHandle
  }
}
```

### HttpException Status Codes

```typescript
import { HttpStatus } from '@nestjs/common';

// Errores de cliente (4xx)
HttpStatus.BAD_REQUEST          // 400 - Datos inválidos
HttpStatus.UNAUTHORIZED         // 401 - No autenticado
HttpStatus.FORBIDDEN            // 403 - No autorizado
HttpStatus.NOT_FOUND            // 404 - Recurso no encontrado
HttpStatus.CONFLICT             // 409 - Conflicto (ej: duplicado)

// Éxito (2xx)
HttpStatus.OK                   // 200 - Éxito general
HttpStatus.CREATED              // 201 - Recurso creado
HttpStatus.NO_CONTENT           // 204 - Éxito sin contenido

// Errores de servidor (5xx)
HttpStatus.INTERNAL_SERVER_ERROR  // 500 - Error interno
```

### Patrón: Throw HTTP Exceptions

```typescript
// ✅ BIEN: Mensajes descriptivos
if (!event) {
  throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
}

if (eventDate < currentDate) {
  throw new HttpException(
    'Cannot update past events',
    HttpStatus.BAD_REQUEST,
  );
}

// ❌ MAL: Mensajes genéricos
if (!event) {
  throw new HttpException('Error', HttpStatus.BAD_REQUEST);
}
```

---

## 🔐 Guards y Decoradores de Autenticación

### Decoradores de Permisos

```typescript
import {
  CheckLoginStatus,
  CheckBandAdmin,
  CheckChurch,
} from '../auth/decorators/permissions.decorators';

// Usuario debe estar autenticado
@CheckLoginStatus('loggedIn')

// Endpoint público (con o sin autenticación)
@CheckLoginStatus('public')

// Usuario debe ser admin de la banda
@CheckBandAdmin({
  checkBy: 'paramBandId',
  key: 'bandId',
})

// Usuario debe pertenecer a la iglesia con roles específicos
@CheckChurch({
  checkBy: 'paramBandId',
  key: 'bandId',
  churchRolesBypass: [
    churchRoles.worshipLeader.id,
    churchRoles.musician.id,
  ],
})
```

### Guard Global

```typescript
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';

@Controller('bands/:bandId/events')
@UseGuards(PermissionsGuard)  // ← Guard aplicado a todo el controlador
export class EventsController { }
```

### Obtener Usuario del Request

```typescript
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtPayload } from '../auth/services/jwt.service';

@Post()
async create(
  @GetUser() user: JwtPayload,
  // ...
) {
  const userId = user.sub;      // ID del usuario
  const userName = user.name;   // Nombre del usuario
  // ...
}
```

---

## 🌐 WebSocket (Gateways)

Para funcionalidad en tiempo real, se usan WebSocket Gateways.

### Estructura Básica

```typescript
gateway/
├── module.gateway.ts       # Gateway WebSocket
└── ws.guard.ts            # Guard para WebSocket
```

### Emitir Eventos desde Controlador

```typescript
import { EventsGateway } from './events.gateway';

@Controller('bands/:bandId/events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventsGateway: EventsGateway,  // ← Inyectar gateway
  ) {}

  @Post(':id/songs')
  async addSongsToEvent(...) {
    try {
      const event = await this.eventsService.addSongsToEvent(...);
      
      // ✅ Notificar cambios en tiempo real
      const eventUpdateEvent = `eventSongsUpdated-${id}`;
      this.eventsGateway.server.emit(eventUpdateEvent, {
        eventId: id,
        bandId: bandId,
        changeType: 'songs_added',
        timestamp: new Date().toISOString(),
        message: 'Se agregaron nuevas canciones al evento',
      });

      res.status(HttpStatus.OK).send(event);
    } catch (e) {
      catchHandle(e);
    }
  }
}
```

### Patrón: Eventos WebSocket

```typescript
// Nombre del evento
const eventName = `eventSongsUpdated-${id}`;
const eventManagerChangeEvent = `eventManagerChanged-${eventId}`;

// Payload del evento
this.gateway.server.emit(eventName, {
  eventId: id,
  bandId: bandId,
  changeType: 'songs_added',  // Tipo de cambio
  timestamp: new Date().toISOString(),
  message: 'Descripción del cambio',
});
```

---

## 🗂️ Interfaces

Las interfaces definen tipos compartidos para WebSocket, respuestas, etc.

```typescript
// interfaces/websocket-messages.interface.ts
export interface EventSongsUpdatedMessage {
  eventId: number;
  bandId: number;
  changeType: 'songs_added' | 'songs_removed' | 'songs_updated';
  timestamp: string;
  message: string;
}
```

---

## 📦 Módulos (Modules)

Cada módulo agrupa controladores, servicios, y providers relacionados.

### Anatomía de un Módulo

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsGateway } from './events.gateway';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, EventsGateway, PrismaService],
  exports: [EventsService],  // Exportar para usar en otros módulos
})
export class EventsModule {}
```

### Patrón: Importar Otros Módulos

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],  // ← Importar módulos necesarios
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
```

---

## 🎯 Mejores Prácticas

### ✅ DO: Estructura Clara

```typescript
// ✅ BIEN: Separación clara de responsabilidades
@Controller('events')
export class EventsController {
  async create(...) {
    try {
      const result = await this.eventsService.create(...);
      if (!result) {
        throw new HttpException('Failed', HttpStatus.BAD_REQUEST);
      }
      res.status(HttpStatus.CREATED).send(result);
    } catch (e) {
      catchHandle(e);
    }
  }
}

// ❌ MAL: Lógica de negocio en el controlador
@Controller('events')
export class EventsController {
  async create(...) {
    const result = await this.prisma.events.create(...);  // ❌
    return result;  // ❌
  }
}
```

### ✅ DO: Validar Antes de Ejecutar

```typescript
// ✅ BIEN: Validaciones claras
const existingEvent = await this.eventsService.findOne(id, bandId);
if (!existingEvent) {
  throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
}

if (eventDate < currentDate) {
  throw new HttpException(
    'Cannot update past events',
    HttpStatus.BAD_REQUEST,
  );
}

// ❌ MAL: Sin validaciones
const event = await this.eventsService.update(...);
```

### ✅ DO: Usar DTOs para Validación

```typescript
// ✅ BIEN: DTO con validaciones
export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;
}

// ❌ MAL: Sin validaciones
export class CreateEventDto {
  title: string;
}
```

### ✅ DO: Documentación Completa en Swagger

```typescript
// ✅ BIEN: Decorador personalizado con toda la info
export function ApiCreateEvent() {
  return applyDecorators(
    ApiOperation({ summary: '...', description: '...' }),
    ApiBearerAuth(),
    ApiParam({ ... }),
    ApiCreatedResponse({ ... }),
    ApiUnauthorizedResponse({ ... }),
  );
}

// ❌ MAL: Sin documentación
@Post()
async create(...) { }
```

### ✅ DO: Status Codes Apropiados

```typescript
// ✅ BIEN
res.status(HttpStatus.CREATED).send(event);      // 201 - POST
res.status(HttpStatus.OK).send(events);          // 200 - GET
res.status(HttpStatus.OK).send(updatedEvent);    // 200 - PUT/PATCH
res.status(HttpStatus.OK).send({ message: 'Event deleted' });  // 200 - DELETE

// ❌ MAL: Siempre 200
return event;
```

### ✅ DO: Manejo Centralizado de Errores

```typescript
// ✅ BIEN
try {
  // ...
} catch (e) {
  catchHandle(e);
}

// ❌ MAL: Manejo manual
try {
  // ...
} catch (e) {
  console.error(e);
  throw new HttpException('Error', 500);
}
```

---

## 📋 Checklist para Nuevo Módulo

Al crear un nuevo módulo, asegúrate de tener:

### Archivos Básicos
- [ ] `module.controller.ts` - Controlador REST
- [ ] `module.service.ts` - Servicio con lógica de negocio
- [ ] `module.swagger.ts` - Decoradores de Swagger
- [ ] `module.module.ts` - Módulo de NestJS
- [ ] `dto/create-module.dto.ts` - DTO de creación
- [ ] `dto/update-module.dto.ts` - DTO de actualización

### Controlador
- [ ] Decorador `@Controller()` con ruta
- [ ] Decorador `@ApiTags()` para Swagger
- [ ] Guard `@UseGuards(PermissionsGuard)`
- [ ] Decoradores de Swagger personalizados en cada endpoint
- [ ] Decoradores de permisos (`@CheckLoginStatus`, etc.)
- [ ] Try-catch con `catchHandle` en cada método
- [ ] Validaciones de negocio antes de llamar servicio
- [ ] Responses con status codes apropiados

### Servicio
- [ ] Decorador `@Injectable()`
- [ ] Inyección de `PrismaService`
- [ ] Métodos CRUD básicos (create, findAll, findOne, update, remove)
- [ ] Métodos personalizados según necesidades
- [ ] Uso de `select` u `omit` para campos específicos

### DTOs
- [ ] Validadores de `class-validator`
- [ ] Update DTO usando `PartialType`
- [ ] DTOs adicionales para acciones personalizadas

### Swagger
- [ ] Decorador personalizado por cada endpoint
- [ ] `ApiOperation` con summary y description
- [ ] `ApiParam` para parámetros de ruta
- [ ] Respuestas apropiadas (Created, Ok, NotFound, etc.)
- [ ] `ApiBearerAuth()` si requiere autenticación

### Tests (OBLIGATORIO)
- [ ] `module.controller.spec.ts` - Tests del controlador
- [ ] `module.service.spec.ts` - Tests del servicio
- [ ] Mocks de dependencias (PrismaService, Gateways, etc.)
- [ ] Tests para todos los métodos CRUD
- [ ] Tests para validaciones y casos de error
- [ ] Coverage mínimo del 80%

---

## 🧪 Testing

Testing es una parte **OBLIGATORIA** del desarrollo. Todo módulo debe tener tests completos antes de considerarse terminado.

### Filosofía de Testing

- **Unit Tests**: Testear cada capa de forma aislada
- **Mocking**: Mockear dependencias externas (Prisma, Gateways)
- **Coverage**: Mínimo 80% de cobertura de código
- **Casos de Prueba**: Happy path + casos de error

### Estructura de Archivos de Test

```
module/
├── module.controller.spec.ts    # Tests del controlador
├── module.service.spec.ts       # Tests del servicio
└── module.gateway.spec.ts       # Tests del gateway (si aplica)
```

---

## 🧪 Testing de Servicios

Los tests de servicios verifican la lógica de negocio y las interacciones con la base de datos.

### Anatomía de un Test de Servicio

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from './events.gateway';

describe('EventsService', () => {
  let service: EventsService;
  let prismaService: any;

  // ✅ Mock data
  const mockEvent = {
    id: 1,
    title: 'Test Event',
    date: new Date('2025-12-31'),
    bandId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    songs: [],
    _count: { songs: 0 },
  };

  // ✅ Mock de PrismaService
  const mockPrismaService = {
    events: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    songsEvents: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
  };

  // ✅ Mock de Gateway (si se usa)
  const mockEventsGateway = {
    emitEventUpdate: jest.fn(),
    emitEventCreated: jest.fn(),
    emitEventDeleted: jest.fn(),
  };

  beforeEach(async () => {
    // ✅ Limpiar mocks antes de cada test
    jest.clearAllMocks();

    // ✅ Crear módulo de testing
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ✅ Test CREATE
  describe('create', () => {
    it('should create an event', async () => {
      const createEventDto = {
        title: 'Test Event',
        date: new Date('2025-12-31'),
      };
      const bandId = 1;

      prismaService.events.create.mockResolvedValue(mockEvent);

      const result = await service.create(createEventDto, bandId);

      expect(result).toEqual(mockEvent);
      expect(prismaService.events.create).toHaveBeenCalledWith({
        data: { ...createEventDto, bandId },
      });
    });
  });

  // ✅ Test READ ALL
  describe('findAll', () => {
    it('should return all events for a band', async () => {
      const bandId = 1;
      const mockEvents = [mockEvent];

      prismaService.events.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll(bandId);

      expect(result).toEqual(mockEvents);
      expect(prismaService.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bandId },
        }),
      );
    });
  });

  // ✅ Test READ ONE
  describe('findOne', () => {
    it('should return an event by id and bandId', async () => {
      const eventId = 1;
      const bandId = 1;

      prismaService.events.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne(eventId, bandId);

      expect(result).toEqual(mockEvent);
      expect(prismaService.events.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: eventId, bandId },
        }),
      );
    });
  });

  // ✅ Test UPDATE
  describe('update', () => {
    it('should update an event', async () => {
      const eventId = 1;
      const bandId = 1;
      const updateEventDto = {
        title: 'Updated Event',
      };

      const updatedEvent = { ...mockEvent, title: 'Updated Event' };
      prismaService.events.update.mockResolvedValue(updatedEvent);

      const result = await service.update(eventId, updateEventDto, bandId);

      expect(result).toEqual(updatedEvent);
      expect(prismaService.events.update).toHaveBeenCalledWith({
        where: { id: eventId, bandId },
        data: updateEventDto,
      });
    });
  });

  // ✅ Test DELETE
  describe('remove', () => {
    it('should delete an event', async () => {
      const eventId = 1;
      const bandId = 1;

      prismaService.events.delete.mockResolvedValue(mockEvent);

      const result = await service.remove(eventId, bandId);

      expect(result).toEqual(mockEvent);
      expect(prismaService.events.delete).toHaveBeenCalledWith({
        where: { id: eventId, bandId },
      });
    });
  });

  // ✅ Test de método personalizado
  describe('addSongsToEvent', () => {
    it('should add songs to an event', async () => {
      const eventId = 1;
      const addSongsToEventDto = {
        songDetails: [
          { songId: 1, order: 1, transpose: 0 },
          { songId: 2, order: 2, transpose: 2 },
        ],
      };

      prismaService.songsEvents.createMany.mockResolvedValue({ count: 2 });

      const result = await service.addSongsToEvent(eventId, addSongsToEventDto);

      expect(result).toEqual({ count: 2 });
      expect(prismaService.songsEvents.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              eventId,
              songId: 1,
              order: 1,
              transpose: 0,
            }),
            expect.objectContaining({
              eventId,
              songId: 2,
              order: 2,
              transpose: 2,
            }),
          ]),
        }),
      );
    });
  });
});
```

### Patrón: Mock de PrismaService

```typescript
// ✅ BIEN: Mock completo con todos los métodos necesarios
const mockPrismaService = {
  resource: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
};

// Uso en el test
beforeEach(async () => {
  jest.clearAllMocks();
  
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ResourceService,
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
    ],
  }).compile();

  service = module.get<ResourceService>(ResourceService);
});
```

### Patrón: Test de Casos de Error

```typescript
describe('findOne', () => {
  it('should return null if event not found', async () => {
    const eventId = 999;
    const bandId = 1;

    prismaService.events.findUnique.mockResolvedValue(null);

    const result = await service.findOne(eventId, bandId);

    expect(result).toBeNull();
  });

  it('should throw error on database failure', async () => {
    const eventId = 1;
    const bandId = 1;

    prismaService.events.findUnique.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(service.findOne(eventId, bandId)).rejects.toThrow(
      'Database error',
    );
  });
});
```

---

## 🧪 Testing de Controladores

Los tests de controladores verifican que los endpoints manejen correctamente las peticiones y respuestas.

### Anatomía de un Test de Controlador

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let service: EventsService;

  // ✅ Mock del servicio
  const mockEventsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addSongsToEvent: jest.fn(),
    deleteSongsFromEvent: jest.fn(),
    updateSongsEvent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('EventsService should be defined', () => {
    expect(service).toBeDefined();
  });

  // ✅ Test de métodos del servicio
  describe('Service Methods', () => {
    it('should have create method', () => {
      expect(service.create).toBeDefined();
    });

    it('should have findAll method', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should have findOne method', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should have update method', () => {
      expect(service.update).toBeDefined();
    });

    it('should have remove method', () => {
      expect(service.remove).toBeDefined();
    });

    it('should have addSongsToEvent method', () => {
      expect(service.addSongsToEvent).toBeDefined();
    });

    it('should have deleteSongsFromEvent method', () => {
      expect(service.deleteSongsFromEvent).toBeDefined();
    });

    it('should have updateSongsEvent method', () => {
      expect(service.updateSongsEvent).toBeDefined();
    });
  });
});
```

### Patrón: Test con Response Mock

Para testear controladores que usan `@Res()`, necesitas mockear el objeto Response:

```typescript
import { Response } from 'express';

describe('EventsController - HTTP Responses', () => {
  let controller: EventsController;
  let service: EventsService;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    // ✅ Mock del Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  describe('create', () => {
    it('should create an event and return 201', async () => {
      const createDto = { title: 'Test', date: new Date() };
      const mockEvent = { id: 1, ...createDto };
      
      mockEventsService.create.mockResolvedValue(mockEvent);

      await controller.create(
        createDto,
        mockResponse as Response,
        1,
        { sub: 1, name: 'Test User' } as JwtPayload,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.send).toHaveBeenCalledWith(mockEvent);
    });

    it('should return 400 if creation fails', async () => {
      const createDto = { title: 'Test', date: new Date() };
      
      mockEventsService.create.mockResolvedValue(null);

      await expect(
        controller.create(
          createDto,
          mockResponse as Response,
          1,
          { sub: 1, name: 'Test User' } as JwtPayload,
        ),
      ).rejects.toThrow(HttpException);
    });
  });
});
```

---

## 🧪 Matchers Útiles de Jest

```typescript
// Igualdad
expect(value).toBe(3);                    // Igualdad estricta (===)
expect(value).toEqual({ a: 1 });          // Igualdad profunda
expect(value).not.toBe(null);             // Negación

// Truthy/Falsy
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Números
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3.5);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3);           // Para floats

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array).toEqual(expect.arrayContaining([1, 2]));

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ a: 1 });
expect(obj).toEqual(expect.objectContaining({ a: 1 }));

// Funciones
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenLastCalledWith(arg1);

// Promesas
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(Error);

// Excepciones
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('error message');
```

---

## 🧪 Patrones de Testing

### Patrón: AAA (Arrange, Act, Assert)

```typescript
it('should create an event', async () => {
  // ✅ ARRANGE: Preparar datos y mocks
  const createEventDto = {
    title: 'Test Event',
    date: new Date('2025-12-31'),
  };
  const bandId = 1;
  const mockEvent = { id: 1, ...createEventDto, bandId };
  
  prismaService.events.create.mockResolvedValue(mockEvent);

  // ✅ ACT: Ejecutar la función a testear
  const result = await service.create(createEventDto, bandId);

  // ✅ ASSERT: Verificar resultados
  expect(result).toEqual(mockEvent);
  expect(prismaService.events.create).toHaveBeenCalledWith({
    data: { ...createEventDto, bandId },
  });
});
```

### Patrón: Describir Contextos

```typescript
describe('EventsService', () => {
  describe('create', () => {
    it('should create an event successfully', async () => {
      // Happy path
    });

    it('should throw error if data is invalid', async () => {
      // Error case
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      // Happy path
    });

    it('should return empty array if no events', async () => {
      // Edge case
    });
  });
});
```

### Patrón: Test de Validaciones

```typescript
describe('update', () => {
  it('should update event if valid', async () => {
    // Test del happy path
  });

  it('should throw NOT_FOUND if event does not exist', async () => {
    prismaService.events.findUnique.mockResolvedValue(null);

    await expect(
      service.update(999, updateDto, 1),
    ).rejects.toThrow('Event not found');
  });

  it('should throw BAD_REQUEST if event is in the past', async () => {
    const pastEvent = {
      ...mockEvent,
      date: new Date('2020-01-01'),
    };
    
    prismaService.events.findUnique.mockResolvedValue(pastEvent);

    await expect(
      service.update(1, updateDto, 1),
    ).rejects.toThrow('Cannot update past events');
  });
});
```

---

## 🧪 Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:cov

# Ejecutar tests de un archivo específico
npm test events.service.spec.ts

# Ejecutar tests que coincidan con un patrón
npm test -- --testNamePattern="create"
```

---

## 🧪 Coverage Requirements

### Mínimos Requeridos

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Ver Coverage

```bash
npm run test:cov
```

Esto genera un reporte en `coverage/lcov-report/index.html` que puedes abrir en el navegador.

### Excluir Archivos del Coverage

```json
// jest.config.js o package.json
{
  "jest": {
    "coveragePathIgnorePatterns": [
      "/node_modules/",
      "/dist/",
      ".module.ts$",
      ".interface.ts$"
    ]
  }
}
```

---

## 🧪 Mejores Prácticas de Testing

### ✅ DO: Nombres Descriptivos

```typescript
// ✅ BIEN: Nombre claro y descriptivo
it('should return 404 when event does not exist', async () => {
  // ...
});

// ❌ MAL: Nombre vago
it('should work', async () => {
  // ...
});
```

### ✅ DO: Test Aislados

```typescript
// ✅ BIEN: Cada test es independiente
beforeEach(() => {
  jest.clearAllMocks();
});

it('test 1', () => {
  // No depende de otros tests
});

it('test 2', () => {
  // No depende de otros tests
});
```

### ✅ DO: Mock Datos Realistas

```typescript
// ✅ BIEN: Datos que reflejan la realidad
const mockEvent = {
  id: 1,
  title: 'Sunday Worship Service',
  date: new Date('2025-12-31'),
  bandId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ❌ MAL: Datos mínimos o irreales
const mockEvent = { id: 1 };
```

### ✅ DO: Test Edge Cases

```typescript
describe('findAll', () => {
  it('should return all events', async () => {
    // Happy path
  });

  it('should return empty array when no events exist', async () => {
    // Edge case
  });

  it('should handle pagination correctly', async () => {
    // Edge case
  });
});
```

### ✅ DO: Verificar Llamadas a Mocks

```typescript
it('should call prisma.create with correct data', async () => {
  await service.create(createDto, bandId);

  expect(prismaService.events.create).toHaveBeenCalledWith({
    data: { ...createDto, bandId },
  });
  expect(prismaService.events.create).toHaveBeenCalledTimes(1);
});
```

---

## 🚀 Ejemplo Completo: Crear Módulo "Tasks"

### 1. Crear DTO

```typescript
// dto/create-task.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
```

```typescript
// dto/update-task.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
```

### 2. Crear Servicio

```typescript
// tasks.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, userId: number) {
    return this.prisma.task.create({
      data: { ...createTaskDto, userId },
    });
  }

  async findAll(userId: number) {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    return this.prisma.task.findUnique({
      where: { id, userId },
    });
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number) {
    return this.prisma.task.update({
      where: { id, userId },
      data: updateTaskDto,
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.task.delete({
      where: { id, userId },
    });
  }
}
```

### 3. Crear Swagger Decorators

```typescript
// tasks.swagger.ts
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiCreateTask() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new task',
      description: 'Create a new task for the authenticated user.',
    }),
    ApiBearerAuth(),
    ApiCreatedResponse({ description: 'Task created successfully' }),
    ApiUnauthorizedResponse({ description: 'User is not authenticated' }),
  );
}

export function ApiGetAllTasks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all tasks',
      description: 'Retrieve all tasks for the authenticated user.',
    }),
    ApiBearerAuth(),
    ApiOkResponse({ description: 'Tasks retrieved successfully' }),
    ApiUnauthorizedResponse({ description: 'User is not authenticated' }),
  );
}

export function ApiGetTask() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get task by ID',
      description: 'Retrieve a specific task by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiOkResponse({ description: 'Task retrieved successfully' }),
    ApiNotFoundResponse({ description: 'Task not found' }),
    ApiUnauthorizedResponse({ description: 'User is not authenticated' }),
  );
}

export function ApiUpdateTask() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update task',
      description: 'Update a task by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiOkResponse({ description: 'Task updated successfully' }),
    ApiNotFoundResponse({ description: 'Task not found' }),
    ApiUnauthorizedResponse({ description: 'User is not authenticated' }),
  );
}

export function ApiDeleteTask() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete task',
      description: 'Delete a task by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiOkResponse({ description: 'Task deleted successfully' }),
    ApiNotFoundResponse({ description: 'Task not found' }),
    ApiUnauthorizedResponse({ description: 'User is not authenticated' }),
  );
}
```

### 4. Crear Controlador

```typescript
// tasks.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpException,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  ApiCreateTask,
  ApiGetAllTasks,
  ApiGetTask,
  ApiUpdateTask,
  ApiDeleteTask,
} from './tasks.swagger';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { CheckLoginStatus } from '../auth/decorators/permissions.decorators';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtPayload } from '../auth/services/jwt.service';
import { catchHandle } from '../chore/utils/catchHandle';

@Controller('tasks')
@ApiTags('Tasks')
@UseGuards(PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiCreateTask()
  @CheckLoginStatus('loggedIn')
  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Res() res: Response,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const task = await this.tasksService.create(createTaskDto, user.sub);
      if (!task) {
        throw new HttpException('Failed to create task', HttpStatus.BAD_REQUEST);
      }
      res.status(HttpStatus.CREATED).send(task);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetAllTasks()
  @CheckLoginStatus('loggedIn')
  @Get()
  async findAll(@Res() res: Response, @GetUser() user: JwtPayload) {
    try {
      const tasks = await this.tasksService.findAll(user.sub);
      res.status(HttpStatus.OK).send(tasks);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetTask()
  @CheckLoginStatus('loggedIn')
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const task = await this.tasksService.findOne(id, user.sub);
      if (!task) {
        throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(task);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiUpdateTask()
  @CheckLoginStatus('loggedIn')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Res() res: Response,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const existingTask = await this.tasksService.findOne(id, user.sub);
      if (!existingTask) {
        throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
      }

      const task = await this.tasksService.update(id, updateTaskDto, user.sub);
      if (!task) {
        throw new HttpException('Task not updated', HttpStatus.BAD_REQUEST);
      }
      res.status(HttpStatus.OK).send(task);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiDeleteTask()
  @CheckLoginStatus('loggedIn')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const task = await this.tasksService.remove(id, user.sub);
      if (!task) {
        throw new HttpException('Task not deleted', HttpStatus.BAD_REQUEST);
      }
      res.status(HttpStatus.OK).send({ message: 'Task deleted' });
    } catch (e) {
      catchHandle(e);
    }
  }
}
```

### 5. Crear Módulo

```typescript
// tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, PrismaService],
  exports: [TasksService],
})
export class TasksModule {}
```

---

## 📊 Comparación Frontend vs Backend

| Aspecto | Frontend | Backend |
|---------|----------|---------|
| **Capas** | Hooks, Components, Services | Controllers, Services, DTOs |
| **Lógica** | Custom Hooks | Services |
| **UI** | Componentes React | Respuestas HTTP |
| **Validación** | Zod, React Hook Form | class-validator (DTOs) |
| **Datos** | TanStack Query | Prisma ORM |
| **Documentación** | Comentarios, Storybook | Swagger |
| **Errores** | try-catch, toast | catchHandle, HttpException |
| **Tiempo Real** | WebSocket Client | WebSocket Gateway |

---

¡Este documento debe servir como guía completa para desarrollar módulos en el backend manteniendo la consistencia y las mejores prácticas del proyecto! 🚀
