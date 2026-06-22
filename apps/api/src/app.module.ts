import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisTasksModule } from './analysis-tasks/analysis-tasks.module';
import { getTypeOrmModuleOptions } from './database/typeorm-options';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmModuleOptions()),
    AnalysisTasksModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
