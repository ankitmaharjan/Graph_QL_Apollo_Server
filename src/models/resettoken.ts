import { DataTypes, Model } from 'sequelize';
import sequelize from '../Database/sequelizeConnection'; // Adjust the path as needed
import User from './user'; // Import the User model for the foreign key reference

class ResetToken extends Model {
  public id!: number;
  public token!: string;
  public userId!: number;
  public expirationDate!: Date;

  // Define associations
  public readonly user?: User;

  static associate(models:any) {
    ResetToken.belongsTo(models.User, {
      foreignKey: 'userId',
    });
  }
}

ResetToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ResetToken',
    tableName: 'ResetTokens', // Set the actual table name here
  }
);


export default ResetToken;
