import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { customerWithIdentity } from './dto/customer.dto';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: customerWithIdentity,
    });
  }

  findByUserId(userId: string) {
    return this.prisma.customer.findUnique({
      where: { userId },
      include: customerWithIdentity,
    });
  }

  create(data: Prisma.CustomerCreateInput) {
    return this.prisma.customer.create({
      data,
      include: customerWithIdentity,
    });
  }

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return this.prisma.customer.update({
      where: { id },
      data,
      include: customerWithIdentity,
    });
  }
}
