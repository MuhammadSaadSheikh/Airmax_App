import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PackageStatus, Prisma } from '@prisma/client';
import {
  CreatePackageDto,
  PackageResponseDto,
  UpdatePackageDto,
} from './dto/package.dto';
import { PackagesRepository } from './packages.repository';

@Injectable()
export class PackagesService {
  constructor(private readonly packages: PackagesRepository) {}

  async createPackage(input: CreatePackageDto): Promise<PackageResponseDto> {
    try {
      return new PackageResponseDto(
        await this.packages.create({
          ...input,
          price: new Prisma.Decimal(input.price),
          features: input.features ?? [],
        }),
      );
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  async getPackageById(id: string): Promise<PackageResponseDto> {
    return new PackageResponseDto(await this.findPackage(id));
  }

  async getPackages(includeInactive = false): Promise<PackageResponseDto[]> {
    return (await this.packages.findMany(includeInactive)).map(
      item => new PackageResponseDto(item),
    );
  }

  async updatePackage(
    id: string,
    input: UpdatePackageDto,
  ): Promise<PackageResponseDto> {
    await this.findPackage(id);
    try {
      return new PackageResponseDto(
        await this.packages.update(id, {
          ...input,
          price:
            input.price === undefined
              ? undefined
              : new Prisma.Decimal(input.price),
        }),
      );
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  activatePackage(id: string) {
    return this.setStatus(id, PackageStatus.ACTIVE);
  }
  deactivatePackage(id: string) {
    return this.setStatus(id, PackageStatus.INACTIVE);
  }

  private async setStatus(
    id: string,
    status: PackageStatus,
  ): Promise<PackageResponseDto> {
    await this.findPackage(id);
    return new PackageResponseDto(await this.packages.update(id, { status }));
  }

  private async findPackage(id: string) {
    const record = await this.packages.findById(id);
    if (!record) throw new NotFoundException('Package not found');
    return record;
  }

  private rethrowUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Package name already exists');
    }
    throw error;
  }
}
