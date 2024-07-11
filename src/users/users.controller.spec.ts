import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      findOne: (id: number) => {
        return Promise.resolve({ id, email: 'email@email.com', password: 'password' } as User)
      },
      find: (email: string) => {
        return Promise.resolve([
          { id: 1, email, password: 'password' } as User
        ])
      },
      // remove: () => { },
      // update: () => { },
    };
    fakeAuthService = {
      // signup: () => { },
      signin: (email: string, password: string) => {
        return Promise.resolve({ id: 1, email, password } as User)
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        }, {
          provide: AuthService,
          useValue: fakeAuthService,
        }
      ],
      controllers: [UsersController]
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });
  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
  it('findAllUser return a list of users', async () => {
    const users = await controller.findAllUsers('email@email.com');
    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual('email@email.com');
  })

  it('findUsers returns a single user with the given id', async () => {
    const user = await controller.findUser('1');
    expect(user).toBeDefined();
  })
  it('findUser throw an error if user not found', async () => {
    fakeUsersService.findOne = () => (null);
    await expect(controller.findUser('1')).rejects.toThrow(NotFoundException);
  })
  it('signIn update session object and return user', async () => {
    const session = { userId: 0 };
    const user = await controller.signin(
      {
        email: 'email@email.com',
        password: 'password'
      },
      session
    );

    expect(user).toBeDefined();
    expect(user.id).toEqual(1);
    expect(session.userId).toEqual(1);
  })
})