import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/User.entity';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  Not,
  Repository,
} from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { USER_BASIC_SELECT, USER_PROFILE_SELECT } from './user.select';
import { ClsService } from 'nestjs-cls';
import { FollowStatus } from 'src/shared/enum/follow.enum';
import { FindParams } from 'src/shared/types/find.params';
import { UpdateUserDto } from './dto/update-user.dto';
import { ImageEntity } from 'src/database/entities/Image.entity';
import { FollowService } from '../follow/follow.service';

@Injectable()
export class UserService {
  constructor(
    private cls: ClsService,
    @Inject(forwardRef(() => FollowService))
    private followService: FollowService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  find(params: FindParams<User>) {
    const { where, select, relations, limit, page } = params;
    let payload: FindManyOptions<User> = { where, select, relations };

    if (limit > 0) {
      payload.take = limit;
      payload.skip = limit * page;
    }
    return this.userRepo.find(payload);
  }

  findOne(params: Omit<FindParams<User>, 'limit' | 'page'>) {
    const { where, relations, select } = params;
    return this.userRepo.findOne({ where, relations, select });
  }

  async userProfile(id: number) {
    const myUser = await this.cls.get<User>('user');

    const relations = ['myFollowers', 'myFollowers.followed'];
    const user = await this.findOne({
      where: { id },
      relations,
      select: USER_PROFILE_SELECT,
    });

    if (!user) throw new NotFoundException('User is not found');

    const followStatus =
      user.myFollowers.find((follow) => follow.followed.id == myUser.id)
        ?.status || FollowStatus.NOT_FOLLOWING;
    const result = { ...user, followStatus, myFollowers: undefined };

    return result;
  }

  async search(params: SearchUserDto) {
    const { searchParam, page = 0, limit = 10 } = params;

    const myUser = await this.cls.get<User>('user');

    let where: FindOptionsWhere<User>[] = [
      {
        userName: ILike(`${searchParam}%`),
      },
      {
        email: searchParam,
      },
      {
        firstName: ILike(`%${searchParam}%`),
      },
      {
        lastName: ILike(`%${searchParam}%`),
      },
    ];

    const relations = ['myFollowers', 'myFollowers.followed'];

    let users = await this.find({
      where,
      select: USER_BASIC_SELECT,
      page,
      limit,
      relations,
    });

    let mappedUsers = users.map((user) => {
      let followStatus =
        user.myFollowers.find((follow) => follow.followed.id === myUser.id)
          ?.status || FollowStatus.NOT_FOLLOWING;
      return {
        ...user,
        followStatus,
        myFollowers: undefined,
      };
    });

    return mappedUsers;
  }

  async create(params: Partial<CreateUserDto>) {
    let checkUserName = await this.findOne({
      where: { userName: params.userName },
    });
    if (checkUserName)
      throw new ConflictException('This username is already exists');

    let checkUserEmail = await this.findOne({ where: { email: params.email } });
    if (checkUserEmail)
      throw new ConflictException('This email is already exists');

    let user = this.userRepo.create(params);

    await user.save();

    return user;
  }

  async updateProfile(params: Partial<UpdateUserDto>) {
    let myUser = await this.cls.get<User>('user');

    let payload: Partial<User> = {};
    for (let key in params) {
      switch (key) {
        case 'isPrivate':
          payload.isPrivate = params.isPrivate;
          if (params.isPrivate === false) {
            await this.followService.acceptAllRequsts(myUser.id);
          }

          break;
        case 'profilePictureId':
          payload.profilePicture = {
            id: params.profilePictureId,
          };
          break;
        case 'userName':
          let checkUserName = await this.findOne({
            where: { userName: params.userName, id: Not(myUser.id) },
          });
          if (checkUserName)
            throw new ConflictException('This username is already exists');

          payload.userName = params.userName;
          break;
        default:
          payload[key] = params[key];
          break;
      }
    }

    await this.update(myUser.id, payload);
    return {
      status: true,
      message: 'Profile is successfully updated',
    };
  }

  async update(id: number, params: Partial<User>) {
    return await this.userRepo.update({ id }, params);
  }
}
