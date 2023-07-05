import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
// import { TodosModule } from './todos/todos.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'debug',
      },
    }),
    PrismaModule.forRoot(),
    // TodosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
