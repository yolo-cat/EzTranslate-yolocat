import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

async function build() {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    let header = fs.readFileSync('./src/header.js', 'utf8');
    
    // 同步 package.json 版本到 header
    header = header.replace(/@version\s+[\d\.]+/, `@version      ${pkg.version}`);

    const result = await esbuild.build({
        entryPoints: ['./src/index.js'],
        bundle: true,
        minify: false, 
        format: 'iife',
        charset: 'utf8',
        write: false,
        globalName: 'ImmersiveTranslation',
    });

    const bundledCode = result.outputFiles[0].text;
    const finalCode = header + '\n' + bundledCode;

    if (!fs.existsSync('./dist')) {
        fs.mkdirSync('./dist');
    }

    const distPath = './dist/immersive-translation.user.js';
    fs.writeFileSync(distPath, finalCode);
    console.log(`[Build] Success: ${distPath} (v${pkg.version})`);

    // 同步更新 .spec/CODE.md
    updateSpecCode(finalCode);
}

function updateSpecCode(code) {
    const specPath = './.spec/CODE.md';
    if (!fs.existsSync(specPath)) return;

    let content = fs.readFileSync(specPath, 'utf8');
    const marker = '```javascript';
    const parts = content.split(marker);
    
    if (parts.length >= 2) {
        const afterCode = parts[1].split('```')[1] || '';
        const newContent = parts[0] + marker + '\n' + code + '\n```' + afterCode;
        fs.writeFileSync(specPath, newContent);
        console.log(`[Build] Synchronized to ${specPath}`);
    }
}

build().catch(err => {
    console.error('[Build] Failed:', err);
    process.exit(1);
});
