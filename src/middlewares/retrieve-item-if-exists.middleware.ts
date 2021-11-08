import { Injectable, NestMiddleware, Res, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { ItemRepository } from '../repository/item.repository';
import { Item } from '../domain/model/item.entity';
import { JSendResponseDto } from '../domain/dto/jsend-response.dto';
  
@Injectable()
export class RetrieveItemIfExistsMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(ItemRepository) private readonly itemRepo: ItemRepository
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const { item: itemName } = req.params;

      const item: Item = await this.itemRepo.findByName(itemName);
      if (item) {
        req.body.item = item;
        return next();
      }

      return res.status(404).send(new JSendResponseDto('failed', 404, "Bad request: The item does not exist in the platforrm's inventory", null));
    } catch(err) {
      return next(err);
    }
  }
}
