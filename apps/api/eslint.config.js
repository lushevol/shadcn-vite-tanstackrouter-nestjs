import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist']
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        sourceType: 'module'
      }
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  }
)
