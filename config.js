// Formato para generar el bloque @theme de Tailwind v4
StyleDictionary.registerFormat({
    name: 'css/tailwind-theme',
    format: function ({ dictionary }) {
        // Solo variables semánticas (de semantics.json)
        // Suponemos que los tokens semánticos están bajo color.primary, color.success, etc. y provienen de semantics.json
        const semanticNames = ['primary', 'success', 'danger', 'warning', 'info', 'error'];
        const semanticTokens = dictionary.allTokens.filter(
            (token) => token.path[0] === 'color' && semanticNames.includes(token.path[1]),
        );
        return (
            '@theme {\n' +
            semanticTokens.map((token) => `  --${token.name}: ${token.value};`).join('\n') +
            '\n}'
        );
    },
});
import StyleDictionary from 'style-dictionary';

// Simple transform: join path with dash, remove DEFAULT at end
StyleDictionary.registerTransform({
    name: 'name/simple',
    type: 'name',
    transform: function (token) {
        let path = [...token.path];
        if (path[path.length - 1] === 'DEFAULT') {
            path = path.slice(0, -1);
        }
        return path.join('-');
    },
});

// Simple transform group for CSS
StyleDictionary.registerTransformGroup({
    name: 'css/simple',
    transforms: ['attribute/cti', 'name/simple', 'size/px', 'color/css'],
});

// Simple CSS variables format
StyleDictionary.registerFormat({
    name: 'css/variables',
    format: function ({ dictionary, options }) {
        const selector = options?.selector || ':root';
        return `${selector} {\n${dictionary.allTokens
            .map((token) => `  --${token.name}: ${token.value};`)
            .join('\n')}\n}`;
    },
});

// Simple JS format for Tailwind
StyleDictionary.registerFormat({
    name: 'javascript/tailwind-simple',
    format: function ({ dictionary }) {
        // Only handle color, spacing, fontSize, borderRadius, etc.
        const categories = ['color', 'spacing', 'fontSize', 'borderRadius'];
        const result = {};
        for (const cat of categories) {
            result[cat] = {};
        }
        dictionary.allTokens.forEach((token) => {
            const [cat, ...rest] = token.path;
            if (!categories.includes(cat)) return;
            let ref = result[cat];
            let keys = [...rest];
            if (keys[keys.length - 1] === 'DEFAULT') keys = keys.slice(0, -1);
            for (let i = 0; i < keys.length - 1; i++) {
                if (!ref[keys[i]]) ref[keys[i]] = {};
                ref = ref[keys[i]];
            }
            const lastKey = keys[keys.length - 1] || cat;
            ref[lastKey] = `var(--${token.name})`;
        });

        // Build theme object for Tailwind (only color for now, can be extended)
        const theme = {
            colors: result.color || {},
            spacing: result.spacing || {},
            fontSize: result.fontSize || {},
            borderRadius: result.borderRadius || {},
        };

        return `// Auto-generated from Style Dictionary design tokens\nexport const designTokens = ${JSON.stringify(result, null, 4)};\n\nexport const theme = ${JSON.stringify(theme, null, 4)};`;
    },
});

export const config = {
    source: ['tokens/**/*.json'],
    platforms: {
        css: {
            transformGroup: 'css/simple',
            buildPath: 'src/tokens/',
            files: [
                {
                    destination: 'design-tokens.css',
                    format: 'css/variables',
                    options: {
                        selector: ':root',
                    },
                },
                {
                    destination: 'theme.css',
                    format: 'css/tailwind-theme',
                },
            ],
        },
        js: {
            transformGroup: 'css/simple',
            buildPath: 'src/tokens/',
            files: [
                {
                    destination: 'design-tokens.js',
                    format: 'javascript/tailwind-simple',
                },
            ],
        },
    },
};

export default config;
