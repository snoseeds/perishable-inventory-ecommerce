import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpiredDisposalBatchRepository } from '../repository/expired-disposal-batch.repository';
import { ExpiredDisposalRepository } from '../repository/expired-disposal.repository';
import { BatchRepository } from '../repository/batch.repository';
import { ItemRepository } from '../repository/item.repository';
import { ItemBatchRepository } from '../repository/item-batch.repository';
import { SalesRepository } from '../repository/sales.repository';
import { SalesBatchRepository } from '../repository/sales-batch.repository';
import { AddItemSellItemController } from './add-item-sell-item.controller';
import { AddItemSellItemService } from './add-item-sell-item.service';
import { DisposalRepository } from '../repository/disposal.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ItemRepository, BatchRepository, ItemBatchRepository, SalesRepository, SalesBatchRepository, DisposalRepository, ExpiredDisposalRepository, ExpiredDisposalBatchRepository])],
  controllers: [AddItemSellItemController],
  providers: [AddItemSellItemService],
  exports: [AddItemSellItemService]
})
export class AddItemSellItemModule {}
