import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { TenantPortalService } from './tenant-portal.service';
import { ReportPaymentDto } from './dto/report-payment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '@/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tenant')
export class TenantPortalController {
  constructor(private readonly tenantPortalService: TenantPortalService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.tenantPortalService.getDashboard(user.id);
  }

  @Post('invoices/:id/report-payment')
  async reportPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportPaymentDto,
  ) {
    return this.tenantPortalService.reportPayment(user.id, id, dto);
  }
}
