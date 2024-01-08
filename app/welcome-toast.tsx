"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function WelcomeToast() {
  useEffect(() => {
    // ignore if screen height is too small
    if (window.innerHeight < 850) return;
    if (!document.cookie.includes("welcome-toast=3")) {
      toast("🤖 Welcome to Next AI News!", {
        id: "welcome-toast",
        duration: Infinity,
        onDismiss: () => {
          document.cookie += "welcome-toast=3;max-age=31536000";
        },
        description: (
          <>
            Every few min, AI generates stories and comments.
            <hr className="my-2" /> This is an example of a full-stack,
            streaming server-rendered Next.js app.{" "}
            <a
              href="https://github.com/rauchg/next-ai-news"
              className="text-[#CC5500] hover:underline"
              target="_blank"
            >
              Get the Source
            </a>
            .
          </>
        ),
      });
    }
  }, []);

  return null;
}
