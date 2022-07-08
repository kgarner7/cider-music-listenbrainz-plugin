// Based off of https://github.com/ChaseIngebritson/Cider-Plugin-Template
import { homedir } from "os";

import dotenv from "dotenv";
import copy from "rollup-plugin-copy"
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";

dotenv.config();

let OUTPUT_DIR;

if (process.env.NODE_ENV === "production") {
  OUTPUT_DIR = "dist";
} else {
  if (process.platform === "win32") {
    OUTPUT_DIR = `${homedir()}\\AppData\\Roaming\\Cider\\Plugins\\gh_504963482`;
  } else if (process.platform === "darwin") {
    OUTPUT_DIR = `${homedir()}/Library/Application Support/Cider/Plugins/gh_504963482`
  } else if (process.platform === "linux") {
    if (process.env.FLATPAK === "true") {
      OUTPUT_DIR = `${homedir()}/.var/app/sh.cider.Cider/config/Cider/Plugins/gh_504963482`
    } else {
      OUTPUT_DIR = `${homedir()}/.conig/Cider/Plugins/gh_504963482`
    }
  } else {
    OUTPUT_DIR = "dist";
  }
}

const BASE_SETTINGS = {
  output: {
    dir: OUTPUT_DIR,
    format: "cjs",
    exports: "auto"
  }
}

// I need to make some imports for type safety, and this will strip them out of the renderer.
// Inspired by https://github.com/proteriax/rollup-plugin-ignore
function ignore(mapping) {
  return {
    resolveId(importee) {
      return mapping[importee] ? importee : null
    },
    load(id) {
      if (mapping[id]) {
        return `export default ${mapping[id]}`;
      } else {
        return null;
      }
    },
  }
}

export default [{
  ...BASE_SETTINGS,
  input: "src/index.ts",
  external: ["path", "fs", "electron"],
  plugins: [
    json({ compact: true }),
    commonjs({}),
    babel({ babelHelpers: "bundled", extensions: [".ts"] }),
    nodeResolve({
      // use "jsnext:main" if possible
      // see https://github.com/rollup/rollup/wiki/jsnext:main
      "jsnext:main": true
    }),
    copy({
      targets: [
        {
          src: [
            "package.json",
            "README.md",
            "src/styles/*",
            "src/assets"
          ],
          dest: OUTPUT_DIR
        }
      ]
    })
  ]
}, {
  ...BASE_SETTINGS,
  input: "src/index.frontend.ts",
  plugins: [
    babel({ babelHelpers: "bundled", extensions: [".ts"] }),
    ignore({
      "vue": "Vue"
    })
  ]
}]