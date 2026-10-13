const fs = require('fs');
const path = require('path');

function encodeMermaid(code) {
  const state = {
    code: code.trim(),
    mermaid: "{\n  \"theme\": \"default\"\n}",
    updateEditor: false,
    autoSync: true,
    updateDiagram: false
  };
  const jsonStr = JSON.stringify(state);
  // Base64 encode
  const base64 = Buffer.from(jsonStr).toString('base64');
  return `https://mermaid.ink/img/${base64}`;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove <div>s in user guide
  if (filePath.includes('GUIA_DE_USUARIO')) {
    content = content.replace(/<div align="center">/g, '');
    content = content.replace(/<\/div>/g, '');
  }

  // Find all mermaid blocks
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  content = content.replace(mermaidRegex, (match, code) => {
    const url = encodeMermaid(code);
    return `![Diagrama](${url})`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${filePath}`);
}

const docsDir = path.join(__dirname, 'docs');
processFile(path.join(docsDir, 'GUIA_DE_USUARIO.md'));
processFile(path.join(docsDir, 'DOCUMENTACION_TECNICA.md'));
