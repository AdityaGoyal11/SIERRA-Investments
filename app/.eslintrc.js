module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: 'airbnb-base',
    parserOptions: {
        ecmaVersion: 'latest'
    },
    rules: {
        indent: ['error', 4],
        'global-require': 0,
        'comma-dangle': ['error', 'never'],
        'no-console': 'off',
        'linebreak-style': 'off',
        'quote-props': ['error', 'as-needed'],
        quotes: ['error', 'single'],
        'object-curly-spacing': ['error', 'always'],
        'no-trailing-spaces': 'error',
        'eol-last': ['error', 'always'],
        'import/newline-after-import': ['error', { count: 1 }],
        'import/no-unresolved': [
            'error',
            {
                ignore: [
                    'csv-parse/sync',
                    'csv-parser/sync'
                ]
            }
        ],
        'no-restricted-syntax': [
            'error',
            {
                selector: 'ForInStatement',
                message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
            }
        ],
        'no-await-in-loop': 'off'
    }
};
