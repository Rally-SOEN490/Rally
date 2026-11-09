// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../shared")];

module.exports = config;
