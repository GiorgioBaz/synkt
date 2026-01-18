import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
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
  async googleAuthRedirect(@Req() req, @Res() res) {
    // User is validated by GoogleStrategy and populated in req.user
    const user = req.user as any;
    
    // Redirect to mobile app with userId
    // Deep link scheme: mobile://auth-success?userId=...
    return res.redirect(`mobile://auth-success?userId=${user._id}`);
  }
}
