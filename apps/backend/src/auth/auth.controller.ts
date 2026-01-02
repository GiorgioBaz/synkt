import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  async googleAuth(@Req() req) {
    // defaults to Google Strategy
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req) {
    // User is validated by GoogleStrategy and populated in req.user
    // In a real app, we would generate a JWT here and redirect to frontend.
    // For testing, we just return the user so we can see the ID and Refresh Token.
    return {
      message: 'Authentication successful',
      user: req.user,
    };
  }
}
