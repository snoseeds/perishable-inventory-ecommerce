import { EntityRepository, Repository } from 'typeorm';
import { Item } from '../domain/model/item.entity';
import { Disposal } from '../domain/model/disposal.entity';
import { DisposalType } from '../domain/enum/disposal-type.enum';

@EntityRepository(Disposal)
export class DisposalRepository extends Repository<Disposal> {
  async createNewDisposal(disposalType: DisposalType, quantity: number): Promise<Disposal> {
    const newDisposal = {
      disposalType,
      quantity
    }
    return this.save(newDisposal);
  }
}