import { Global, Module } from '@nestjs/common'; import { MikroTikService } from './mikrotik.service';
@Global() @Module({providers:[MikroTikService],exports:[MikroTikService]}) export class MikroTikModule {}
