import { Injectable, NestMiddleware, Res, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { ItemRepository } from '../repository/item.repository';
import { Item } from '../domain/model/item.entity';
import { AddItemRequestDto } from '../domain/dto/add-item.request.dto';
  
@Injectable()
export class CreateItemIfNotExistMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(ItemRepository) private readonly itemRepo: ItemRepository
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const { item: itemName } = req.params;

      try {
        const item: Item = await this.itemRepo.findByName(itemName);
        req.body.item = item || await this.itemRepo.createNewItem(itemName);
        req.body.itemStatus = item ? "Existing item" : "Newly created item";

        return next();
      } catch (err) {
        return next(err);
      }
    } catch(err) {
      return next(err);
    }
  }
}
