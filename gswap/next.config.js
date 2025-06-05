// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                "fs": false,
                "path": false,
                "os": false,
                "crypto": require.resolve("crypto-browserify"),
                "stream": require.resolve("stream-browserify"),
            };
        }
        return config;
    },
};

module.exports = nextConfig;