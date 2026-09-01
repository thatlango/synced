import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, SignUpDto, LoginDto, CoreRegisterDto, CoreLoginDto, CoreSessionDto, CoreSsoExchangeDto } from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Public()
  @Post('core/session')
  @ApiOperation({ summary: 'Verify a native Tuku Core session and create a Synced product session' })
  coreSession(@Body() dto: CoreSessionDto) {
    return this.authService.coreSession(dto);
  }

  @Public()
  @Post('core/exchange')
  @ApiOperation({ summary: 'Legacy PKCE exchange retained for compatibility with older clients' })
  coreExchange(@Body() dto: CoreSsoExchangeDto) {
    return this.authService.coreExchange(dto);
  }

  @Public()
  @Post('core/register')
  @ApiOperation({ summary: 'Create a canonical Tuku account and Synced financial profile' })
  coreRegister(@Body() dto: CoreRegisterDto) {
    return this.authService.coreRegister(dto);
  }

  @Public()
  @Post('core/login')
  @ApiOperation({ summary: 'Sign in through Tuku Core and create a Synced product session' })
  coreLogin(@Body() dto: CoreLoginDto) {
    return this.authService.coreLogin(dto);
  }

  @Public()
  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Sign up with phone + OTP' })
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with phone + OTP' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
