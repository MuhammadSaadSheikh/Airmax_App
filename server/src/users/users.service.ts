import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserDetailResponseDto,
  userDetailSelect,
} from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string) {
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
  }

  async profile(id: string): Promise<UserDetailResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: userDetailSelect,
    });
    return new UserDetailResponseDto(user);
  }
}
