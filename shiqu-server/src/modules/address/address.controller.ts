import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUserPayload } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('C端-收货地址')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: '地址列表' })
  findAll(@CurrentUser() user: JwtUserPayload) {
    return this.addressService.findAll(user.sub);
  }

  @Post()
  @ApiOperation({ summary: '新增地址' })
  create(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressService.create(user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑地址' })
  update(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除地址' })
  remove(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressService.remove(user.sub, id);
  }
}
