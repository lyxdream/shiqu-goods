import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipAllThrottlers } from 'src/common/decorators/throttle-scope.decorator';

@ApiTags('系统')
@Controller()
export class AppController {
  @Get('health')
  @SkipAllThrottlers()
  @ApiOperation({ summary: '健康检查' })
  health() {
    return { status: 'ok', service: 'shiqu-server' };
  }
}
