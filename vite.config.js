import { writeFileSync } from "fs";
import { resolve } from "path";
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import dotenv from 'dotenv';
import VueRouter from 'unplugin-vue-router/vite';
import { VueRouterAutoImports } from 'unplugin-vue-router';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
    dotenv.config({ path: __dirname + '/.env' });
    const port = process.env.PORT || 5173;
    const origin = `${process.env.ORIGIN || 'http://localhost'}:${port}`;
    return {
        plugins: [
            VueRouter({
                routesFolder:['src/pages'],
                importMode: 'sync',
            }),
            {
                name:'write-auto-route',
                transform(code, id){
                    const mId = '\0' + 'vue-router/auto-routes';
                    if(id === mId){
                        const fullPath = resolve('src/auto-routes.js');
                        writeFileSync(fullPath, code, 'utf8');                
                    }
                    return { code };
                }
            },
            vue(),
            AutoImport({
                imports: [
                    'vue',
                    VueRouterAutoImports,
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
                registerType: 'autoUpdate', // Options: 'autoUpdate' or 'prompt'
                includeAssets: [
                    'favicon.ico', 'images/earth1.png', 'images/earth2.jpg', 
                    'data/bessel-data-c20.json','data/bessel-data-c19.json',
                ],
                manifest: {
                    name: 'Horizon',
                    short_name: 'Horizon',
                    description: 'Astronomical application build with vsop87 and ELP2000',
                    display: 'standalone',
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
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2,ttf,eot}'],
                    maximumFileSizeToCacheInBytes: 20971520,
                }
            }),
        ],
        resolve: {
            alias: {
                '@/': `${resolve(__dirname, 'src')}/`,
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
    };
});
