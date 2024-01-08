export const runtime = "edge";
export const revalidate = 60;

import { ImageResponse } from "next/og";
import { getStories, getStoriesCount } from "@/components/stories";
import JSTimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

let timeAgo: JSTimeAgo | null = null;
const numberFormatter = new Intl.NumberFormat("en-US");

/**
 * v0 by Vercel.
 * @see https://v0.dev/r/siAyEHjJLnB
 */

export default async function MainOG() {
  if (timeAgo === null) {
    JSTimeAgo.addDefaultLocale(en);
    timeAgo = new JSTimeAgo("en-US");
  }

  const stories = await getStories({
    isNewest: false,
    page: 1,
    type: "story",
    q: null,
    limit: 3,
  });

  const count = await getStoriesCount();

  // fonts
  const inter300 = fetch(
    new URL(
      `../../node_modules/@fontsource/inter/files/inter-latin-300-normal.woff`,
      import.meta.url
    )
  ).then((res) => res.arrayBuffer());

  const inter600 = fetch(
    new URL(
      `../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff`,
      import.meta.url
    )
  ).then((res) => res.arrayBuffer());

  const now = Date.now();
  return new ImageResponse(
    (
      <div tw="bg-[#f6f6ef] flex h-full w-full" style={font("Inter 300")}>
        <div tw="flex flex-col justify-between h-full w-full">
          <div tw="p-4 pt-8 px-8 pb-0 flex flex-row items-center w-full text-3xl">
            <div tw="flex items-center">
              <span
                tw="border-4 border-[#FF9966] p-1 mr-4 text-[#FF9966] w-14 h-14 flex items-center justify-center"
                style={font("Inter 600")}
              >
                N
              </span>
              <span tw="text-[#FF9966]" style={font("Inter 600")}>
                Next AI News
              </span>
            </div>

            <div tw="flex items-center text-gray-600 ml-auto">
              next-ai-news.vercel.app
            </div>
          </div>
          <div tw="p-4 px-8 flex flex-col justify-center flex-1">
            <ul tw="flex flex-col">
              {stories.map((story, n) => (
                <li key={story.id} tw="text-3xl flex items-start mb-5">
                  <div
                    tw="flex w-18 pr-4 text-right justify-end text-[#FF9966] flex-shrink-0"
                    style={font("Inter 600")}
                  >
                    <span>{n + 1}.</span>
                  </div>
                  <div tw="flex flex-col">
                    <span
                      tw="text-[#FF9966] mb-1 max-w-270 max-h-10 overflow-hidden"
                      style={font("Inter 600")}
                    >
                      {story.title}
                    </span>
                    <div tw="flex text-gray-600">
                      {story.points} points by{" "}
                      {story.submitted_by ?? story.username}{" "}
                      {timeAgo!.format(story.created_at)} | flag | hide |{" "}
                      {story.comments_count} comments
                    </div>
                  </div>
                </li>
              ))}

              <li tw="text-3xl flex items-start mb-5">
                <div tw="flex w-18 pr-4 text-right justify-end text-[#FF9966] flex-shrink-0"></div>
                <div tw="flex flex-col text-gray-600">
                  {numberFormatter.format(count)} more
                </div>
              </li>
            </ul>
          </div>
          <div tw="p-4 px-8 pb-8 pt-6 bg-[#eaeae3] flex">
            <div tw="text-gray-600 flex items-center text-3xl justify-center w-full">
              <span>
                Hacker News, but
                <span tw="px-2" style={font("Inter 600")}>
                  AI
                </span>{" "}
                generated. Built with{" "}
                <span tw="px-2" style={font("Inter 600")}>
                  Next.js App Router
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter 300",
          data: await inter300,
        },
        {
          name: "Inter 600",
          data: await inter600,
        },
      ],
    }
  );
}

// lil helper for more succinct styles
function font(fontFamily: string) {
  return { fontFamily };
}
