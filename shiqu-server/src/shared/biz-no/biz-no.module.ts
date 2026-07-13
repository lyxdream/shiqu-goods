import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BizSequence } from './biz-sequence.entity';
import { BizNoService } from './biz-no.service';

@Module({
  imports: [TypeOrmModule.forFeature([BizSequence])],
  providers: [BizNoService],
  exports: [BizNoService],
})
export class BizNoModule {}
