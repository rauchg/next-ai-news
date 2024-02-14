import { db, usersTable } from '../app/db';
import { eq } from 'drizzle-orm';
import { node } from 'fuse';

export const User = node({
  name: 'User',
  key: 'username',
  load(usernames, ctx) {
    return Promise.all(usernames.map(username => db.select().from(usersTable).where(eq(usersTable.username, username)).then(res => res[0] || ({ username }))))
  },
  fields: (t) => ({
    username: t.exposeString('username')
  })
})