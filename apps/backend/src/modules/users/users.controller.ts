import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateSettingsDto } from './dto/users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  async getUserByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Put('settings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user settings' })
  async updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(req.user.id, dto);
  }

  @Post(':id/follow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow user' })
  async follow(@Req() req: any, @Param('id') id: string) {
    return this.usersService.follow(req.user.id, id);
  }

  @Delete(':id/unfollow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow user' })
  async unfollow(@Req() req: any, @Param('id') id: string) {
    return this.usersService.unfollow(req.user.id, id);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  async getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users being followed' })
  async getFollowing(@Param('id') id: string) {
    return this.usersService.getFollowing(id);
  }

  @Get('suggested/users')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get suggested users to follow' })
  async getSuggested(@Req() req: any) {
    return this.usersService.getSuggestedUsers(req.user.id);
  }

  @Get('activity/feed')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user activity feed' })
  async getActivity(@Req() req: any) {
    return this.usersService.getActivity(req.user.id);
  }
}
