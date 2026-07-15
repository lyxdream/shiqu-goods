import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DefaultThrottled,
  StrictAuth,
  StrictOtp,
} from 'src/common/decorators/throttle-scope.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { JwtUserPayload } from 'src/common/types/jwt-payload';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('C端-认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @StrictAuth()
  @ApiOperation({ summary: '用户注册' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @StrictAuth()
  @ApiOperation({ summary: '用户登录' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password/send-code')
  @HttpCode(HttpStatus.OK)
  @StrictOtp()
  @ApiOperation({ summary: '忘记密码 - 发送验证码（3次/分钟）' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('forgot-password/reset')
  @HttpCode(HttpStatus.OK)
  @StrictAuth()
  @ApiOperation({ summary: '忘记密码 - 验证码校验并重置密码' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @DefaultThrottled()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '退出登录（吊销当前 Token）' })
  logout(@CurrentUser() user: JwtUserPayload) {
    return this.authService.logout(user.sub, user.jti);
  }
}
