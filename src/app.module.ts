import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configService } from './config/config.service';
import { AddItemSellItemModule } from './add-item-sell-item/add-item-sell-item.module';
import { CreateItemIfNotExistMiddleware } from './middlewares/create-item-if-not-exist.middleware';
import { CreateBatchIfNotExistMiddleware } from './middlewares/create-batch-if-not-exist.middleware';
import { GetTotalUnexpiredItemQuantitiesMiddleware } from './middlewares/get-total-unexpired-item-quantities.middleware';
import { CheckIfBatchMeetsItemMinimumExpiryMiddleware } from './middlewares/check-if-batch-meets-item-minimum-expiry.middleware';
import { UpdateOrCreateItemBatchIfNotExistMiddleware } from './middlewares/update-or-create-item-batch-if-not-exist.middleware';
import { ValidateAddItemRequestDtoMiddleware } from './middlewares/validate-add-item-request-dto.middleware';
import { ValidateSellItemRequestDtoMiddleware } from './middlewares/validate-sell-item-request-dto.middleware';
import { RetrieveItemIfExistsMiddleware } from './middlewares/retrieve-item-if-exists.middleware';
import { ExpiredDisposalRepository } from './repository/expired-disposal.repository';
import { ExpiredDisposalBatchRepository } from './repository/expired-disposal-batch.repository';
import { BatchRepository } from './repository/batch.repository';
import { ItemRepository } from './repository/item.repository';
import { SalesBatchRepository } from './repository/sales-batch.repository';
import { ItemBatchRepository } from './repository/item-batch.repository';
import { SalesRepository } from './repository/sales.repository';
import { DisposalRepository } from './repository/disposal.repository';



@Module({
  imports: [
    TypeOrmModule.forFeature([BatchRepository, ItemRepository, ItemBatchRepository, SalesRepository, SalesBatchRepository, DisposalRepository, ExpiredDisposalRepository, ExpiredDisposalBatchRepository]),
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    ScheduleModule.forRoot(),
    AddItemSellItemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
    /***  AddItemSellItemController Methods Start ****/
    configure(consumer: MiddlewareConsumer) {
      consumer
        .apply(ValidateAddItemRequestDtoMiddleware, CreateItemIfNotExistMiddleware, CheckIfBatchMeetsItemMinimumExpiryMiddleware, CreateBatchIfNotExistMiddleware, UpdateOrCreateItemBatchIfNotExistMiddleware, GetTotalUnexpiredItemQuantitiesMiddleware)
        .forRoutes({ path: ':item/add', method: RequestMethod.POST });
        
      consumer
        .apply(ValidateSellItemRequestDtoMiddleware, RetrieveItemIfExistsMiddleware)
        .forRoutes({ path: ':item/sell', method: RequestMethod.POST });

              
      consumer
        .apply(RetrieveItemIfExistsMiddleware, GetTotalUnexpiredItemQuantitiesMiddleware)
        .forRoutes({ path: ':item/quantity', method: RequestMethod.GET });
    }
    /***  AddItemSellItemController Methods End ****/
}