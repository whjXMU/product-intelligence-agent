import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRootMessage(): string {
    return 'AI 产品文档竞品分析 Agent API 已启动，请访问 /health 查看服务状态。';
  }
}
