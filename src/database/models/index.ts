import { Sequelize } from 'sequelize';
import { Role, RoleModel } from './Role';
import { User, UserModel } from './User';
import { Profile, ProfileModel } from './Profile';
import { Rating, RatingModel } from './Rating';
import { Subscriber, SubscriberModel } from './Subscriber';
import { Post, PostModel } from './Post';
import { Comment, CommentModel } from './Comment';
import { Reply, ReplyModel } from './Reply';

interface Models {
  Role: typeof Role;
  User: typeof User;
  Profile: typeof Profile;
  Rating: typeof Rating;
  Subscriber: typeof Subscriber;
  Post: typeof Post;
  Comment: typeof Comment;
  Reply: typeof Reply;
}

export const AllModels = (sequelize: Sequelize): Models => ({
  Role: RoleModel(sequelize),
  User: UserModel(sequelize),
  Profile: ProfileModel(sequelize),
  Rating: RatingModel(sequelize),
  Subscriber: SubscriberModel(sequelize),
  Post: PostModel(sequelize),
  Comment: CommentModel(sequelize),
  Reply: ReplyModel(sequelize),
});
