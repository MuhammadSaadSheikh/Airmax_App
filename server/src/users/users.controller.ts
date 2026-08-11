import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  list(@Query('search') search?: string) {
    return this.users.list(search);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.profile(user.sub);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  detail(@Param('id') id: string) {
    return this.users.profile(id);
  }
}
