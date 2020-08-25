import path from 'path'
import { MikroORM } from '@mikro-orm/core'
import { User } from './entities/User'
import { Post } from './entities/Post'
import { __prod__ } from './constants'

export default {
  migrations: {
    path: path.join(__dirname, '/migrations'), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  dbName: 'lireddit',
  type: 'postgresql',
  entities: [User, Post],
  user: 'postgres',
  password: 'aaaa0000',
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0]
