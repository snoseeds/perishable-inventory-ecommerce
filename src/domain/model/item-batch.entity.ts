import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Item } from './item.entity';
import { Batch } from './batch.entity';

@Entity()
export class ItemBatch extends BaseEntity {
  @Column({type: 'int'})
  quantity: number;

  @ManyToOne(() => Batch, { eager: true })
  batch: Batch

  @ManyToOne(() => Item, { eager: true })
  item: Item
}
