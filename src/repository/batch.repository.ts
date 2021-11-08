import { EntityRepository, Repository } from 'typeorm';
import { Item } from '../domain/model/item.entity';
import { Batch } from '../domain/model/batch.entity';
import e from 'express';

@EntityRepository(Batch)
export class BatchRepository extends Repository<Batch> {
  async findByBatchID(batchID: string, transaction = false): Promise<Batch> {
    return this.findOne(batchID, {transaction})
  }

  async findByBatchExpiryTime(expiryTime: string): Promise<Batch> {
    return this.findOne({
      where: {
        expiryTime
      }
    })
  }

  async createNewBatch(expiryTime: string): Promise<Batch> {
    const newBatch = {
      expiryTime
    }
    return this.save(newBatch);
  }
}