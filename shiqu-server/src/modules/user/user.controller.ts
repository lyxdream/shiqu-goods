import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { JwtUserPayload } from 'src/common/decorators/current-user.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@ApiTags('C端-用户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: '获取个人信息' })
  getProfile(@CurrentUser() user: JwtUserPayload) {
    return this.userService.getProfile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: '修改个人信息' })
  updateProfile(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.sub, dto);
  }

  @Put('password')
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: '修改登录密码' })
  updatePassword(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(user.sub, dto);
  }
}
