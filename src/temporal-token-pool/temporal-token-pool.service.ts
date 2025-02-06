import { HttpException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';

interface TokenInfo {
  token: string;
  email: string;
  type: string;
  date: Date;
}

@Injectable()
export class TemporalTokenPoolService implements OnModuleInit {
  private globalTokens: Set<TokenInfo> = new Set();

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.cleanUpTokens();
  }

  @Cron('0 0 * * * *', { name: crypto.randomUUID() }) // Ejecuta cada 24 horas
  async cleanUpTokens() {
    const now = new Date();
    const tokensToDelete: TokenInfo[] = [];

    this.globalTokens.forEach((tokenInfo) => {
      const tokenAge =
        (now.getTime() - tokenInfo.date.getTime()) / (1000 * 60 * 60);
      if (tokenAge > 24) {
        tokensToDelete.push(tokenInfo);
      }
    });

    for (const tokenInfo of tokensToDelete) {
      this.globalTokens.delete(tokenInfo);
      await this.prisma.temporal_token_pool.delete({
        where: { token: tokenInfo.token },
      });
    }
  }

  async createToken(token: string, userEmail: string, type: string) {
    if (type === 'forgot_password') {
      this.globalTokens.forEach((tokenInfo) => {
        if (tokenInfo.email === userEmail) {
          throw new HttpException('User already trying to reset password', 400);
        }
      });

      this.globalTokens.add({
        token,
        email: userEmail,
        type,
        date: new Date(),
      });
    }
    return await this.prisma.temporal_token_pool.create({
      data: { token, userEmail, type },
    });
  }

  async findToken(token: string) {
    return await this.prisma.temporal_token_pool.findUnique({
      where: { token },
    });
  }

  async deleteToken(token: string) {
    return await this.prisma.temporal_token_pool.delete({
      where: { token },
    });
  }
}
