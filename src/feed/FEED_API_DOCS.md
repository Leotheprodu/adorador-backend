# 🎯 Feed Social - API Endpoints

## Base URL

```
/feed
```

---

## 📝 Posts

### GET /feed

Obtener feed paginado de posts

**Query Params:**

- `cursor` (opcional): ID del último post visto
- `limit` (opcional): Posts por página (default: 20, max: 50)
- `type` (opcional): `all` | `request` | `share` (default: `all`)

**Auth:** ✅ Requerida

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "type": "SONG_SHARE",
      "status": "ACTIVE",
      "title": "Compartiendo 'Como en el cielo'",
      "description": "Excelente canción para adoración",
      "author": { "id": 1, "name": "Juan Pérez" },
      "band": { "id": 2, "name": "Adoradores del Rey" },
      "sharedSong": {
        "id": 42,
        "title": "Como en el cielo",
        "artist": "Elevation Worship",
        "key": "G",
        "tempo": 120,
        "songType": "worship"
      },
      "_count": {
        "blessings": 15,
        "comments": 8,
        "songCopies": 3
      },
      "userBlessing": [{ "id": 123 }], // Array con 1 elemento si el usuario dio blessing, vacío si no
      "createdAt": "2025-11-11T10:00:00.000Z"
    }
  ],
  "nextCursor": 42,
  "hasMore": true
}
```

---

### GET /feed/posts/:postId

Obtener un post específico

**Auth:** ❌ No requerida (pero retorna info de blessing si está autenticado)

**Response:** Objeto Post individual

---

### POST /feed/posts

Crear un nuevo post

**Auth:** ✅ Requerida

**Body (SONG_SHARE):**

```json
{
  "type": "SONG_SHARE",
  "bandId": 2,
  "title": "Compartiendo 'Reckless Love'",
  "description": "Gran canción para culto de jóvenes",
  "sharedSongId": 45
}
```

**Body (SONG_REQUEST):**

```json
{
  "type": "SONG_REQUEST",
  "bandId": 2,
  "title": "Busco 'Way Maker' de Sinach",
  "description": "La necesito para el domingo",
  "requestedSongTitle": "Way Maker",
  "requestedArtist": "Sinach"
}
```

**Response:** Objeto Post creado

---

### PATCH /feed/posts/:postId

Actualizar un post (solo autor)

**Auth:** ✅ Requerida (+ debe ser el autor)

**Body:**

```json
{
  "title": "Nuevo título",
  "description": "Nueva descripción",
  "status": "RESOLVED"
}
```

---

### DELETE /feed/posts/:postId

Eliminar un post (soft delete, solo autor)

**Auth:** ✅ Requerida (+ debe ser el autor)

**Response:**

```json
{
  "message": "Post eliminado exitosamente"
}
```

---

## 💬 Comentarios

### GET /feed/posts/:postId/comments

Obtener comentarios de un post

**Auth:** ❌ No requerida

**Response:**

```json
[
  {
    "id": 1,
    "content": "Tengo esta canción! Te la comparto",
    "postId": 42,
    "authorId": 5,
    "parentId": null,
    "author": { "id": 5, "name": "María García" },
    "replies": [
      {
        "id": 2,
        "content": "Gracias! Sería de gran ayuda",
        "parentId": 1,
        "author": { "id": 1, "name": "Juan Pérez" }
      }
    ],
    "createdAt": "2025-11-11T11:00:00.000Z"
  }
]
```

---

### POST /feed/posts/:postId/comments

Crear un comentario

**Auth:** ✅ Requerida

**Body:**

```json
{
  "content": "Excelente canción, la tengo en mi banda",
  "parentId": null // Opcional, para respuestas
}
```

**Response:** Objeto Comment creado

---

## 🙏 Blessings

### POST /feed/posts/:postId/blessings

Dar o quitar blessing (toggle)

**Auth:** ✅ Requerida

**Body:** Ninguno

**Response:**

```json
{
  "blessed": true, // true = dio blessing, false = quitó blessing
  "count": 16 // Total de blessings actuales
}
```

---

## 🎵 Copiar Canción

### POST /feed/posts/:postId/copy-song

Copiar una canción compartida a mi banda

**Auth:** ✅ Requerida (+ debe ser miembro de `targetBandId`)

**Body:**

```json
{
  "targetBandId": 3,
  "newKey": "A", // Opcional: cambiar tonalidad
  "newTempo": 130 // Opcional: cambiar tempo
}
```

**Response:**

```json
{
  "success": true,
  "copiedSong": {
    "id": 123,
    "title": "Como en el cielo",
    "bandId": 3
  }
}
```

**Nota:** Copia la canción completa con letras, acordes y estructuras.

---

## 🔐 Autenticación

Todos los endpoints marcados con ✅ requieren:

**Header:**

```
Authorization: Bearer <accessToken>
```

---

## 📊 Códigos de Estado HTTP

- `200` - OK
- `201` - Created
- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (no tienes permisos)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Ejemplos de Uso

### Flujo completo: Compartir y copiar canción

```bash
# 1. Usuario A crea post compartiendo canción
POST /feed/posts
{
  "type": "SONG_SHARE",
  "bandId": 1,
  "title": "Compartiendo 'Reckless Love'",
  "sharedSongId": 42
}

# 2. Usuario B ve el feed
GET /feed?type=share&limit=20

# 3. Usuario B comenta
POST /feed/posts/1/comments
{
  "content": "Me encanta esta canción!"
}

# 4. Usuario C da blessing
POST /feed/posts/1/blessings

# 5. Usuario C copia la canción a su banda
POST /feed/posts/1/copy-song
{
  "targetBandId": 5,
  "newKey": "A"
}
```

---

## ✅ Validaciones Importantes

1. **SONG_SHARE**: Requiere `sharedSongId` y la canción debe pertenecer a tu banda
2. **SONG_REQUEST**: Requiere `requestedSongTitle`
3. **Copy Song**: Solo se puede copiar de posts tipo `SONG_SHARE`
4. **Copy Song**: No puedes tener 2 canciones con el mismo título en una banda
5. **Blessing**: Un usuario solo puede dar 1 blessing por post (toggle)
6. **Edit/Delete Post**: Solo el autor puede editar o eliminar

---

## 🎯 Próximos Pasos

- [ ] Implementar WebSocket Gateway para actualizaciones en tiempo real
- [ ] Frontend con infinite scroll
- [ ] Sistema de notificaciones
- [ ] Tests E2E

---

**Backend listo para usar! 🚀**
