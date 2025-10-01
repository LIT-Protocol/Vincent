import { MarkdownPageEvent } from "typedoc-plugin-markdown";

export function load(app) {
    // Detect SDK name from output directory
    const outDir = app.options.getValue('out');
    let sdkName = 'app-sdk';
    if (outDir.includes('ability-sdk')) {
        sdkName = 'ability-sdk';
    } else if (outDir.includes('contracts-sdk')) {
        sdkName = 'contracts-sdk';
    }

    // Add frontmatter title to every page
    app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
        page.frontmatter = {
            title: page.model?.name,
            ...page.frontmatter,
        };
    });

    app.renderer.on(MarkdownPageEvent.END, (page) => {
        // Get current page directory (not including filename)
        const pagePath = page.url;
        const pathParts = pagePath.split('/').filter(p => p);
        // Remove the filename to get just the directory path
        const dirParts = pathParts.slice(0, -1);

        // Remove .mdx extensions from links so they work with Mintlify
        page.contents = page.contents.replace(/\.mdx/g, "");

        // Convert relative links to absolute paths for Mintlify
        // This handles both ../ and ../../ relative paths
        page.contents = page.contents.replace(/\]\((\.\.\/)+([^)]+)\)/g, (match, relativePath, targetPath) => {
            // For app-sdk, check if this is a cross-module reference
            if (sdkName === 'app-sdk') {
                const modules = ['abilityClient', 'jwt', 'webAuthClient', 'expressMiddleware'];
                const targetModule = targetPath.split('/')[0];

                if (modules.includes(targetModule) && dirParts.length > 0 && dirParts[0] !== targetModule) {
                    // This is a cross-module reference - link directly to the target module
                    const absolutePath = `/api-reference/${sdkName}/` + targetPath;
                    return `](${absolutePath})`;
                }
            }

            // Count how many levels up we need to go
            const levelsUp = (relativePath.match(/\.\.\//g) || []).length;

            // Start from current directory and go up the specified levels
            const resolvedParts = dirParts.slice(0, -levelsUp);

            // Add api-reference/{sdk} prefix
            const absolutePath = `/api-reference/${sdkName}/` + (resolvedParts.length > 0 ? resolvedParts.join('/') + '/' : '') + targetPath;

            return `](${absolutePath})`;
        });

        // Add "./" to beginning of same-directory links so they open in same tab
        page.contents = page.contents.replace(/\]\((?!http|\/|\.)/g, "](./");
    });
}
