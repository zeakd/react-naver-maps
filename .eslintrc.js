module.exports = {
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:prettier/recommended", 
        "prettier/react"
    ],
    "plugins": ["react", "prettier"],
    "env": {
        "browser": true,
        "es6": true
    },
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "prettier/prettier": ["error", {
            singleQuote: true,
            trailingComma: 'all',
            // "bracketSpacing": false,
            // "jsxBracketSameLine": true,
        }],
        "no-unused-vars": "warn",
    }
};