import {
  Resolver,
  Ctx,
  Mutation,
  InputType,
  Field,
  Arg,
  ObjectType,
} from 'type-graphql';
import { MyContext } from 'src/types';
import User from '../entities/User';
import argon from 'argon2';
@InputType()
class UserCred {
  @Field()
  username: string;
  @Field()
  password: string;
}
@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export default class UserResolver {
  @Mutation(() => User)
  async register(
    @Arg('options') options: UserCred,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: 'username',
            message: 'invalid username length',
          },
        ],
      };
    }
    if (options.password.length <= 2) {
      return {
        errors: [
          {
            field: 'password',
            message: 'invalid password length',
          },
        ],
      };
    }
    const hashedPassword = await argon.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
    } catch (error) {
      if (error.code === '23505') {
        return {
          errors: [
            {
              field: 'username',
              message: 'username already exists!',
            },
          ],
        };
      }
      console.error(error);
    }
    return { user };
  }
  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UserCred,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: 'invalid credential!',
          },
        ],
      };
    }
    const isValid = await argon.verify(user.password, options.password);
    if (!isValid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'invalid credential!',
          },
        ],
      };
    }
    return { user };
  }
}
