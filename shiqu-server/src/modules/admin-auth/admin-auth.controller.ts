import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StrictAuth } from 'src/common/decorators/throttle-scope.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@ApiTags('B端-认证')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @StrictAuth()
  @ApiOperation({ summary: '管理员登录' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }
}
