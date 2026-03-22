import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHouseholdDto {
  @ApiProperty({ example: 'Nakawa Family' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class JoinHouseholdDto {
  @ApiProperty({ description: 'Invite code to join household' })
  @IsString()
  @IsNotEmpty()
  inviteCode: string;
}

export class UpdateHouseholdDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}
