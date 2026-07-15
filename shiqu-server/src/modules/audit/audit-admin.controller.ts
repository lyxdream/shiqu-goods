import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from 'src/common/guards/admin-jwt-auth.guard';
import { DefaultThrottled } from 'src/common/decorators/throttle-scope.decorator';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@ApiTags('B端-操作日志')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@DefaultThrottled()
@Controller('admin/audit-logs')
export class AuditAdminController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: '操作日志列表' })
  findAll(@Query() query: QueryAuditLogDto) {
    return this.auditService.findAllForAdmin(query);
  }
}
