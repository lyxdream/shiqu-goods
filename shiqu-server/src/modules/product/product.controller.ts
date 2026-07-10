import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';

@ApiTags('C端-商品')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: '商品列表' })
  findAll() {
    return this.productService.findAllForCustomer();
  }

  @Get(':id')
  @ApiOperation({ summary: '商品详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOneForCustomer(id);
  }
}
