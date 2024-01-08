/** @type {import('next').NextConfig} */
export default {
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
