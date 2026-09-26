import { Module } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { LeasesController } from './leases.controller';
import { UnitsModule } from '@/modules/units/units.module';
import { TenantsModule } from '@/modules/tenants/tenants.module';

@Module({
  imports: [UnitsModule, TenantsModule],
  controllers: [LeasesController],
  providers: [LeasesService],
  exports: [LeasesService],
})
export class LeasesModule {}
