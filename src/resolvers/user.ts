import {
  Query,
  Resolver,
  Ctx,
  Arg,
  Mutation,
  InputType,
  Field,
  ObjectType,
} from 'type-graphql'

import { User } from '../entities/User'
import { MyContext } from '../types'
import argon2 from 'argon2'

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string
  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext): Promise<User | null> {
    if (!req.session.userId) return null
    const user = await em.findOne(User, { id: req.session.userId })
    return user
  }

  @Mutation(() => UserResponse)
  async register(
    @Ctx() { em }: MyContext,
    @Arg('options') options: UsernamePasswordInput
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: 'username',
            message: 'username must be longer than 2 characters',
          },
        ],
      }
    }
    if (options.password.length < 8) {
      return {
        errors: [
          {
            field: 'password',
            message: 'password must be longer than 8 characters',
          },
        ],
      }
    }
    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    })
    try {
      await em.persistAndFlush(user)
    } catch (error) {
      console.error('error: ', error)
      if (error.code === '23505' || error.detail.includes('already exists')) {
        // duplicate username error
        return {
          errors: [
            {
              field: 'username',
              message: 'username taken',
            },
          ],
        }
      }
      return {
        errors: [
          {
            field: 'err whoops! :3',
            message: error.message,
          },
        ],
      }
    }
    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Ctx() { em, req }: MyContext,
    @Arg('options') options: UsernamePasswordInput
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username })
    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: 'that username was not found',
          },
        ],
      }
    }
    const valid = await argon2.verify(user.password, options.password)
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      }
    }

    req.session.userId = user.id
    return {
      user,
    }
  }

  // @Mutation(() => User)
  // async register(
  //   @Ctx() { em }: MyContext,
  //   @Arg('username') username: string,
  //   @Arg('password') password: string
  // ): Promise<User> {
  //   const user = await em.create(User, { username, password });
  //   await em.persistAndFlush(user);
  //   return user;
  // }

  @Query(() => [User])
  async users(@Ctx() { em }: MyContext): Promise<User[]> {
    return await em.find(User, {})
  }
}
