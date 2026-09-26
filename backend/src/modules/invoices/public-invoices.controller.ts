import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('public/invoices')
export class PublicInvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get(':id')
  async getPublicInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findPublicInvoice(id);
  }
}
