import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}
  getHello() {
    return 'Hello Social media';
  }
}
