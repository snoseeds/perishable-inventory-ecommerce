import { EntityRepository, Repository } from 'typeorm';
import { Item } from '../domain/model/item.entity';
import { ItemBatch } from '../domain/model/item-batch.entity';
import { Batch } from '../domain/model/batch.entity';

@EntityRepository(ItemBatch)
export class ItemBatchRepository extends Repository<ItemBatch> {
  async findByItemID(itemID: string): Promise<ItemBatch[]> {
    return this.find({
      where: { item: itemID }
    })
  }

  async findByItemAndBatchID(itemID: string, batchID: string, transaction = false): Promise<ItemBatch> {
    return this.findOne({
      where: {
        item: itemID,
        batch: batchID,
      },
      transaction
    })
  }

  async UpdateItemBatch(itemID: string, batchID: string, additionalQuantity: number): Promise<ItemBatch> {
    const existingItemBatch = await this.findByItemAndBatchID(itemID, batchID, true);

    if (existingItemBatch) {
      return this.save({
        ...existingItemBatch,
        quantity: existingItemBatch.quantity + additionalQuantity
      }, { transaction: true })
    }

    return null;
  }

  async createNewItemBatch(item: Item, batch: Batch, quantity: number): Promise<ItemBatch> {
    const newItemBatch = {
      item,
      batch,
      quantity
    }
    return this.save(newItemBatch);
  }
}