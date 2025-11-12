import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, SearchServicesDto, FlagServiceDto } from './dto/services.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('member', 'moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new service listing (Member+ only)' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: member, moderator, or admin' })
  async create(@Req() req: any, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  async findAll(@Query() query: any) {
    return this.servicesService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search services' })
  async search(@Query() dto: SearchServicesDto) {
    return this.servicesService.search(dto);
  }

  @Get('my-services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my services' })
  async getMyServices(@Req() req: any) {
    return this.servicesService.getMyServices(req.user.id);
  }

  @Get('favorites')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my favorite services' })
  async getFavorites(@Req() req: any) {
    return this.servicesService.getFavorites(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  async findById(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  async update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, req.user.id, dto);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish service' })
  async publish(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.publish(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('user', 'member', 'moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service (Owner/Moderator/Admin)' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.delete(id, req.user.id, req.user.role);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like service' })
  async like(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.like(id, req.user.id);
  }

  @Delete(':id/unlike')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike service' })
  async unlike(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.unlike(id, req.user.id);
  }

  @Post(':id/flag')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Flag service for review' })
  @ApiResponse({ status: 201, description: 'Service flagged successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async flagService(@Param('id') id: string, @Req() req: any, @Body() dto: FlagServiceDto) {
    return this.servicesService.flagService(id, req.user.id, dto);
  }
}
