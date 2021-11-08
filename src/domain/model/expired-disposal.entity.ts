import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Item } from './item.entity';
import { Disposal } from './disposal.entity';

@Entity()
export class ExpiredDisposal extends BaseEntity {
    
  @ManyToOne(() => Disposal, { eager: true })
  disposal: Disposal

  @ManyToOne(() => Item, { eager: true })
  item: Item

  @Column({type: 'int'})
  quantity: number;
}
