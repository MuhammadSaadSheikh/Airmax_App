import { BillingPeriod, PackageStatus, Prisma } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePackageDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsInt() @Min(1) @Max(100_000) speedMbps!: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) price!: number;
  @IsEnum(BillingPeriod) billingPeriod!: BillingPeriod;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  features?: string[];
}

export class UpdatePackageDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100_000) speedMbps?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) price?: number;
  @IsOptional() @IsEnum(BillingPeriod) billingPeriod?: BillingPeriod;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  features?: string[];
}

export type PackageRecord = Prisma.PackageGetPayload<Record<string, never>>;

export class PackageResponseDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly speedMbps: number;
  readonly price: string;
  readonly billingPeriod: BillingPeriod;
  readonly features: string[];
  readonly status: PackageStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(record: PackageRecord) {
    this.id = record.id;
    this.name = record.name;
    this.description = record.description;
    this.speedMbps = record.speedMbps;
    this.price = record.price.toString();
    this.billingPeriod = record.billingPeriod;
    this.features = record.features;
    this.status = record.status;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }
}
