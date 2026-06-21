import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRootMessage(): string {
    return 'product-intelligence-agent API 已启动，请访问 /health 查看服务状态。';
  }
}
