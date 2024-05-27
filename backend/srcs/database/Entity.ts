import "reflect-metadata";

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ContractLog {
  @PrimaryGeneratedColumn()
    id!: number;

  @Column()
    transactionHash!: string;

  @Column({ type: 'bigint' })
    blockNumber!: string;

  @Column()
    eventName!: string;

  @Column({ nullable: true })
    fromAddress?: string;

  @Column({ nullable: true })
    toAddress?: string;

  @Column({ type: 'bigint', nullable: true })
    value?: string;
}

@Entity()
export class ContractVolume {
  @PrimaryGeneratedColumn()
    id!: number;

  @Column()
    timestamp!: Date;

  @Column('float')
    volume!: number;
}
