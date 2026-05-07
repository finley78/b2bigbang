// JSX → JS 사전 컴파일 (esbuild)
// 사용법: npm run build (한 번 빌드) / npm run watch (자동 빌드)

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const FILES = [
  'Utils.jsx',
  'TopNav.jsx',
  'HomePage.jsx',
  'Pages.jsx',
  'StudentPortal.jsx',
  'TeacherPortal.jsx',
  'AdminPanel.jsx',
];

const isWatch = process.argv.includes('--watch');

const baseOptions = {
  loader: { '.jsx': 'jsx' },
  bundle: false,
  // 식별자(함수명) 보존 — HomePage, MainNav 등 전역 함수가 다른 파일에서 호출되므로
  // 공백/문법만 압축해서 안전하게
  minifyWhitespace: true,
  minifySyntax: true,
  target: 'es2020',
  logLevel: 'info',
};

// SPA fallback: GitHub Pages가 /auth/naver-callback 같은 임의 경로 요청 시 404.html을 서빙하므로
// 404.html을 index.html과 동일하게 유지해 앱이 부팅되도록 함
function syncSpaFallback() {
  try {
    const src = path.join(__dirname, 'index.html');
    const dst = path.join(__dirname, '404.html');
    if (fs.existsSync(src)) fs.copyFileSync(src, dst);
  } catch (e) {
    console.warn('404.html sync skipped:', e.message);
  }
}

async function buildOnce() {
  const start = Date.now();
  await Promise.all(
    FILES.map((f) =>
      esbuild.build({
        ...baseOptions,
        entryPoints: [f],
        outfile: f.replace(/\.jsx$/, '.js'),
      })
    )
  );
  syncSpaFallback();
  console.log(`OK Built ${FILES.length} files in ${Date.now() - start}ms`);
}

async function watch() {
  const contexts = await Promise.all(
    FILES.map((f) =>
      esbuild.context({
        ...baseOptions,
        entryPoints: [f],
        outfile: f.replace(/\.jsx$/, '.js'),
      })
    )
  );
  await Promise.all(contexts.map((c) => c.watch()));
  console.log(`Watching ${FILES.length} JSX files...`);
}

(async () => {
  // 빠진 입력 파일 검증
  const missing = FILES.filter((f) => !fs.existsSync(path.join(__dirname, f)));
  if (missing.length) {
    console.error('Missing input files:', missing);
    process.exit(1);
  }

  try {
    if (isWatch) {
      await watch();
    } else {
      await buildOnce();
    }
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
})();
