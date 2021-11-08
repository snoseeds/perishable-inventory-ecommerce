import { Injectable, NestMiddleware, Res, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { ItemRepository } from '../repository/item.repository';
import { BatchRepository } from '../repository/batch.repository';
import { ItemBatchRepository } from '../repository/item-batch.repository';
import { Item } from '../domain/model/item.entity';
import { Batch } from '../domain/model/batch.entity';
  
@Injectable()
export class UpdateOrCreateItemBatchIfNotExistMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(ItemRepository) private readonly itemRepo: ItemRepository,
    @InjectRepository(BatchRepository) private readonly batchRepo: BatchRepository,
    @InjectRepository(ItemBatchRepository) private readonly itemBatchRepo: ItemBatchRepository
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const { quantity } = req.body;
      const item: Item = req.body.item;
      const batch: Batch = req.body.batch;
      debugger;
    
      const existingItemBatch = await this.itemBatchRepo.UpdateItemBatch(item.id, batch.id, quantity);
      req.body.itemBatch = existingItemBatch || await this.itemBatchRepo.createNewItemBatch(item, batch, quantity);
      req.body.itemBatchStatus = existingItemBatch ? "Updated existing item batch" : "Newly created item batch";
      return next();
      
    } catch(err) {
      console.log("from itembatch");
      return next(err);
    }
  }
}
