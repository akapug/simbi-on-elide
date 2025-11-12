import { Controller, Get, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CsrfService } from '../services/csrf.service';
import { SkipCsrf } from '../guards/csrf.guard';

@ApiTags('security')
@Controller('csrf')
export class CsrfController {
  constructor(private csrfService: CsrfService) {}

  @SkipCsrf() // CSRF token endpoint should not require CSRF validation
  @Get('token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get CSRF token',
    description: 'Retrieve a CSRF token for making state-changing requests. The token is also set as a cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF token successfully generated',
    schema: {
      type: 'object',
      properties: {
        csrfToken: { type: 'string' },
        expiresIn: { type: 'number' },
      },
    },
  })
  getToken(@Req() req: Request): { csrfToken: string; expiresIn: number } {
    const { token, cookie } = this.csrfService.generateToken();
    const res = req.res as Response;

    // Set the cookie with the random value
    res.cookie('XSRF-TOKEN', cookie, {
      httpOnly: false, // Allow JavaScript to read for sending in headers
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // Prevent CSRF attacks
      maxAge: 3600000, // 1 hour
    });

    // Return the full token to be used in headers
    return {
      csrfToken: token,
      expiresIn: 3600000,
    };
  }
}
