import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByAuthProvider(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.userModel
      .findOne({ authProvider: provider, authProviderId: providerId })
      .exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updateGoogleRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { googleCalendarRefreshToken: refreshToken },
        { new: true },
      )
      .exec();
  }

  async updateAppleCalendarEnabled(
    userId: string,
    enabled: boolean,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { appleCalendarEnabled: enabled },
        { new: true },
      )
      .exec();
  }
}
