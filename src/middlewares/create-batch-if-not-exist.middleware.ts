import { Injectable, NestMiddleware, Res, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { BatchRepository } from '../repository/batch.repository';

  
@Injectable()
export class CreateBatchIfNotExistMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(BatchRepository) private readonly batchRepo: BatchRepository
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const { expiry: batchExpiryTime } = req.body;
      const batchExpiryTimeString = String(batchExpiryTime);
      try {
        const existingItemBatch = await this.batchRepo.findByBatchExpiryTime(batchExpiryTimeString);
        req.body.batch = existingItemBatch || await this.batchRepo.createNewBatch(batchExpiryTime)
        req.body.batchStatus = existingItemBatch ? "Existing batch" : "Newly created batch";

        return next();
      } catch (err) {
        return next(err);
      }
    } catch(err) {
      return next(err);
    }
  }
}
