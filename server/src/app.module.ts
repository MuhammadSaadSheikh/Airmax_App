import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PackagesModule } from './packages/packages.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { TechniciansModule } from './technicians/technicians.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { MikroTikModule } from './integrations/mikrotik/mikrotik.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.register({ global: true }),
    PrismaModule, RedisModule, AuthModule, UsersModule, PackagesModule, SubscriptionsModule,
    PaymentsModule, ComplaintsModule, TechniciansModule, NotificationsModule,
    ReportsModule, MikroTikModule,
  ],
})
export class AppModule {}
