import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Batch } from './batch.entity';
import { ExpiredDisposal } from './expired-disposal.entity';

@Entity()
export class ExpiredDisposalBatch extends BaseEntity {
  @Column({type: 'int'})
  quantity: number;

  // @OneToOne(() => Batch, { eager: true })
  // @JoinColumn()

  @ManyToOne(() => Batch, { eager: true })
  @JoinColumn()
  batch: Batch

  @ManyToOne(() => ExpiredDisposal, { eager: true })
  expiredDisposal: ExpiredDisposal
}
