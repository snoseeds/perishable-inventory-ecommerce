import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DisposalType } from '../enum/disposal-type.enum';

@Entity()
export class Disposal extends BaseEntity {
  @Column()
  disposalType: DisposalType;

  @Column({type: 'int'})
  quantity: number;
}
