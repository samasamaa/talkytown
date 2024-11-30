import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './config';
import { User } from './database/entities/User.entity';
import { AuthModule } from './app/auth/auth.module';
import { UserModule } from './app/user/user.module';
import { UploadModule } from './app/upload/upload.module';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';

import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { ClsGuard, ClsModule } from 'nestjs-cls';
import { APP_GUARD } from '@nestjs/core';
import { FollowModule } from './app/follow/follow.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PostModule } from './app/post/post.module';
import { ChatModule } from './app/chat/chat.module';
import { SocketModule } from './socket/socket.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from './shared/libs/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      username: config.database.user,
      password: config.database.password,
      database: config.database.database,
      entities: [`${__dirname}/**/*.entity.{ts,js}`],
      synchronize: true,
      logging: true,
    }),
    JwtModule.register({
      global: true,
      secret: config.jwtSecret,
      signOptions: { expiresIn: '10d' },
    }),
    EventEmitterModule.forRoot(),
    RedisModule.register({ host: config.redis.host, port: config.redis.port }),
    MailerModule.forRoot({
      transport: {
        host: config.smtp.host,
        port: config.smtp.port,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.password,
        },
      },
      defaults: {
        from: config.smtp.from,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      guard: { mount: true },
    }),
    ServeStaticModule.forRoot({
      serveRoot: '/uploads',
      rootPath: join(__dirname, '..', 'uploads'),
    }),
    SocketModule,
    AuthModule,
    UserModule,
    UploadModule,
    FollowModule,
    PostModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ClsGuard,
    },
  ],
})
export class AppModule {}
