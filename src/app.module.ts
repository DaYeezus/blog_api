import {CacheInterceptor, CacheModule, MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {ConfigModule} from "@nestjs/config"
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserModule} from './user/user.module';
import {UserEntity} from "./user/models/user.entity";
import {AuthModule} from './auth/auth.module';
import {ThrottlerModule} from "@nestjs/throttler";
import {MailModule} from './mail/mail.module';
import {CurrentUserMiddleware} from "./middlewares/current-user/current-user.middleware";
import {JwtService} from "@nestjs/jwt";
import {BlogModule} from './blog/blog.module';
import {BlogEntity} from "./blog/models/blog.entity";
import {CloudinaryModule} from './cloudinary/cloudinary.module';
import * as redisStore from "cache-manager-ioredis";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
      ConfigModule.forRoot({isGlobal: true}),
      TypeOrmModule.forRoot({
          type: "postgres",
          host:process.env.POSTGRES_DB_HOST,
          port:Number(process.env.POSTGRES_DB_PORT),
          database:process.env.POSTGRES_DB_NAME,
          username:process.env.POSTGRES_USER,
          password:process.env.POSTGRES_PASSWORD,
          entities:  [UserEntity,BlogEntity],
          synchronize: process.env.MODE !== "production"
      }),
      ThrottlerModule.forRoot({ttl: 60, limit: 20}),
      TypeOrmModule.forFeature([UserEntity]),
      CacheModule.register({
          store: redisStore,
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          ttl: 60 * 3600 * 100,
          isGlobal: true
      }),

      UserModule,
      AuthModule,
      MailModule,
      BlogModule,
      CloudinaryModule,
  ],
    providers: [JwtService],
    exports: [CacheModule]

})
export class AppModule implements NestModule{
    configure(consumer: MiddlewareConsumer): any {
        consumer.apply(CurrentUserMiddleware).forRoutes("user","auth/logout","blog")
    }
}
