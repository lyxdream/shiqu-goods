import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities';
import { AdminAuditActionEnum, AdminAuditTargetEnum } from 'src/common/enums';

@Entity('admin_audit_logs')
export class AdminAuditLog extends BaseEntity {
  @Column({ name: 'admin_id' })
  adminId: number;

  @Column({ name: 'admin_username', length: 50 })
  adminUsername: string;

  @Column({ type: 'varchar', length: 50 })
  action: AdminAuditActionEnum;

  @Column({ name: 'target_type', type: 'varchar', length: 50 })
  targetType: AdminAuditTargetEnum;

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({ name: 'target_label', length: 200, default: '' })
  targetLabel: string;

  @Column({ type: 'json', nullable: true })
  detail: Record<string, unknown> | null;
}
