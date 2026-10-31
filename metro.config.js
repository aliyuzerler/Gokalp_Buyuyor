const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite web (WASM) için wasm dosyalarını asset olarak çözümle
config.resolver.assetExts.push('wasm');

module.exports = config;
