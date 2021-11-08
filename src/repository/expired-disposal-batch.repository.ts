import { EntityRepository, Repository } from 'typeorm';
import { Sales } from '../domain/model/sales.entity';
import { ExpiredDisposalBatch } from '../domain/model/expired-disposal-batch.entity';
import { Batch } from '../domain/model/batch.entity';
import { ExpiredDisposal } from '../domain/model/expired-disposal.entity';

@EntityRepository(ExpiredDisposalBatch)
export class ExpiredDisposalBatchRepository extends Repository<ExpiredDisposalBatch> {
  async findByExpiredDisposalID(expiredDisposalID: string): Promise<ExpiredDisposalBatch[]> {
    return this.find({
      where: { expiredDisposal: expiredDisposalID }
    })
  }

  async findByBatchID(batchID: string): Promise<ExpiredDisposalBatch> {
    return this.findOne({
      where: { batch: batchID }
    })
  }

  async createNewExpiredDisposalBatch(expiredDisposal: ExpiredDisposal, batch: Batch, quantity: number, transaction = false): Promise<ExpiredDisposalBatch> {
    const newExpiredDisposalBatch = {
      expiredDisposal,
      batch,
      quantity
    }
    return this.save(newExpiredDisposalBatch, { transaction });
  }
}