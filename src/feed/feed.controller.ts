import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { FeedService } from './feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CopySongDto } from './dto/copy-song.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import {
  CheckLoginStatus,
  CheckUserMemberOfBand,
} from '../auth/decorators/permissions.decorators';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtPayload } from '../auth/services/jwt.service';
import { catchHandle } from '../chore/utils/catchHandle';
import {
  ApiGetFeed,
  ApiGetPost,
  ApiCreatePost,
  ApiUpdatePost,
  ApiDeletePost,
  ApiGetComments,
  ApiCreateComment,
  ApiToggleBlessing,
  ApiCopySong,
} from './feed.swagger';

@Controller('feed')
@ApiTags('Feed')
@UseGuards(PermissionsGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @ApiGetFeed()
  @CheckLoginStatus('loggedIn')
  async getFeed(
    @Query() paginationDto: PaginationDto,
    @GetUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      const feed = await this.feedService.getFeed(user.sub, paginationDto);
      res.status(HttpStatus.OK).send(feed);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get('posts/:postId')
  @ApiGetPost()
  async getPost(
    @Param('postId', ParseIntPipe) postId: number,
    @GetUser() user: JwtPayload | undefined,
    @Res() res: Response,
  ) {
    try {
      const post = await this.feedService.getPostById(postId, user?.sub);
      res.status(HttpStatus.OK).send(post);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post('posts')
  @ApiCreatePost()
  @CheckLoginStatus('loggedIn')
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @GetUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      const post = await this.feedService.createPost(createPostDto, user.sub);
      res.status(HttpStatus.CREATED).send(post);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch('posts/:postId')
  @ApiUpdatePost()
  @CheckLoginStatus('loggedIn')
  async updatePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @GetUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      const post = await this.feedService.updatePost(
        postId,
        updatePostDto,
        user.sub,
      );
      res.status(HttpStatus.OK).send(post);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Delete('posts/:postId')
  @ApiDeletePost()
  @CheckLoginStatus('loggedIn')
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @GetUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      await this.feedService.deletePost(postId, user.sub);
      res
        .status(HttpStatus.OK)
        .send({ message: 'Post eliminado exitosamente' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get('posts/:postId/comments')
  @ApiGetComments()
  async getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Res() res: Response,
  ) {
    try {
      const comments = await this.feedService.getComments(postId);
      res.status(HttpStatus.OK).send(comments);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post('posts/:postId/comments')
  @ApiCreateComment()
  @CheckLoginStatus('loggedIn')
  async createComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
    @GetUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      const comment = await this.feedService.createComment(
        postId,
        createCommentDto,
        user.sub,
      );
      res.status(HttpStatus.CREATED).send(comment);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post('posts/:postId/blessings')
  @ApiToggleBlessing()
  @CheckLoginStatus('loggedIn')
  async toggleBlessing(
    @Param('postId', ParseIntPipe) postId: number,
    @GetUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      const result = await this.feedService.toggleBlessing(postId, user.sub);
      res.status(HttpStatus.OK).send(result);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post('posts/:postId/copy-song')
  @ApiCopySong()
  @CheckLoginStatus('loggedIn')
  @CheckUserMemberOfBand({
    checkBy: 'bodyBandId',
    key: 'targetBandId',
  })
  async copySong(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() copySongDto: CopySongDto,
    @GetUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      const result = await this.feedService.copySong(
        postId,
        copySongDto,
        user.sub,
      );
      res.status(HttpStatus.CREATED).send(result);
    } catch (e) {
      catchHandle(e);
    }
  }
}
