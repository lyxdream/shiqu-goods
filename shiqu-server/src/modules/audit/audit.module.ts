import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditAdminController } from './audit-admin.controller';
import { AuditService } from './audit.service';
import { AdminAuditLog } from './entities/admin-audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAuditLog])],
  controllers: [AuditAdminController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
