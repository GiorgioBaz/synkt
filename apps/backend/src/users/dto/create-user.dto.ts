
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'Alice Smith', description: 'Full name of the user' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'alice@example.com', description: 'Email address of the user' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Australia/Sydney', description: 'User timezone' })
    @IsString()
    @IsNotEmpty()
    timezone: string;

    @ApiProperty({ example: 'google', description: 'Auth provider (google/apple)' })
    @IsString()
    @IsNotEmpty()
    authProvider: string;

    @ApiProperty({ example: '123456789', description: 'Unique ID from provider' })
    @IsString()
    @IsNotEmpty()
    authProviderId: string;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Avatar URL', required: false })
    @IsString()
    @IsOptional()
    avatarUrl?: string;
}
