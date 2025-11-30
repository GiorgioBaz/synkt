import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CalendarModule } from './calendar/calendar.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // TODO: Uncomment when MongoDB is ready! Either:
    // 1. Install MongoDB locally (it will connect to mongodb://localhost:27017/synkt)
    // 2. Create apps/backend/.env with MONGODB_URI for MongoDB Atlas
    // Then uncomment the MongooseModule and data modules below:
    /*
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/synkt';
        return {
          uri,
          serverSelectionTimeoutMS: 5000,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    CalendarModule,
    GroupsModule,
    */
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

