import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Property name must be at least 2 characters long' })
  @MaxLength(150, { message: 'Property name cannot exceed 150 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Property address must be at least 5 characters long' })
  @MaxLength(255, { message: 'Property address cannot exceed 255 characters' })
  address?: string;
}
