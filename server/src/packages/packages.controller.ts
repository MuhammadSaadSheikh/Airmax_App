import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';
import { PackagesService } from './packages.service';

@Controller('packages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}
  @Get() list(@CurrentUser() actor: AuthUser) {
    return this.packages.getPackages(actor.role === Role.ADMIN);
  }
  @Get(':id') getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.packages.getPackageById(id);
  }
  @Post() @Roles(Role.ADMIN) create(@Body() input: CreatePackageDto) {
    return this.packages.createPackage(input);
  }
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdatePackageDto,
  ) {
    return this.packages.updatePackage(id, input);
  }
  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  activate(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.packages.activatePackage(id);
  }
  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  deactivate(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.packages.deactivatePackage(id);
  }
}
