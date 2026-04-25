import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

async function build() {
    const header = fs.readFileSync('./src/header.js', 'utf8');
    
    const result = await esbuild.build({
        entryPoints: ['./src/index.js'],
        bundle: true,
        minify: false, // Keep it readable for Tampermonkey users
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
    console.log(`Build successful: ${distPath}`);

    // Sync back to .spec/CODE.md
    let codeMd = fs.readFileSync('./.spec/CODE.md', 'utf8');
    const startMarker = '*`// ==UserScript==`*';
    const endMarker = '`})();`';
    
    // We need to be careful with formatting in CODE.md. 
    // The current CODE.md has code blocks with backticks and asterisks.
    // For simplicity, I will just output the plain code to dist and let the user know.
    // BUT the plan says "synchronized back to .spec/CODE.md".
    
    // Let's try a simple replacement of the code block.
    // Since CODE.md has a specific style (backticks around every line in some versions), 
    // I'll just replace the main sections.
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
