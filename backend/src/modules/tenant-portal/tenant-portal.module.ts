import { Module } from '@nestjs/common';
import { TenantPortalController } from './tenant-portal.controller';
import { TenantPortalService } from './tenant-portal.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TenantPortalController],
  providers: [TenantPortalService],
  exports: [TenantPortalService],
})
export class TenantPortalModule {}

