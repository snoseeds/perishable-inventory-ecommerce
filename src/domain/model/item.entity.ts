import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Item extends BaseEntity {
  @Column({ type: 'varchar' })
  name: string;
  
  // Required Absolute value in milliseconds away from batch expiry
  @Column({type: 'bigint', default: 0})
  minimumExpiryGap: string;
}
