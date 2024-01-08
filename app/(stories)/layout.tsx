import { Suspense } from "react";
import Link from "next/link";
import { SearchInput } from "./search-input";
import { AuthNav, SubmitLink, ThreadsLink } from "./auth-nav";

export const metadata = {
  openGraph: {
    title: "Next AI News",
    url: "https://next-ai-news.vercel.app",
    siteName: "Next AI News",
  },
  twitter: {
    title: "Next AI News",
    card: "summary_large_image",
    site: "@rauchg",
    creator: "@rauchg",
  },
};

export default function HNLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:px-20 md:py-2 flex flex-col h-screen text-[15px] leading-[18px]">
      <header className="flex items-center justify-between py-2 md:py-1 px-1 pr-2 bg-[#FF9966] text-sm gap-2">
        <div className="flex items-center">
          <Link prefetch={true} href="/">
            <span className="border border-white p-1 mr-2 text-white w-6 h-6 flex-shrink-0 flex items-center justify-center">
              <span>N</span>
            </span>
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <Link prefetch={true} href="/" className="mr-3">
              <h1 className="text-base font-bold leading-tight whitespace-nowrap">
                Next AI News
              </h1>
            </Link>
            <nav>
              <ul className="inline-flex leading-tight tracking-tight flex-wrap">
                <li>
                  <Link
                    prefetch={true}
                    className="hover:underline"
                    href="/newest"
                  >
                    new
                  </Link>
                </li>
                <li className="px-1">|</li>
                <li>
                  <Suspense
                    fallback={
                      <Link
                        prefetch={true}
                        className="hover:underline"
                        href="/login/next/threads"
                      >
                        threads
                      </Link>
                    }
                  >
                    <ThreadsLink />
                  </Suspense>
                </li>
                <li className="px-1">|</li>
                <li>
                  <Link
                    prefetch={true}
                    className="hover:underline"
                    href="/newcomments"
                  >
                    comments
                  </Link>
                </li>
                <li className="px-1">|</li>
                <li>
                  <Link
                    prefetch={true}
                    className="hover:underline"
                    href="/show"
                  >
                    show
                  </Link>
                </li>
                <li className="px-1">|</li>
                <li>
                  <Link prefetch={true} className="hover:underline" href="/ask">
                    ask
                  </Link>
                </li>
                <li className="px-1">|</li>
                <li>
                  <Link
                    prefetch={true}
                    className="hover:underline"
                    href="/jobs"
                  >
                    jobs
                  </Link>
                </li>
                <li className="px-1">|</li>
                <li>
                  <Suspense
                    fallback={
                      <Link
                        prefetch={true}
                        className="hover:underline"
                        href="/login/next/submit"
                      >
                        submit
                      </Link>
                    }
                  >
                    <SubmitLink />
                  </Suspense>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-end min-w-[30%] md:min-w-[inherit] md:items-center">
          <Suspense fallback={null}>
            <AuthNav />
          </Suspense>
        </div>
      </header>

      <main className="py-4 px-1 md:px-2 flex-grow bg-[#f6f6ef]">
        {children}
      </main>

      <footer
        className="flex flex-col items-center justify-center p-4 border-t-2 border-t-[#FF9966]
              text-black bg-[#f6f6ef]"
      >
        <nav>
          <ul className="flex flex-wrap justify-center gap-1 md:gap-2 text-sm">
            <li>
              <span className="cursor-default">Guidelines</span>
            </li>
            <li aria-hidden="true">|</li>
            <li>
              <span className="cursor-default">FAQ</span>
            </li>
            <li aria-hidden="true">|</li>
            <li>
              <span className="cursor-default">Lists</span>
            </li>
            <li aria-hidden="true">|</li>
            <li>
              <span className="cursor-default">API</span>
            </li>
            <li aria-hidden="true">|</li>
            <li>
              <span className="cursor-default">Security</span>
            </li>
            <li aria-hidden="true">|</li>
            <li>
              <span className="cursor-default">Legal</span>
            </li>
            <li aria-hidden="true">|</li>
            <li>
              <span className="cursor-default">Contact</span>
            </li>
          </ul>
        </nav>
        <div className="w-full max-w-md mx-auto mt-2 ">
          <form>
            <div className="relative flex justify-center">
              <SearchInput />
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}
