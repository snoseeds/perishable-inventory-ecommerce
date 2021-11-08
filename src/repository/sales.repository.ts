import { EntityRepository, Repository } from 'typeorm';
import { Item } from '../domain/model/item.entity';
import { Sales } from '../domain/model/sales.entity';

@EntityRepository(Sales)
export class SalesRepository extends Repository<Sales> {
  async findByItemID(itemID: string): Promise<Sales[]> {
    return this.find({
      where: { item: itemID }
    })
  }

  async createNewSale(item: Item, quantity: number, transaction = false): Promise<Sales> {
    const newSaleForItem = {
      item,
      quantity
    }
    return this.save(newSaleForItem, { transaction });
  }
}