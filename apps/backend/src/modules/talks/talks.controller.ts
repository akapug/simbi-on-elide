import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TalksService } from './talks.service';
import { CreateTalkDto, SendMessageDto, CreateOfferDto } from './dto/talks.dto';

@ApiTags('talks')
@Controller('talks')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TalksController {
  constructor(private talksService: TalksService) {}

  @Post()
  @ApiOperation({ summary: 'Create new conversation' })
  async create(@Req() req: any, @Body() dto: CreateTalkDto) {
    return this.talksService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user conversations' })
  async getUserTalks(@Req() req: any) {
    return this.talksService.getUserTalks(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  async getTalkById(@Param('id') id: string, @Req() req: any) {
    return this.talksService.getTalkById(id, req.user.id);
  }

  @Post(':id/message')
  @ApiOperation({ summary: 'Send message' })
  async sendMessage(@Param('id') id: string, @Req() req: any, @Body() dto: SendMessageDto) {
    return this.talksService.sendMessage(id, req.user.id, dto);
  }

  @Post(':id/offer')
  @ApiOperation({ summary: 'Create offer' })
  async createOffer(@Param('id') id: string, @Req() req: any, @Body() dto: CreateOfferDto) {
    return this.talksService.createOffer(id, req.user.id, dto);
  }

  @Post('offers/:id/accept')
  @ApiOperation({ summary: 'Accept offer' })
  async acceptOffer(@Param('id') id: string, @Req() req: any) {
    return this.talksService.acceptOffer(id, req.user.id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive conversation' })
  async archive(@Param('id') id: string, @Req() req: any) {
    return this.talksService.archiveTalk(id, req.user.id);
  }
}
