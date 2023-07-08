import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { TodosModule } from './todos/todos.module';
import { LoggerModule } from 'nestjs-pino';
import { isProd } from './common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: !isProd ? 'debug' : 'info',
        transport: !isProd
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                levelFirst: false,
                translateTime: "yyyy-mm-dd'T'HH:MM:ss.l'Z'",
                messageFormat: '[{context}] {msg}',
                ignore: 'pid,hostname,context,req,res,responseTime',
                errorLikeObjectKeys: ['err', 'error'],
              },
            }
          : undefined,
      },
    }),
    PrismaModule.forRoot(),
    TodosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
