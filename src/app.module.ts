import { Module } from '@nestjs/common';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { TelegramModule } from './telegram/telegram.module';
import { UsersModule } from './users/users.module';
import { KarmaModule } from './karma/karma.module';
import { KarmaApiModule } from './api/karma/karma-api.module';
import { UsersApiModule } from './api/users/users-api.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        TELEGRAM_BOT_TOKEN: Joi.string().required(),
        MONGODB_CNN: Joi.string().required(),
        TELEGRAM_BOT_USERNAME: Joi.string().required(),
        PORT: Joi.string().default('3000'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TelegramModule,
    UsersModule,
    KarmaModule,

    // API modules for external access
    KarmaApiModule,
    UsersApiModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
