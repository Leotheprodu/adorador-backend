import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CopySongDto } from './dto/copy-song.dto';
import { PaginationDto } from './dto/pagination.dto';
import {
  FeedResponse,
  PostWithRelations,
  CommentWithAuthor,
  BlessingResponse,
  CopySongResponse,
} from './interfaces/feed.interface';
import { Prisma, PostType, PostStatus } from '@prisma/client';
import { FeedGateway } from './feed.gateway';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => FeedGateway))
    private feedGateway: FeedGateway,
  ) {}

  /**
   * Obtener feed paginado con cursor-based pagination
   */
  async getFeed(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<FeedResponse> {
    const { cursor, limit = 20, type } = paginationDto;

    // Validar límite
    const validLimit = Math.min(Math.max(limit, 1), 50);

    // Construir filtros
    const where: Prisma.PostsWhereInput = {
      status: PostStatus.ACTIVE,
      ...(type !== 'all' && {
        type: type === 'request' ? PostType.SONG_REQUEST : PostType.SONG_SHARE,
      }),
      ...(cursor && { id: { lt: cursor } }), // Posts anteriores al cursor
    };

    // Query optimizado
    const posts = await this.prisma.posts.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true },
        },
        band: {
          select: { id: true, name: true },
        },
        sharedSong: {
          select: {
            id: true,
            bandId: true,
            title: true,
            artist: true,
            key: true,
            tempo: true,
            songType: true,
            youtubeLink: true,
          },
        },
        _count: {
          select: {
            blessings: true,
            comments: true,
            songCopies: true,
          },
        },
        blessings: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: validLimit + 1, // +1 para saber si hay más
    });

    const hasMore = posts.length > validLimit;
    const items = hasMore ? posts.slice(0, -1) : posts;

    // Transformar para agregar flag de blessing
    const transformedItems = items.map((post) => ({
      ...post,
      userBlessing: post.blessings,
    })) as PostWithRelations[];

    return {
      items: transformedItems,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  /**
   * Obtener un post específico por ID
   */
  async getPostById(
    postId: number,
    userId?: number,
  ): Promise<PostWithRelations> {
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, name: true },
        },
        band: {
          select: { id: true, name: true },
        },
        sharedSong: {
          select: {
            id: true,
            bandId: true,
            title: true,
            artist: true,
            key: true,
            tempo: true,
            songType: true,
            youtubeLink: true,
          },
        },
        _count: {
          select: {
            blessings: true,
            comments: true,
            songCopies: true,
          },
        },
        ...(userId && {
          blessings: {
            where: { userId },
            select: { id: true },
            take: 1,
          },
        }),
      },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado`);
    }

    return {
      ...post,
      userBlessing: post.blessings || [],
    } as PostWithRelations;
  }

  /**
   * Crear un nuevo post
   */
  async createPost(
    createPostDto: CreatePostDto,
    userId: number,
  ): Promise<PostWithRelations> {
    const { type, bandId, sharedSongId } = createPostDto;

    // Validar que el usuario es miembro de la banda
    const membership = await this.prisma.membersofBands.findFirst({
      where: { userId, bandId, active: true },
    });

    if (!membership) {
      throw new ForbiddenException(
        'No eres miembro de esta banda o tu membresía no está activa',
      );
    }

    // Validaciones específicas por tipo
    if (type === PostType.SONG_SHARE) {
      if (!sharedSongId) {
        throw new BadRequestException(
          'Para compartir una canción, debes especificar sharedSongId',
        );
      }

      // Verificar que la canción existe y pertenece a la banda
      const song = await this.prisma.songs.findFirst({
        where: { id: sharedSongId, bandId },
      });

      if (!song) {
        throw new NotFoundException(
          'La canción no existe o no pertenece a tu banda',
        );
      }
    }

    if (type === PostType.SONG_REQUEST) {
      if (!createPostDto.requestedSongTitle) {
        throw new BadRequestException(
          'Para solicitar una canción, debes especificar requestedSongTitle',
        );
      }
    }

    // Crear el post
    const post = await this.prisma.posts.create({
      data: {
        ...createPostDto,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
        band: {
          select: { id: true, name: true },
        },
        sharedSong: {
          select: {
            id: true,
            bandId: true,
            title: true,
            artist: true,
            key: true,
            tempo: true,
            songType: true,
          },
        },
        _count: {
          select: {
            blessings: true,
            comments: true,
            songCopies: true,
          },
        },
      },
    });

    this.logger.log(
      `Usuario ${userId} creó post ${post.id} de tipo ${type} en banda ${bandId}`,
    );

    // Emitir evento de nuevo post
    const postWithBlessing = {
      ...post,
      userBlessing: [],
    } as PostWithRelations;
    this.feedGateway.emitNewPost(postWithBlessing);

    return postWithBlessing;
  }

  /**
   * Actualizar un post (solo el autor)
   */
  async updatePost(
    postId: number,
    updatePostDto: UpdatePostDto,
    userId: number,
  ): Promise<PostWithRelations> {
    // Verificar que el post existe y pertenece al usuario
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('Solo el autor puede editar este post');
    }

    // Actualizar
    const updatedPost = await this.prisma.posts.update({
      where: { id: postId },
      data: updatePostDto,
      include: {
        author: {
          select: { id: true, name: true },
        },
        band: {
          select: { id: true, name: true },
        },
        sharedSong: {
          select: {
            id: true,
            bandId: true,
            title: true,
            artist: true,
            key: true,
            tempo: true,
            songType: true,
          },
        },
        _count: {
          select: {
            blessings: true,
            comments: true,
            songCopies: true,
          },
        },
        blessings: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
    });

    this.logger.log(`Usuario ${userId} actualizó post ${postId}`);

    const postWithBlessing = {
      ...updatedPost,
      userBlessing: updatedPost.blessings,
    } as PostWithRelations;

    // Emitir evento de post actualizado
    this.feedGateway.emitPostUpdated(postWithBlessing);

    return postWithBlessing;
  }

  /**
   * Eliminar un post (soft delete)
   */
  async deletePost(postId: number, userId: number): Promise<void> {
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('Solo el autor puede eliminar este post');
    }

    // Soft delete
    await this.prisma.posts.update({
      where: { id: postId },
      data: { status: PostStatus.DELETED },
    });

    this.logger.log(`Usuario ${userId} eliminó post ${postId}`);

    // Emitir evento de post eliminado
    this.feedGateway.emitPostDeleted(postId);
  }

  /**
   * Obtener comentarios de un post
   */
  async getComments(
    postId: number,
    userId?: number,
  ): Promise<CommentWithAuthor[]> {
    // Verificar que el post existe
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado`);
    }

    // Obtener comentarios principales (sin padre)
    const comments = await this.prisma.comments.findMany({
      where: {
        postId,
        parentId: null,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
        sharedSong: {
          select: {
            id: true,
            bandId: true,
            title: true,
            artist: true,
            key: true,
            tempo: true,
            songType: true,
            youtubeLink: true,
          },
        },
        _count: {
          select: {
            blessings: true,
          },
        },
        blessings: userId
          ? {
              where: { userId },
              select: { id: true },
              take: 1,
            }
          : false,
        replies: {
          include: {
            author: {
              select: { id: true, name: true },
            },
            sharedSong: {
              select: {
                id: true,
                bandId: true,
                title: true,
                artist: true,
                key: true,
                tempo: true,
                songType: true,
                youtubeLink: true,
              },
            },
            _count: {
              select: {
                blessings: true,
              },
            },
            blessings: userId
              ? {
                  where: { userId },
                  select: { id: true },
                  take: 1,
                }
              : false,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments as CommentWithAuthor[];
  }

  /**
   * Crear un comentario
   */
  async createComment(
    postId: number,
    createCommentDto: CreateCommentDto,
    userId: number,
  ): Promise<CommentWithAuthor> {
    const { content, parentId, sharedSongId } = createCommentDto;

    // Verificar que el post existe
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado`);
    }

    // Si es una respuesta, verificar que el comentario padre existe
    if (parentId) {
      const parentComment = await this.prisma.comments.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.postId !== postId) {
        throw new BadRequestException('Comentario padre inválido');
      }
    }

    // Si está compartiendo una canción, validar que:
    // 1. La canción existe
    // 2. El usuario pertenece a la banda de esa canción
    if (sharedSongId) {
      const song = await this.prisma.songs.findUnique({
        where: { id: sharedSongId },
        include: {
          band: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      });

      if (!song) {
        throw new NotFoundException(
          `Canción con ID ${sharedSongId} no encontrada`,
        );
      }

      if (song.band.members.length === 0) {
        throw new ForbiddenException(
          'No perteneces a la banda de esta canción',
        );
      }
    }

    // Crear comentario
    const comment = await this.prisma.comments.create({
      data: {
        content,
        postId,
        authorId: userId,
        parentId,
        sharedSongId,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
        sharedSong: sharedSongId
          ? {
              select: {
                id: true,
                title: true,
                artist: true,
                key: true,
                tempo: true,
                songType: true,
              },
            }
          : false,
      },
    });

    this.logger.log(`Usuario ${userId} comentó en post ${postId}`);

    const commentWithAuthor = comment as CommentWithAuthor;

    // Emitir evento de nuevo comentario
    this.feedGateway.emitNewComment(commentWithAuthor);

    return commentWithAuthor;
  }

  /**
   * Toggle blessing (dar o quitar)
   */
  async toggleBlessing(
    postId: number,
    userId: number,
  ): Promise<BlessingResponse> {
    // Verificar que el post existe
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado`);
    }

    // Buscar blessing existente
    const existingBlessing = await this.prisma.blessings.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let blessed: boolean;

    if (existingBlessing) {
      // Quitar blessing
      await this.prisma.blessings.delete({
        where: { id: existingBlessing.id },
      });
      blessed = false;
      this.logger.log(`Usuario ${userId} quitó blessing de post ${postId}`);
    } else {
      // Dar blessing
      await this.prisma.blessings.create({
        data: {
          postId,
          userId,
        },
      });
      blessed = true;
      this.logger.log(`Usuario ${userId} dio blessing a post ${postId}`);
    }

    // Contar blessings actuales
    const count = await this.prisma.blessings.count({
      where: { postId },
    });

    // Emitir evento de blessing (agregado o removido)
    if (blessed) {
      this.feedGateway.emitNewBlessing({ postId, userId, count });
    } else {
      this.feedGateway.emitBlessingRemoved({ postId, userId, count });
    }

    return { blessed, count };
  }

  /**
   * Toggle blessing en comentario (dar o quitar)
   */
  async toggleCommentBlessing(
    commentId: number,
    userId: number,
  ): Promise<BlessingResponse> {
    // Verificar que el comentario existe
    const comment = await this.prisma.comments.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(
        `Comentario con ID ${commentId} no encontrado`,
      );
    }

    // Buscar blessing existente
    const existingBlessing = await this.prisma.commentBlessings.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    let blessed: boolean;

    if (existingBlessing) {
      // Quitar blessing
      await this.prisma.commentBlessings.delete({
        where: { id: existingBlessing.id },
      });
      blessed = false;
      this.logger.log(
        `Usuario ${userId} quitó blessing de comentario ${commentId}`,
      );
    } else {
      // Dar blessing
      await this.prisma.commentBlessings.create({
        data: {
          commentId,
          userId,
        },
      });
      blessed = true;
      this.logger.log(
        `Usuario ${userId} dio blessing a comentario ${commentId}`,
      );
    }

    // Contar blessings actuales
    const count = await this.prisma.commentBlessings.count({
      where: { commentId },
    });

    // Emitir evento de blessing (agregado o removido)
    if (blessed) {
      this.feedGateway.emitNewCommentBlessing({ commentId, userId, count });
    } else {
      this.feedGateway.emitCommentBlessingRemoved({
        commentId,
        userId,
        count,
      });
    }

    return { blessed, count };
  }

  /**
   * Copiar una canción compartida a mi banda
   */
  async copySong(
    postId: number,
    copySongDto: CopySongDto,
    userId: number,
  ): Promise<CopySongResponse> {
    const { targetBandId, newKey, newTempo } = copySongDto;

    // Verificar que el post existe y es de tipo SONG_SHARE
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
      include: {
        sharedSong: {
          include: {
            lyrics: {
              include: {
                structure: true,
                chords: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado`);
    }

    if (post.type !== PostType.SONG_SHARE || !post.sharedSong) {
      throw new BadRequestException(
        'Este post no está compartiendo una canción',
      );
    }

    // Verificar que el usuario es miembro de la banda destino
    const membership = await this.prisma.membersofBands.findFirst({
      where: { userId, bandId: targetBandId, active: true },
    });

    if (!membership) {
      throw new ForbiddenException(
        'No eres miembro de la banda destino o tu membresía no está activa',
      );
    }

    const originalSong = post.sharedSong;

    // Verificar si ya existe una canción con el mismo título en la banda destino
    const existingSong = await this.prisma.songs.findFirst({
      where: {
        title: originalSong.title,
        bandId: targetBandId,
      },
    });

    if (existingSong) {
      throw new BadRequestException(
        'Ya tienes una canción con este título en tu banda',
      );
    }

    // Copiar canción con transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Crear la nueva canción
      const copiedSong = await tx.songs.create({
        data: {
          title: originalSong.title,
          artist: originalSong.artist,
          songType: originalSong.songType,
          youtubeLink: originalSong.youtubeLink,
          key: newKey || originalSong.key,
          tempo: newTempo || originalSong.tempo,
          bandId: targetBandId,
        },
      });

      // 2. Copiar letras y acordes
      for (const lyric of originalSong.lyrics) {
        const copiedLyric = await tx.songs_lyrics.create({
          data: {
            songId: copiedSong.id,
            structureId: lyric.structureId,
            lyrics: lyric.lyrics,
            position: lyric.position,
          },
        });

        // Copiar acordes de esta letra
        for (const chord of lyric.chords) {
          await tx.songs_Chords.create({
            data: {
              lyricId: copiedLyric.id,
              rootNote: chord.rootNote,
              chordQuality: chord.chordQuality,
              slashChord: chord.slashChord,
              position: chord.position,
            },
          });
        }
      }

      // 3. Registrar la copia en SongCopies
      await tx.songCopies.create({
        data: {
          postId,
          originalSongId: originalSong.id,
          copiedSongId: copiedSong.id,
          userId,
          targetBandId,
        },
      });

      return copiedSong;
    });

    this.logger.log(
      `Usuario ${userId} copió canción ${originalSong.id} a banda ${targetBandId} (nueva canción: ${result.id})`,
    );

    // Obtener información del usuario y banda para el evento
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const targetBand = await this.prisma.bands.findUnique({
      where: { id: targetBandId },
      select: { name: true },
    });

    // Contar cuántas veces se ha copiado esta canción del post
    const copiesCount = await this.prisma.songCopies.count({
      where: { postId },
    });

    // Emitir evento de canción copiada
    this.feedGateway.emitSongCopied({
      postId,
      userId,
      userName: user?.name || 'Usuario',
      targetBandName: targetBand?.name || 'Banda',
      count: copiesCount,
    });

    return {
      success: true,
      copiedSong: {
        id: result.id,
        title: result.title,
        bandId: result.bandId,
      },
    };
  }

  /**
   * Copiar canción directamente por songId (desde comentarios)
   */
  async copySongDirect(
    songId: number,
    copySongDto: CopySongDto,
    userId: number,
  ): Promise<CopySongResponse> {
    const { targetBandId, newKey, newTempo } = copySongDto;

    // Verificar que la canción existe y obtener todos sus datos
    const originalSong = await this.prisma.songs.findUnique({
      where: { id: songId },
      include: {
        lyrics: {
          include: {
            structure: true,
            chords: true,
          },
        },
      },
    });

    if (!originalSong) {
      throw new NotFoundException(`Canción con ID ${songId} no encontrada`);
    }

    // Verificar que el usuario es miembro de la banda destino
    const membership = await this.prisma.membersofBands.findFirst({
      where: { userId, bandId: targetBandId, active: true },
    });

    if (!membership) {
      throw new ForbiddenException(
        'No eres miembro de la banda destino o tu membresía no está activa',
      );
    }

    // Verificar si ya existe una canción con el mismo título en la banda destino
    const existingSong = await this.prisma.songs.findFirst({
      where: {
        title: originalSong.title,
        bandId: targetBandId,
      },
    });

    if (existingSong) {
      throw new BadRequestException(
        'Ya tienes una canción con este título en tu banda',
      );
    }

    // Copiar la canción con todas sus letras y acordes en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Crear la canción nueva
      const copiedSong = await tx.songs.create({
        data: {
          title: originalSong.title,
          artist: originalSong.artist,
          songType: originalSong.songType,
          youtubeLink: originalSong.youtubeLink,
          key: newKey || originalSong.key,
          tempo: newTempo || originalSong.tempo,
          bandId: targetBandId,
        },
      });

      // 2. Copiar letras y acordes
      for (const lyric of originalSong.lyrics) {
        const copiedLyric = await tx.songs_lyrics.create({
          data: {
            songId: copiedSong.id,
            structureId: lyric.structureId,
            lyrics: lyric.lyrics,
            position: lyric.position,
          },
        });

        // Copiar acordes de esta letra
        for (const chord of lyric.chords) {
          await tx.songs_Chords.create({
            data: {
              lyricId: copiedLyric.id,
              rootNote: chord.rootNote,
              chordQuality: chord.chordQuality,
              slashChord: chord.slashChord,
              position: chord.position,
            },
          });
        }
      }

      return copiedSong;
    });

    this.logger.log(
      `Usuario ${userId} copió canción ${originalSong.id} a banda ${targetBandId} (nueva canción: ${result.id})`,
    );

    return {
      success: true,
      copiedSong: {
        id: result.id,
        title: result.title,
        bandId: result.bandId,
      },
    };
  }
}
