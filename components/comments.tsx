import { db, usersTable, commentsTable } from "@/app/db";
import { sql, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/app/auth";
import { nanoid } from "nanoid";
import { TimeAgo } from "@/components/time-ago";

async function getComments({
  storyId,
  author,
}: {
  storyId?: string;
  author?: string;
}) {
  const comments = await db
    .select({
      id: commentsTable.id,
      comment: commentsTable.comment,
      username: commentsTable.username,
      author: commentsTable.author,
      author_username: usersTable.username,
      created_at: commentsTable.created_at,
      parent_id: commentsTable.parent_id,
    })
    .from(commentsTable)
    .where(
      storyId != null
        ? sql`${commentsTable.story_id} = ${storyId}`
        : author != null
        ? sql`${commentsTable.author} = ${author}`
        : sql`1 = 1`
    )
    .orderBy(desc(commentsTable.created_at))
    .leftJoin(usersTable, sql`${usersTable.id} = ${commentsTable.author}`)
    .limit(50);
  return comments;
}

// something chatgpt suggested when I asked it how to extract
// the inferred Comment type from a Promise<Comment[]>
type Comment = ReturnType<typeof getComments> extends Promise<
  Array<infer ArrayType>
>
  ? ArrayType
  : never;

type CommentWithChildren = Comment & { children?: Comment[] };

export async function Comments({
  storyId,
  author,
}: {
  storyId?: string;
  author?: string;
}) {
  const session = await auth();
  const rid = headers().get("x-vercel-id") ?? nanoid();

  console.time(`fetch comments ${storyId} (req: ${rid})`);
  const comments = await getComments({
    storyId,
    author,
  });
  console.timeEnd(`fetch comments ${storyId} (req: ${rid})`);

  const commentsWithChildren = [] as CommentWithChildren[];
  const commentIndex = {} as Record<string, CommentWithChildren>;

  for (const comment of comments) {
    commentIndex[comment.id] = comment;
  }

  for (const comment of comments) {
    if (comment.parent_id == null) {
      commentsWithChildren.push(comment);
    } else {
      const parent = commentIndex[comment.parent_id];

      // there is a chance the parent comment hasn't been fetched yet
      // ignore for now
      if (parent) {
        if (parent.children == null) {
          parent.children = [];
        }
        parent.children.push(comment);
      }
    }
  }

  commentsWithChildren.sort((a, b) => {
    return b.created_at.getTime() - a.created_at.getTime();
  });

  return commentsWithChildren.length === 0 ? (
    <div>No comments to show</div>
  ) : (
    <CommentList
      author={author}
      loggedInUserId={session?.user?.id}
      comments={commentsWithChildren}
    />
  );
}

export function CommentList({
  author,
  loggedInUserId,
  comments,
}: {
  author?: string;
  loggedInUserId?: string;
  comments: CommentWithChildren[];
}) {
  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment, i) => (
        <CommentItem
          key={comment.id}
          i={i}
          loggedInUserId={loggedInUserId}
          author={author}
          comment={comment}
        />
      ))}
    </ul>
  );
}

function CommentItem({
  i,
  author,
  loggedInUserId,
  comment,
}: {
  i: number;
  author?: string;
  loggedInUserId?: string;
  comment: CommentWithChildren;
}) {
  const now = Date.now();
  return (
    <li>
      <div className="flex items-start">
        <div className="flex flex-col items-center mr-1 gap-y-1">
          {loggedInUserId === comment.author ? (
            <span className="text-2xl text-[#FF9966] cursor-pointer">*</span>
          ) : (
            <>
              <svg
                height="12"
                viewBox="0 0 32 16"
                width="12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m2 27 14-29 14 29z" fill="#999" />
              </svg>
              <svg
                className="transform rotate-180"
                height="12"
                viewBox="0 0 32 16"
                width="12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m2 27 14-29 14 29z" fill="#999" />
              </svg>
            </>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1 text-sm text-gray-600">
              {comment.author_username ?? comment.username}{" "}
              <TimeAgo date={comment.created_at} now={now} />{" "}
              <span aria-hidden={true}>|</span>{" "}
              {i > 0 && (
                <>
                  <span title="Unimplemented">prev</span>{" "}
                  <span aria-hidden={true}>| </span>{" "}
                </>
              )}
              <span title="Unimplemented">next</span>
            </p>
            <p className="mb-1">{comment.comment}</p>
          </div>
          {comment.children && (
            <CommentList
              loggedInUserId={loggedInUserId}
              author={author}
              comments={comment.children}
            />
          )}
        </div>
      </div>
    </li>
  );
}
