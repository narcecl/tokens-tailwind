// Style Dictionary config file

import StyleDictionary from 'style-dictionary';

// Custom transform to remove shadcn prefix and handle DEFAULT tokens
StyleDictionary.registerTransform({
    name: 'name/remove-shadcn-prefix',
    type: 'name',
    transform: function (token) {
        let path = [...token.path];

        // If token path starts with 'shadcn', remove the prefix
        if (path[0] === 'shadcn') {
            path = path.slice(1);
        }

        // If token ends with 'DEFAULT', remove it (it becomes the base token)
        if (path[path.length - 1] === 'DEFAULT') {
            path = path.slice(0, -1);
        }

        return path.join('-');
    },
});

// Custom transform group for CSS with shadcn prefix removal
StyleDictionary.registerTransformGroup({
    name: 'css/shadcn',
    transforms: ['attribute/cti', 'name/remove-shadcn-prefix', 'size/px', 'color/css'],
});

// Custom transform group for JavaScript with shadcn prefix removal
StyleDictionary.registerTransformGroup({
    name: 'js/shadcn',
    transforms: ['attribute/cti', 'name/remove-shadcn-prefix', 'size/px', 'color/css'],
});

// Custom CSS format that processes shadcn tokens last to override conflicts
StyleDictionary.registerFormat({
    name: 'css/variables-light',
    format: function ({ dictionary, options }) {
        const selector = options?.selector || ':root';

        // Separate shadcn tokens from other tokens
        const shadcnTokens = dictionary.allTokens.filter((token) => token.path[0] === 'shadcn');
        const otherTokens = dictionary.allTokens.filter((token) => token.path[0] !== 'shadcn');

        // Create a map to track which tokens will be overridden
        const tokenMap = new Map();

        // First, add all non-shadcn tokens
        otherTokens.forEach((token) => {
            tokenMap.set(token.name, token);
        });

        // Then, add shadcn tokens (these will override any existing tokens with the same name)
        shadcnTokens.forEach((token) => {
            tokenMap.set(token.name, token);
        });

        // Convert back to array and sort for consistent output
        const finalTokens = Array.from(tokenMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );

        return `${selector} {\n${finalTokens
            .map((token) => `  --${token.name}: ${token.value};`)
            .join('\n')}\n}`;
    },
});

// Custom format for generating the nested object structure that Tailwind expects
StyleDictionary.registerFormat({
    name: 'javascript/tailwind-tokens',
    format: function ({ dictionary }) {
        const CATEGORY_MAP = {
            // special case for colors
            color: {
                target: 'color',
                transform: (token, keys, result) => {
                    let colorPath = result.color;

                    // Remove 'color' prefix
                    if (keys[0] === 'color') keys.shift();

                    // Handle DEFAULT tokens
                    if (keys[keys.length - 1] === 'DEFAULT') {
                        keys = keys.slice(0, -1);
                    }

                    // Navigate/create nested structure, handling conflicts
                    for (let i = 0; i < keys.length - 1; i++) {
                        const key = keys[i];
                        if (!colorPath[key]) {
                            colorPath[key] = {};
                        } else if (typeof colorPath[key] === 'string') {
                            // Convert existing string to object structure
                            colorPath[key] = {};
                        }
                        colorPath = colorPath[key];
                    }

                    const lastKey = keys[keys.length - 1];
                    colorPath[lastKey] = `var(--${token.name})`;
                },
            },

            // special case for shadcn tokens
            shadcn: {
                target: 'color',
                transform: (token, keys, result) => {
                    let colorPath = result.color;

                    // Remove 'shadcn' prefix
                    keys = keys.slice(1);

                    // Navigate/create nested structure
                    const basePath = keys.slice(0, -1);
                    const lastKey = keys[keys.length - 1];

                    // Navigate to the parent
                    let target = colorPath;
                    for (let i = 0; i < basePath.length; i++) {
                        const key = basePath[i];
                        if (!target[key]) target[key] = {};
                        // If we encounter a string value that should become an object, reset it
                        if (typeof target[key] === 'string') {
                            target[key] = {};
                        }
                        target = target[key];
                    }

                    target[lastKey] = token.value;
                },
            },

            // common categories (map to var(--...))
            radius: { target: 'borderRadius' },
            fontSize: { target: 'fontSize' },
            spacing: { target: 'spacing' },
            animation: { target: 'animation' },
            borderWidth: { target: 'borderWidth' },
            outlineWidth: { target: 'outlineWidth' },
            outlineOffset: { target: 'outlineOffset' },
            zIndex: { target: 'zIndex' },
            opacity: { target: 'opacity' },
            scale: { target: 'scale' },
            rotate: { target: 'rotate' },
            translate: { target: 'translate' },
            skew: { target: 'skew' },

            // typography (use raw value)
            fontFamily: { target: 'fontFamily', raw: true },
            fontWeight: { target: 'fontWeight', raw: true },
            lineHeight: { target: 'lineHeight', raw: true },
            letterSpacing: { target: 'letterSpacing', raw: true },

            // layout
            width: { target: 'width', raw: true },
            height: { target: 'height', raw: true },
            maxWidth: { target: 'maxWidth', raw: true },
            minWidth: { target: 'minWidth', raw: true },
            maxHeight: { target: 'maxHeight', raw: true },
            minHeight: { target: 'minHeight', raw: true },

            // effects
            boxShadow: { target: 'boxShadow', raw: true },
            dropShadow: { target: 'dropShadow', raw: true },
        };

        const buildNestedObject = (tokens) => {
            const result = Object.fromEntries(
                Object.values(CATEGORY_MAP).map(({ target }) => [target, {}]),
            );

            // Separate shadcn tokens from other tokens
            const shadcnTokens = tokens.filter((token) => token.path[0] === 'shadcn');
            const otherTokens = tokens.filter((token) => token.path[0] !== 'shadcn');

            // First pass: process non-shadcn tokens
            otherTokens.forEach((token) => {
                const path = token.path;
                const categoryKey = Object.keys(CATEGORY_MAP).find((k) => path.includes(k));
                if (!categoryKey) return;

                const { target, raw, transform } = CATEGORY_MAP[categoryKey];

                if (transform) {
                    transform(token, [...path], result);
                } else {
                    // Handle DEFAULT tokens for non-transform categories
                    let key = path[path.length - 1];
                    if (key === 'DEFAULT') {
                        // If it's a DEFAULT token, use the second-to-last part as key
                        key = path.length > 1 ? path[path.length - 2] : 'DEFAULT';
                    }
                    result[target][key] = raw ? token.value : `var(--${token.name})`;
                }
            });

            // Second pass: process shadcn tokens (they will overwrite any conflicts)
            shadcnTokens.forEach((token) => {
                const path = token.path;
                const categoryKey = Object.keys(CATEGORY_MAP).find((k) => path.includes(k));

                if (categoryKey) {
                    // If it matches a mapped category, use the transform
                    const { transform } = CATEGORY_MAP[categoryKey];
                    if (transform) {
                        transform(token, [...path], result);
                    }
                } else {
                    // For tokens that don't match any specific category,
                    // treat them as general tokens and let them overwrite existing ones
                    const pathWithoutShadcn = path.slice(1); // Remove 'shadcn' prefix
                    const tokenKey = pathWithoutShadcn[pathWithoutShadcn.length - 1];

                    // Determine the target category based on the token name or path
                    // For example, if it's 'radius', it should go to 'borderRadius'
                    if (tokenKey === 'radius') {
                        result.borderRadius = result.borderRadius || {};
                        result.borderRadius.DEFAULT = token.value;
                    } else {
                        // For other tokens, try to find the best category or create a generic one
                        let targetCategory = 'spacing'; // default fallback

                        // Try to map to existing categories
                        for (const [key, mapping] of Object.entries(CATEGORY_MAP)) {
                            if (pathWithoutShadcn.some((p) => p.includes(key))) {
                                targetCategory = mapping.target;
                                break;
                            }
                        }

                        result[targetCategory] = result[targetCategory] || {};
                        result[targetCategory][tokenKey] = token.value;
                    }
                }
            });

            // Fix shadcn structure to handle DEFAULT properly
            if (result.color) {
                const fixShadcnDefaults = (obj) => {
                    Object.keys(obj).forEach((key) => {
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            if (obj[key].DEFAULT) {
                                if (Object.keys(obj[key]).length === 1) {
                                    // If only DEFAULT exists, convert to direct value
                                    obj[key] = obj[key].DEFAULT;
                                } else {
                                    // If there are other properties besides DEFAULT, remove it
                                    // since Tailwind handles it automatically
                                    const hasOtherProps = Object.keys(obj[key]).some(
                                        (k) => k !== 'DEFAULT',
                                    );
                                    if (hasOtherProps) {
                                        delete obj[key].DEFAULT;
                                    }
                                }
                            } else {
                                // Recursively process nested objects
                                fixShadcnDefaults(obj[key]);
                            }
                        }
                    });
                };
                fixShadcnDefaults(result.color);
            }

            // cleanup empty
            Object.keys(result).forEach((key) => {
                if (Object.keys(result[key]).length === 0) delete result[key];
            });

            // semantic + primary tweaks can remain here
            if (result.colors?.semantic) {
                // ...
            }
            if (result.colors?.primary?.['600']) {
                result.colors.primary.DEFAULT = result.colors.primary['600'];
            }

            return result;
        };

        const tokens = dictionary.allTokens.filter((token) => !token.path.includes('color-dark'));
        const tokenObject = buildNestedObject(tokens);

        return `// Auto-generated from Style Dictionary design tokens
export const designTokens = ${JSON.stringify(tokenObject, null, 4)};`;
    },
});

export const config = {
    source: ['tokens/**/*.json'],
    platforms: {
        css: {
            transformGroup: 'css/shadcn',
            buildPath: 'src/tokens/',
            files: [
                {
                    destination: 'design-tokens.css',
                    format: 'css/variables-light',
                    options: {
                        selector: ':root',
                    },
                },
            ],
        },
        js: {
            transformGroup: 'js/shadcn',
            buildPath: 'src/tokens/',
            files: [
                {
                    destination: 'design-tokens.js',
                    format: 'javascript/tailwind-tokens',
                },
            ],
        },
    },
};

export default config;
