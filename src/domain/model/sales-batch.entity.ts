import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Sales } from './sales.entity';
import { Batch } from './batch.entity';

@Entity()
export class SalesBatch extends BaseEntity {
  @Column({type: 'int'})
  quantity: number;

  @ManyToOne(() => Batch, { eager: true })
  batch: Batch

  @ManyToOne(() => Sales, { eager: true })
  sales: Sales
}
