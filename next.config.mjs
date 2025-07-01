/** @type {import('next').NextConfig} */
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    config.optimization = {
      ...config.optimization,
      chunkIds: "named",
    };

    if (!dev) {
      config.devtool = "hidden-source-map";

      if (config.output && !isServer) {
        config.output.sourceMapFilename = "[file].map";
      }
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "youlearn-assets.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "dj2sofb25vegx.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "youlearn-content-uploads-dev.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "youlearn-content-uploads.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "static1.makeuseofimages.com",
      },
      {
        protocol: "https",
        hostname: "*.kaltura.com",
      },
      {
        protocol: "https",
        hostname: "info.arxiv.org",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "cdn.sstatic.net",
        port: "",
      },
    ],
  },
};

export default bundleAnalyzer(nextConfig);
