import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtOrAdminAuthGuard } from 'src/common/guards/jwt-or-admin-auth.guard';
import { DefaultThrottled } from 'src/common/decorators/throttle-scope.decorator';
import { UploadService } from './upload.service';

@ApiTags('上传')
@ApiBearerAuth()
@UseGuards(JwtOrAdminAuthGuard)
@DefaultThrottled()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    this.uploadService.validateFile(file);
    return {
      url: this.uploadService.buildFileUrl(file.filename),
      filename: file.filename,
    };
  }
}
