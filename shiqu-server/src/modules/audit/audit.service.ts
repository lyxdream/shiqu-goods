import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  AdminAuditActionEnum,
  AdminAuditTargetEnum,
} from 'src/common/enums';
import type { JwtAdminPayload } from 'src/common/types/jwt-payload';
import { fromCents } from 'src/common/utils/money.util';
import { paginate } from 'src/common/utils/paginate.util';
import { Product } from 'src/modules/product/entities/product.entity';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly auditLogRepository: Repository<AdminAuditLog>,
  ) {}

  async findAllForAdmin(query: QueryAuditLogDto) {
    const qb = this.auditLogRepository.createQueryBuilder('log');

    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }
    if (query.targetType) {
      qb.andWhere('log.targetType = :targetType', {
        targetType: query.targetType,
      });
    }
    if (query.adminUsername) {
      qb.andWhere('log.adminUsername LIKE :adminUsername', {
        adminUsername: `%${query.adminUsername}%`,
      });
    }

    qb.orderBy('log.createdAt', 'DESC');
    return paginate(qb, query);
  }

  async recordProductDelete(
    manager: EntityManager,
    admin: JwtAdminPayload,
    product: Product,
  ) {
    const log = manager.create(AdminAuditLog, {
      adminId: admin.sub,
      adminUsername: admin.username,
      action: AdminAuditActionEnum.PRODUCT_DELETE,
      targetType: AdminAuditTargetEnum.PRODUCT,
      targetId: product.id,
      targetLabel: `${product.productNo} ${product.name}`,
      detail: {
        productNo: product.productNo,
        name: product.name,
        price: fromCents(product.price),
        stock: product.stock,
        status: product.status,
      },
    });
    await manager.save(log);
  }
}
