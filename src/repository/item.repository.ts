import { Item } from '../domain/model/item.entity';
import { EntityRepository, Repository } from 'typeorm';


@EntityRepository(Item)
export class ItemRepository extends Repository<Item> {
  async findByName(topicName: string, transaction = false): Promise<Item> {
    return this.findOne(
      {
        name: topicName
      },
      {
        transaction
      }
    );
  }

  async createNewItem (name: string) {
    const newItem = {
      name
    };
    return this.save(newItem);
  }
}