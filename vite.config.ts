import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        basicSsl()
    ],
    server: {
        host: true, // Сразу разрешаем доступ по сети без флага --host
        proxy: {
            '/api': {
                target: 'http://localhost:5000', // Куда перенаправлять запросы
                changeOrigin: true,
                secure: false,
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                // Vite будет автоматически добавлять эту строку в начало каждого scss-файла
                additionalData: `@use "@/styles/_variables.scss" as *;`
            }
        }
    }
})
