/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateUserStatsDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  xp?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  level?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  streak?: number;
}
