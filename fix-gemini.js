const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      if (content.includes('gemini-2.5-flash')) {
        content = content.replace(/gemini-2.5-flash/g, 'gemini-1.5-flash');
        changed = true;
      }
      
      // Fix markdown wrapped JSON parsing
      if (content.includes('JSON.parse(textOutput)')) {
        content = content.replace('JSON.parse(textOutput)', 'JSON.parse(textOutput.replace(/```(?:json)?/gi, "").trim())');
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', fullPath);
      }
    }
  }
}

processDir('./app/api/admin');
