import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';

describe('DatabaseModule', () => {
  it('should configure mongoose uri from ConfigService', async () => {
    jest.resetModules();
    type ForRootAsyncArgs = {
      useFactory: (
        configService: Pick<ConfigService, 'get'>,
      ) => { uri: string } | Promise<{ uri: string }>;
      inject: unknown[];
    };

    const forRootAsyncMock = jest.fn((options: ForRootAsyncArgs) => options);

    jest.doMock('@nestjs/mongoose', () => ({
      MongooseModule: { forRootAsync: forRootAsyncMock },
    }));

    const { DatabaseModule } = await import('./database.module');
    expect(DatabaseModule).toBeDefined();
    expect(forRootAsyncMock).toHaveBeenCalled();

    const args = forRootAsyncMock.mock.calls[0]?.[0];
    expect(args).toBeDefined();

    const configService = {
      get: jest.fn().mockReturnValue('mongo-uri'),
    } satisfies Pick<ConfigService, 'get'>;

    const factoryResult = await args.useFactory(configService);

    expect(configService.get).toHaveBeenCalledWith('MONGODB_CNN');
    expect(factoryResult.uri).toBe('mongo-uri');
    expect(args.inject).toBeDefined();
  });
});
