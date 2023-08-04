#!/usr/bin/env node
import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import fs from "fs";
import path from "path";
const entryRoots = process.argv.splice(2);
// console.log("args",process.argv)

const findEntryPoints = (dirPath) => {
  const dirStat = fs.statSync(dirPath);
  const files = [];
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
  return files;
};

entryRoots.forEach(async (dir) => {
  const entryPoints = findEntryPoints(dir);
  console.log(`ROOT ${dir} SCSS:`, entryPoints);
  let ctx = await esbuild.context({
    entryPoints,
    bundle: true,
    outbase: dir,
    outdir: path.resolve(dir),
    entryNames: "[dir]/[name]",
    plugins: [
      sassPlugin({}),
      {
        name: "watch-plugin",
        setup(build) {
          build.onStart(() => {
            console.log(
              `starting build ${dir} ..............................................`
            );
          });
          build.onEnd((result) => {
            if (result.errors.length == 0) {
              console.log(
                `build ${dir} success ..............................................`
              );
            } else {
              // console.log("build error", result.errors);
            }
          });
        },
      },
    ],
  });

  await ctx.watch();
  console.log(`Begin watching ${dir}`);
});
