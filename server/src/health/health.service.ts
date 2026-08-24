import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/http/api-exception';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

type DependencyStatus = 'up' | 'down';

export interface ReadinessResult {
  status: 'ready';
  dependencies: {
    database: DependencyStatus;
    redis: DependencyStatus;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  liveness(): { status: 'alive' } {
    return { status: 'alive' };
  }

  async readiness(): Promise<ReadinessResult> {
    const [database, redis] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);
    const dependencies = {
      database: database.status === 'fulfilled' ? 'up' : 'down',
      redis: redis.status === 'fulfilled' ? 'up' : 'down',
    } satisfies ReadinessResult['dependencies'];

    if (database.status === 'rejected' || redis.status === 'rejected') {
      throw new ApiException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'READINESS_FAILED',
        'One or more infrastructure dependencies are unavailable',
        { dependencies },
      );
    }
    return { status: 'ready', dependencies };
  }
}
