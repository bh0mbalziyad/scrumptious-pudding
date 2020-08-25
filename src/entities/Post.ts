import { Entity, PrimaryKey, Property } from '@mikro-orm/core'
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
@Entity()
export class Post {
  @Field()
  @PrimaryKey()
  id!: number

  @Field(() => Date)
  @Property({ type: Date })
  createdAt = new Date()

  @Field(() => Date)
  @Property({ type: Date, onUpdate: () => new Date() })
  updatedAt = new Date()

  @Field()
  @Property()
  title!: string
}
