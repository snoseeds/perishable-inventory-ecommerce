import { Injectable, NestMiddleware, Res, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { BatchRepository } from '../repository/batch.repository';
import { Batch } from '../domain/model/batch.entity';
import { ItemBatchRepository } from '../repository/item-batch.repository';
import { ItemBatch } from '../domain/model/item-batch.entity';
  
@Injectable()
export class GetTotalUnexpiredItemQuantitiesMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(ItemBatchRepository) private readonly itemBatchRepo: ItemBatchRepository,
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const ascendingBatchesOfItem: ItemBatch[] = (await this.itemBatchRepo.findByItemID(req.body.item.id))
        .sort((itemBatch1, itemBatch2) => Number(itemBatch1.batch.expiryTime) - Number(itemBatch2.batch.expiryTime));
      const presentTime = new Date().getTime();

      req.body.totalUnexpiredItemQuantities = ascendingBatchesOfItem.reduce((total, itemBatch) => {
        total += Number(itemBatch.batch.expiryTime) > presentTime ? itemBatch.quantity : 0;
        return total;
      }, 0);

      req.body.maxExpiryTime = req.body.totalUnexpiredItemQuantities > 0
        ? Number(ascendingBatchesOfItem[ascendingBatchesOfItem.length - 1].batch.expiryTime)
        : null;

      return next();
    } catch(err) {
      return next(err);
    }
  }
}
