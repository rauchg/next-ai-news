import { nextFusePlugin } from 'fuse/next/plugin'

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    ppr: true,
  },
  rewrites: () => [
    {
      source: "/newest",
      destination: "/?newest=1",
    },
    {
      source: "/newcomments",
      destination: "/threads?new=1",
    },
    {
      source: "/ask",
      destination: "/?type=ask",
    },
    {
      source: "/show",
      destination: "/?type=show",
    },
    {
      source: "/jobs",
      destination: "/?type=jobs",
    },
  ],
};

export default nextFusePlugin()(config)