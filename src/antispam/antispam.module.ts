import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  KarmaTransaction,
  KarmaTransactionSchema,
} from './schemas/karma-transaction.schema';
import { AntispamService } from './antispam.service';
import { AntispamRepository } from './antispam.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KarmaTransaction.name, schema: KarmaTransactionSchema },
    ]),
    UsersModule,
  ],
  providers: [AntispamService, AntispamRepository],
  exports: [MongooseModule, AntispamService],
})
export class AntispamModule {}
