import { EntityRepository, Repository } from 'typeorm';
import { Item } from '../domain/model/item.entity';
import { ExpiredDisposal } from '../domain/model/expired-disposal.entity';
import { Disposal } from '../domain/model/disposal.entity';

@EntityRepository(ExpiredDisposal)
export class ExpiredDisposalRepository extends Repository<ExpiredDisposal> {
  async findByItemID(itemID: string): Promise<ExpiredDisposal[]> {
    return this.find({
      where: { item: itemID }
    })
  }

  async findByDisposalID(disposalID: string): Promise<ExpiredDisposal[]> {
    return this.find({
      where: { disposal: disposalID }
    })
  }

  async createNewExpiredDisposal(disposal: Disposal, item: Item, quantity: number): Promise<ExpiredDisposal> {
    const newExpiredDisposal = {
      disposal,
      item,
      quantity
    };
    return this.save(newExpiredDisposal);
  }
}