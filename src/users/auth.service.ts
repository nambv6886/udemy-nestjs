import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { scrypt as _scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
  ) {
  }

  async signup(email: string, password: string) {
    // validate email
    const users = await this.userService.find(email);
    if (users.length) {
      throw new BadRequestException('Email in use');
    }
    // hash password
    // gen salt
    const salt = randomBytes(8).toString('hex');
    // hash salt and password
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // joint the hashed result and salt together
    const result = `${salt}.${hash.toString('hex')}`;
    // create new user
    const user = await this.userService.create(email, result);
    // return the user
    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.userService.find(email);
    if (!user) {
      throw new NotFoundException('Email not found');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('Bad password')
    }

    return user;
  }
}
