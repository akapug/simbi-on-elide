import { Module, Global } from '@nestjs/common';
import { CsrfService } from '../services/csrf.service';
import { CsrfController } from '../controllers/csrf.controller';
import { CsrfGuard } from '../guards/csrf.guard';

@Global()
@Module({
  controllers: [CsrfController],
  providers: [CsrfService, CsrfGuard],
  exports: [CsrfService, CsrfGuard],
})
export class CsrfModule {}
