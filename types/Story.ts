import { addQueryFields, node } from 'fuse'
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'

import { db, storiesTable } from '../app/db'
import { User } from '../types/User'
import { getTableConfig } from 'drizzle-orm/pg-core';

const storiesTableName = getTableConfig(storiesTable).name;

const PER_PAGE = 30;

export const Story = node({
  name: 'Story',
  key: 'id',
  load(ids, ctx) {
    return Promise.all(ids.map(id => db.select().from(storiesTable).where(eq(storiesTable.id, id)).then(res => res[0] || null)))
  },
  fields: t => ({
    title: t.exposeString('title', { nullable: false }),
    url: t.exposeString('url'),
    domain: t.exposeString('domain'),
    points: t.exposeInt('points', { nullable: false }),
    submitter: t.field({
      type: User,
      nullable: false,
      resolve: (story) => story.submitted_by ?? story.username,
    }),
    comments_count: t.exposeInt('comments_count'),
    created_at: t.expose('created_at', {
      type: 'Date'
    }),
  })
})

addQueryFields((t) => ({
  stories: t.connection({
    type: Story,
    args: {
      page: t.arg.int({ defaultValue: 1, required: true }),
      isNewest: t.arg.boolean({ required: true }),
      type: t.arg.string(),
      q: t.arg.string(),
      limit: t.arg.int()
    },
    nodeNullable: false,
    nullable: false,
    edgesNullable: false,
    resolve: async (_, args) => {
      const [result, hasNextPage, hasPreviousPage] = await Promise.all([
        db.select().from(storiesTable).limit(PER_PAGE).offset((args.page - 1) * PER_PAGE).orderBy(desc(storiesTable.created_at))
          .where(
            storiesWhere({
              isNewest: args.isNewest,
              type: args.type,
              q: args.q,
            })
          )
        ,
        db
          .select({
            id: storiesTable.id,
          })
          .from(storiesTable)
          .where(
            storiesWhere({
              isNewest: args.isNewest,
              type: args.type,
              q: args.q,
            })
          )
          .limit(PER_PAGE)
          .offset(args.page * PER_PAGE).then(res => res.length > 0),
        args.page - 2 < 0 ? false : db
          .select({
            id: storiesTable.id,
          })
          .from(storiesTable)
          .where(
            storiesWhere({
              isNewest: args.isNewest,
              type: args.type,
              q: args.q,
            })
          )
          .limit(PER_PAGE)
          .offset((args.page - 2) * PER_PAGE).then(res => res.length > 0)
      ])

      return {
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
        },
        edges: result.map(story => ({ node: story, cursor: story.id })),
      }
    }
  }, {
    fields: (t) => ({
      totalCount: t.int({
        nullable: false,
        resolve: async () => {
            // high performance, estimative count
            const statement = sql`SELECT reltuples::BIGINT AS estimate
            FROM pg_class
            WHERE relname = ${storiesTableName}`;

          const res = await db.execute(statement);
          if (!res.rows[0]) return 0;
          const row: { estimate: number } = res.rows[0] as any;
          return row.estimate ?? 0;
        }
      })
    })
  })
}))

function storiesWhere({
  isNewest,
  type,
  q,
}: {
  isNewest: boolean;
  type?: string | null;
  q?: string | null;
}) {
  return and(
    isNewest
      ? sql`${storiesTable.submitted_by} IS NOT NULL`
      : and(
        // search includes all stories, with submitters or not
        q != null ? undefined : sql`${storiesTable.submitted_by} IS NULL`,
        type != null ? sql`${storiesTable.type} = ${type}` : undefined
      ),
    q != null && q.length ? ilike(storiesTable.title, `%${q}%`) : undefined
  );
}
