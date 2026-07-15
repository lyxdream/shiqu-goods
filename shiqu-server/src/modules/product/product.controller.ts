import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DefaultThrottled } from 'src/common/decorators/throttle-scope.decorator';
import { PagingDto } from 'src/common/dto';
import { ProductService } from './product.service';

@ApiTags('C端-商品')
@DefaultThrottled()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: '商品列表（分页）' })
  findAll(@Query() query: PagingDto) {
    return this.productService.findAllForCustomer(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '商品详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOneForCustomer(id);
  }
}
