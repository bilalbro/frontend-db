import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";

export default {
   input: 'src/index.ts',
   output: {
      file: 'dist/frontend-db.js',
      // file: 'dist/frontend-db.min.js',
      format: 'umd',
      name: 'window',
      exports: 'named',
      extend: true,
   },
   plugins: [
      nodeResolve({
         extensions: ['.ts', '.js'],
      }),
      babel({
         compact: false,
         babelHelpers: 'bundled',
         extensions: ['.ts', '.js'],
      }),
      commonjs(),
      replace({
         preventAssignment: false,
         'process.env.NODE_ENV': '"production"',
      }),
      // terser()
   ]
}