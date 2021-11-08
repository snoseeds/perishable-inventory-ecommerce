import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Item } from './item.entity';

@Entity()
export class Sales extends BaseEntity {
  
  @ManyToOne(() => Item, { eager: true })
  item: Item

  @Column({type: 'int'})
  quantity: number;
}
