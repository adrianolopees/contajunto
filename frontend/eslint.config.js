import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // O projeto busca dados com useEffect + useState manual (sem React Query/SWR
      // por ora — ver decisão em frontend/CLAUDE.md). Esse padrão sempre implica
      // um render extra quando o efeito seta loading/dado; é o comportamento
      // esperado do fetch-on-mount, não um bug.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
