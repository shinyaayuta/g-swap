// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Solana wallet-adapter-react-ui に必要な設定
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