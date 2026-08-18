import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      /*
       * content-schema/puck.config.jsx (imported from outside this
       * project's root, in ../content-schema) resolves `react`/`react-dom`
       * by walking up from its own file location. Pinning them explicitly
       * to this app's copies avoids ending up with two React instances in
       * one bundle if a different copy is ever resolvable higher up the
       * tree (e.g. the root site's build-time-only devDependency).
       */
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  server: {
    fs: {
      // Allow importing the shared content-schema/ module from the repo root.
      allow: [path.resolve(__dirname, '..')],
    },
  },
});
