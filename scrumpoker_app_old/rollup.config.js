import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import livereload from "rollup-plugin-livereload";
import scss from "rollup-plugin-scss";

export default {
  input: "src/main.js",
  output: [
    {
      file: "public/app/scrumpoker/bundle.js",
      format: "iife",
      sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    scss({ watch: ["src/style"] }),
    !process.env.ROLLUP_WATCH && terser(),
    process.env.ROLLUP_WATCH && livereload()
  ],
};
