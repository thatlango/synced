import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { InvitesService } from './invites.service';

@ApiTags('invites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invites')
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.invites.create(userId, body);
  }

  @Public()
  @Get('open/:code')
  async open(@Param('code') code: string, @Res() res: Response) {
    const invite = await this.invites.preview('', code);
    const safeCode = encodeURIComponent(invite.code);
    const deepLink = `synced://join?code=${safeCode}`;
    const target = invite.targetType === 'basket' ? 'Basket' : 'shared space';

    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Join on Synced</title>
  <meta name="description" content="Open this invitation in the Synced app." />
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;background:#f7f8fc;color:#111827;margin:0;display:grid;min-height:100vh;place-items:center;padding:24px;box-sizing:border-box}
    main{max-width:460px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:24px;padding:28px;box-shadow:0 18px 60px rgba(15,23,42,.08)}
    .mark{width:52px;height:52px;border-radius:16px;background:#635bff;color:#fff;display:grid;place-items:center;font-weight:800;font-size:24px}
    h1{font-size:28px;margin:18px 0 8px}p{color:#64748b;line-height:1.55}.code{font-size:28px;font-weight:800;letter-spacing:.12em;margin:22px 0;text-align:center;padding:15px;background:#f8fafc;border-radius:16px}.button{display:block;text-align:center;text-decoration:none;background:#635bff;color:#fff;padding:15px 18px;border-radius:14px;font-weight:750}.small{font-size:13px;margin-top:18px}
  </style>
</head>
<body>
  <main>
    <div class="mark">S</div>
    <h1>Join this ${target} on Synced</h1>
    <p>You have been invited to coordinate money with someone you trust.</p>
    <div class="code">${safeCode}</div>
    <a class="button" href="${deepLink}">Open in Synced</a>
    <p class="small">If Synced is not installed yet, install the APK you were sent, open it, create or sign in to your account, then open this link again. You can also enter the code above inside Synced.</p>
  </main>
</body>
</html>`);
  }

  @Get('code/:code')
  preview(@CurrentUser('id') userId: string, @Param('code') code: string) {
    return this.invites.preview(userId, code);
  }

  @Post('code/:code/redeem')
  redeem(@CurrentUser('id') userId: string, @Param('code') code: string) {
    return this.invites.redeem(userId, code);
  }

  @Post(':id/revoke')
  revoke(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.invites.revoke(userId, id);
  }
}
