import { applyDecorators } from '@nestjs/common';
import { Length, Matches } from 'class-validator';

/**
 * 密码强度校验规则：
 * - 长度 8-12 位
 * - 只允许字母、数字、下划线
 * - 须包含数字、大写字母、小写字母、下划线中的至少三种
 */
export function IsStrongPassword() {
  return applyDecorators(
    Length(8, 12, { message: '密码长度须为 8-12 位' }),
    Matches(/^[a-zA-Z0-9_]+$/, { message: '密码只能包含字母、数字和下划线' }),
    Matches(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*_)|(?=.*[a-z])(?=.*\d)(?=.*_)|(?=.*[A-Z])(?=.*\d)(?=.*_)/,
      { message: '密码须包含数字、大写字母、小写字母、下划线中的至少三种' },
    ),
  );
}
