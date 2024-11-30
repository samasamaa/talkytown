import { forwardRef, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/User.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { FollowModule } from '../follow/follow.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User]), FollowModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
