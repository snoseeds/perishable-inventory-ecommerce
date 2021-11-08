import { Injectable, NestMiddleware, Res, Body } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Item } from '../domain/model/item.entity';
import { JSendResponseDto } from '../domain/dto/jsend-response.dto';
import { ItemRepository } from '../repository/item.repository';
import { InjectRepository } from '@nestjs/typeorm';
  
@Injectable()
export class CheckIfBatchMeetsItemMinimumExpiryMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(ItemRepository) private readonly itemRepo: ItemRepository
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
      const item: Item = req.body.item;
      const MINIMUM_ITEM_EXPIRY_GAP =  item.minimumExpiryGap; // Value in milliseconds
      const { expiry: batchExpiryTime } = req.body;
      const presentTime = new Date();
      const minimumValidExpiryTimeForItem = presentTime.getTime() + Number(MINIMUM_ITEM_EXPIRY_GAP);
      
      if (Number(batchExpiryTime) >= minimumValidExpiryTimeForItem) {
        return next();
      }
      
      if (req.body.itemStatus === "Newly created item") {
        await this.itemRepo.delete(item.id);
      }
      return res.status(422)
        .send(new JSendResponseDto("failed", 400, `Bad request, expiry time in batch doesn't meet the minimum expected for the item. See details in data`,
          {
            itemName: item.name,
            minimumValidExpiryTimeInMS: {
              asOfTime: presentTime.toISOString(),
              minimumValidExpiryTimeForItem
            }
          })
        );
  }
}
