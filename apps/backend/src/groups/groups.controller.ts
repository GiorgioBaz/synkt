import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GroupsService } from './groups.service';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  async create(
    @Body()
    createGroupDto: {
      name: string;
      createdBy: string;
      memberIds: string[];
    },
  ) {
    return this.groupsService.create(
      createGroupDto.name,
      createGroupDto.createdBy,
      createGroupDto.memberIds,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID' })
  async findOne(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all groups for a user' })
  async findByUser(@Param('userId') userId: string) {
    return this.groupsService.findByUserId(userId);
  }

  @Post(':id/calculate-times')
  @ApiOperation({ summary: 'Calculate best meeting times for a group' })
  async calculateBestTimes(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 7;
    return this.groupsService.calculateBestTimes(id, numDays);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on a proposed time' })
  async vote(
    @Param('id') id: string,
    @Body()
    voteDto: {
      userId: string;
      timeIndex: number;
      vote: 'yes' | 'no' | 'maybe';
    },
  ) {
    return this.groupsService.vote(
      id,
      voteDto.userId,
      voteDto.timeIndex,
      voteDto.vote,
    );
  }
}
