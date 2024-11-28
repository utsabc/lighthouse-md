const fs = require('fs').promises;
const path = require('path');

// Configuration
const outputFile = 'combined_project.txt';
const excludedDirs = [
  'node_modules',
  '.git',
  '.vscode',
  'build',
  'package-lock.json',
  'prettierrc',
  '.prettierignore',
];
const excludedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', 
                          '.zip', '.tar', '.gz', '.mp4', '.mp3', '.wav', '.avi'];
const maxFileSizeBytes = 1024 * 1024; // 1MB

async function isFileBinary(filePath) {
    try {
        const buffer = await fs.readFile(filePath);
        // Check for null bytes in first 1024 bytes
        for (let i = 0; i < Math.min(1024, buffer.length); i++) {
            if (buffer[i] === 0) return true;
        }
        return false;
    } catch (error) {
        console.error(`Error checking if file is binary: ${filePath}`, error);
        return true;
    }
}

async function shouldProcessFile(filePath) {
    try {
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath);
        
        // Skip files that are too large
        if (stats.size > maxFileSizeBytes) {
            console.log(`Skipping large file: ${filePath}`);
            return false;
        }
        
        // Skip excluded extensions
        if (excludedExtensions.includes(ext.toLowerCase())) {
            return false;
        }
        
        // Skip binary files
        const isBinary = await isFileBinary(filePath);
        return !isBinary;
    } catch (error) {
        console.error(`Error checking file: ${filePath}`, error);
        return false;
    }
}

async function processDirectory(dirPath) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        let allContents = [];
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            // Skip excluded directories
            if (entry.isDirectory()) {
                if (!excludedDirs.includes(entry.name)) {
                    const subDirContents = await processDirectory(fullPath);
                    allContents = allContents.concat(subDirContents);
                }
                continue;
            }
            
            // Process files
            if (entry.isFile() && await shouldProcessFile(fullPath)) {
                try {
                    const content = await fs.readFile(fullPath, 'utf8');
                    allContents.push({
                        path: fullPath,
                        content: content
                    });
                } catch (error) {
                    console.error(`Error reading file: ${fullPath}`, error);
                }
            }
        }
        
        return allContents;
    } catch (error) {
        console.error(`Error processing directory: ${dirPath}`, error);
        return [];
    }
}

async function combineProject() {
    try {
        console.log('Starting project combination...');
        
        // Process all files
        const allContents = await processDirectory('.');
        
        // Prepare the combined content
        const combinedContent = allContents.map(file => {
            return `\n# File: ${file.path}\n` +
                   '----------------------------------------\n' +
                   file.content +
                   '\n----------------------------------------\n';
        }).join('\n');
        
        // Write to output file
        await fs.writeFile(outputFile, combinedContent, 'utf8');
        
        console.log(`Successfully combined ${allContents.length} files into ${outputFile}`);
    } catch (error) {
        console.error('Error combining project:', error);
    }
}

// Run the script
combineProject().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});