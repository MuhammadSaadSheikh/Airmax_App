import { Injectable } from '@nestjs/common';
import { PackageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(data: Prisma.PackageCreateInput) {
    return this.prisma.package.create({ data });
  }
  findById(id: string) {
    return this.prisma.package.findUnique({ where: { id } });
  }
  findMany(includeInactive: boolean) {
    return this.prisma.package.findMany({
      where: includeInactive ? undefined : { status: PackageStatus.ACTIVE },
      orderBy: [{ speedMbps: 'asc' }, { name: 'asc' }],
    });
  }
  update(id: string, data: Prisma.PackageUpdateInput) {
    return this.prisma.package.update({ where: { id }, data });
  }
}
