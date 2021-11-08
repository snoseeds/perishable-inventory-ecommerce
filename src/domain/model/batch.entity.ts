import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Item } from './item.entity';

@Entity()
export class Batch extends BaseEntity {
  
  // @ManyToOne(() => Item, { eager: true })
  // item: Item

  // @Column({type: 'int'})
  // quantity: number;

  @Column({type: 'bigint'})
  expiryTime: string;
}
