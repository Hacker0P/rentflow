import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty({ message: 'Property name is required' })
  @MinLength(2, { message: 'Property name must be at least 2 characters long' })
  @MaxLength(150, { message: 'Property name cannot exceed 150 characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Property address is required' })
  @MinLength(5, { message: 'Property address must be at least 5 characters long' })
  @MaxLength(255, { message: 'Property address cannot exceed 255 characters' })
  address: string;
}
