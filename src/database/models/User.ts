import { Sequelize, Model, DataTypes } from 'sequelize';
import { Role } from './Role';
import { Profile } from './Profile';
import { Rating } from './Rating';
<<<<<<< HEAD
import { Post } from './Post';
import { Comment } from './Comment';
=======
>>>>>>> 833906b (Initial MenyaLo backend setup:)

interface UserAttributes {
  id: string;
  username?: string;
  name?: string;
  email: string;
  address?: string;
  registrationNumber?: number;
  password: string;
  roleId: string;
  isActive: boolean;
  googleId?: string;
  provider?: 'local' | 'google';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: null;
}

export interface UserCreationAttributes
  extends Omit<UserAttributes, 'id' | 'deletedAt' | 'createdAt' | 'updatedAt'> {
  id?: string;
  deletedAt?: null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public name?: string;
  public email!: string;
  public address?: string;
  public registrationNumber?: number;
  public password!: string;
  public roleId!: string;
  public isActive!: boolean;
  public googleId?: string;
  public provider?: 'local' | 'google';

  public createdAt: Date = new Date();
  public updatedAt!: Date;
  public deletedAt: null = null;

  static associate(models: {
    Role: typeof Role;
    Profile: typeof Profile;
    Rating: typeof Rating;
<<<<<<< HEAD
    Post: typeof Post;
    Comment: typeof Comment;
=======
>>>>>>> 833906b (Initial MenyaLo backend setup:)
  }): void {
    User.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role',
    });

    User.hasOne(models.Profile, {
      foreignKey: 'userId',
      as: 'profile',
    });
    User.hasMany(Rating, {
      foreignKey: 'userId',
      as: 'ratings',
    });
<<<<<<< HEAD

    User.hasMany(Post, {
      foreignKey: 'authorId',
      as: 'posts',
    });
    User.hasMany(Comment, {
      foreignKey: 'authorId',
      as: 'comments',
    });
=======
>>>>>>> 833906b (Initial MenyaLo backend setup:)
  }

  public toJSON(): object | UserAttributes {
    return {
      ...this.get(),
      password: undefined,
      deletedAt: undefined,
    };
  }
}

export const UserModel = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      registrationNumber: {
        type: DataTypes.NUMBER,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      provider: {
        type: DataTypes.ENUM('local', 'google'),
        allowNull: true,
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
    },
  );
  return User;
};
