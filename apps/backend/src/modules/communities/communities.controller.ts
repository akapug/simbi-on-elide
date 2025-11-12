import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';

@ApiTags('communities')
@Controller('communities')
export class CommunitiesController {
  constructor(private communitiesService: CommunitiesService) {}

  @Get()
  async findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.communitiesService.findById(id);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async join(@Param('id') id: string, @Req() req: any) {
    return this.communitiesService.join(id, req.user.id);
  }

  @Delete(':id/leave')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async leave(@Param('id') id: string, @Req() req: any) {
    return this.communitiesService.leave(id, req.user.id);
  }
}
