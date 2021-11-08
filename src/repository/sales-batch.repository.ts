import { EntityRepository, Repository } from 'typeorm';
import { Sales } from '../domain/model/sales.entity';
import { SalesBatch } from '../domain/model/sales-batch.entity';
import { Batch } from '../domain/model/batch.entity';

@EntityRepository(SalesBatch)
export class SalesBatchRepository extends Repository<SalesBatch> {
  async findBySalesID(salesID: string): Promise<SalesBatch[]> {
    return this.find({
      where: { sales: salesID }
    })
  }

  async findByBatchID(batchID: string): Promise<SalesBatch[]> {
    return this.find({
      where: { batch: batchID }
    })
  }

  async createNewSalesBatch(sales: Sales, batch: Batch, quantity: number): Promise<SalesBatch> {
    const newSalesBatch = {
      sales,
      batch,
      quantity
    }
    return this.save(newSalesBatch);
  }
}