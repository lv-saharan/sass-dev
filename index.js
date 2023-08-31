#!/usr/bin/env node
import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import fs from "fs";
import path from "path";

const entryRoots = process.argv.splice(2);

if (entryRoots.length == 0) {
  entryRoots.push("./");
}

const findEntryPoints = (dirPath) => {
  const files = [];
  if (fs.existsSync(dirPath)) {
    try {
      const dirStat = fs.statSync(dirPath);
      if (dirStat.isDirectory()) {
        fs.readdirSync(dirPath).forEach((file) => {
          const filePath = path.join(dirPath, file);
          files.push(...findEntryPoints(filePath));
        });
      } else {
        if (path.extname(dirPath) == ".scss") {
          files.push(dirPath);
        }
      }
    } catch (exc) {
      console.warn("finding files error",exc)
    }
  }

  return files;
};

function rebuild() {
  entryRoots.forEach(async (dir) => {
    const entryPoints = findEntryPoints(dir);
    console.log(`ROOT ${dir} SCSS:`, entryPoints);
    let ctx = await esbuild.context({
      entryPoints,
      bundle: true,
      outbase: dir,
      outdir: path.resolve(dir),
      entryNames: "[dir]/[name]",
      external: [
        "*.jpg",
        "*.png",
        "*.gif",
        "*.bmp",
        "*.ico",
        "*.svg",
        "*.woff",
        "*.woff2",
        "*.ttf",
        "*.ttl",
        "*.webp",
      ],
      plugins: [sassPlugin({})],
    });
    try {
      await ctx.rebuild();
    } catch (exc) {
      //build error
    }
    console.log(`Build  ${dir} OK ！`);
  });
}

rebuild();

import Watcher from "watcher";

const watcher = new Watcher(
  entryRoots,
  {
    ignoreInitial: true,
    recursive: true,
    debounce: 2000,
    depth: 20,
    renameDetection: true,
    ignore(targetPath) {
      if (fs.existsSync(targetPath)) {
        try {
          const dirStat = fs.statSync(targetPath);
          if (dirStat.isDirectory()) {
            return false;
          }
          return !targetPath.endsWith(".scss");
        } catch (exc) {
          console.warn("ignore files error", exc);
        }
      }
      return true;
    },
  },
  (event, targetPath, targetPathNext) => {
    //console.log(event, targetPath, targetPathNext);
    rebuild();
  }
);
