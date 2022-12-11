import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";

export default {
   input: 'dist/bundler.js',
   output: {
      file: 'dist/frontend-db.js',
      format: 'umd',
      name: 'FrontendDB',
   },
   plugins: [
      nodeResolve({
         extensions: ['.ts', '.js'],
      }),
      babel({
         compact: false,
         babelHelpers: 'bundled',
         extensions: ['.ts', '.js'],
         presets: ["@babel/preset-typescript"/* , "@babel/preset-env" */]
      }),
      commonjs(),
      replace({
         preventAssignment: false,
         'process.env.NODE_ENV': '"production"',
      }),
      // terser()
   ]
}