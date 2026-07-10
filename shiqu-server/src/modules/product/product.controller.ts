import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { ProductService } from './product.service';

@ApiTags('C端-商品')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '商品列表' })
  findAll() {
    return this.productService.findAllForCustomer();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '商品详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOneForCustomer(id);
  }
}
