import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CalendarModule } from './calendar/calendar.module';
import { GroupsModule } from './groups/groups.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/synkt';
        return {
          uri,
          serverSelectionTimeoutMS: 5000,
          connectionFactory: (connection) => {
            const logger = new Logger('MongooseModule');
            if (connection.readyState === 1) {
              logger.log('MongoDB is connected');
            }
            connection.on('connected', () => {
              logger.log('MongoDB is connected');
            });
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    CalendarModule,
    GroupsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
