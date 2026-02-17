// Test script to verify MDX files can be read
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const BLOGS_PATH = path.join(process.cwd(), 'content', 'blogs');

console.log('Testing MDX file reading...\n');
console.log('Blogs path:', BLOGS_PATH);
console.log('Path exists:', fs.existsSync(BLOGS_PATH));

if (fs.existsSync(BLOGS_PATH)) {
    const files = fs.readdirSync(BLOGS_PATH);
    console.log('\nFiles found:', files.length);

    const mdxFiles = files.filter(f => f.endsWith('.mdx') && !f.startsWith('_'));
    console.log('MDX files (excluding templates):', mdxFiles.length);
    console.log('Files:', mdxFiles);

    // Test reading one file
    if (mdxFiles.length > 0) {
        const testFile = mdxFiles[0];
        console.log('\nTesting file:', testFile);

        const filePath = path.join(BLOGS_PATH, testFile);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);

        console.log('\nFrontmatter:');
        console.log(JSON.stringify(data, null, 2));
        console.log('\nContent length:', content.length, 'characters');
        console.log('\nFirst 200 characters of content:');
        console.log(content.substring(0, 200));
    }
}
