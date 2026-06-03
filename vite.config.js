import path from 'node:path'

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import dotenv from 'dotenv';
import AutoRoute from './plugins/vite-auto-route';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
    dotenv.config({ path: __dirname + '/.env' });
    const port = process.env.PORT || 5173;
    const origin = `${process.env.ORIGIN || 'http://localhost'}:${port}`;
    const base = process.env.BASE_URL || '/';
    return {
        plugins: [
            AutoRoute({
                sourcePath: [
                    { path: 'src/pages' },
                ],
                layout: {
                    default: 'src/layouts/Default.vue',
                    main: 'src/layouts/Main.vue',
                },
                output: 'src/auto-routes.js',
            }),
            vue(),
            AutoImport({
                imports: [
                    'vue',
                    {
                        'moment': [
                            ['default', 'moment'],
                        ],
                    },
                ],
                dts: 'src/auto-imports.d.ts',
                dirs: [
                    'src/composables',
                ],
                vueTemplate: true,
            }),
            Components({
                extensions: ['vue',],
                include: [/\.vue$/, /\.vue\?vue/],
                dts: 'src/components.d.ts',
                dirs: [
                    'src/components',
                ],
                deep: false,
            }),
            VitePWA({
                registerType: 'prompt', // Options: 'autoUpdate' or 'prompt'
                includeAssets: ['favicon.ico'],
                manifest: {
                    name: 'Horizon',
                    short_name: 'Horizon',
                    description: 'Astronomical application build with vsop87 and ELP2000',
                    theme_color: '#4dbf85',
                    icons: [
                        {
                            src: 'icon.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'icon.png',
                            sizes: '512x512',
                            type: 'image/png'
                        },
                        {
                            src: 'icon.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable'
                        }
                    ]
                },
                workbox: {
                    maximumFileSizeToCacheInBytes: 20971520,
                }
            }),
        ],
        resolve: {
            alias: {
                '@/': `${path.resolve(__dirname, 'src')}/`,
            }
        },
        build: {
            manifest: true,
            sourcemap: true,
        },
        server: {
            strictPort: true,
            port: port,
            origin: origin,
            hmr: {
                host: 'localhost',
            },
        },
        css: {
            preprocessorOptions: {
                sass: {
                    api: 'modern-compiler' // or "modern"
                }
            }
        },
        publicDir: 'src/public',
        base: base,
    };
});
