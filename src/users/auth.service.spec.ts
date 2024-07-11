import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filterUsers = users.filter(user => user.email === email);
        return Promise.resolve(filterUsers);
      },
      create: (email: string, password: string) => {
        const user = { id: Math.floor(Math.random() * 999), email, password } as User
        users.push(user);
        return Promise.resolve(user);
      },
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Create a new user with a salted and hashed password', async () => {
    const user = await service.signup('hello@gello.com', 'password');
    expect(user.password).not.toEqual('password');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  })

  it('thow an error if user signup with email is in use', async () => {
    await service.signup('hello@hello.com', 'password');
    await expect(service.signup('hello@hello.com', 'password')).rejects.toThrow(BadRequestException)
  })

  it('throw signin called with an unused email', async () => {
    await expect(service.signin('hello@hello.com', 'password')).rejects.toThrow(NotFoundException)
  })

  it('throw if an invalid password is provided', async () => {
    await service.signup('hello@hello.com', 'password');
    await expect(service.signin('hello@hello.com', 'diffPassword')).rejects.toThrow(BadRequestException)
  })

  it('return user if correct password provided', async () => {
    await service.signup('hello@hello.com', '1');
    const user = await service.signin('hello@hello.com', '1');
    expect(user).toBeDefined();
  })
});
