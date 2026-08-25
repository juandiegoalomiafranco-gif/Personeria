// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "**/*.glsl"],
  },

  js.configs.recommended,

  // Linting con información de tipos: atrapa promesas sin await, comparaciones
  // imposibles y accesos inseguros que la versión sin tipos deja pasar.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      // Los args e imports que empiezan con _ son intencionalmente ignorados.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Los tipos deben importarse como tipos: mantiene los bundles limpios.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      // En handlers de eventos, void es la forma correcta de descartar una promesa.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  // Los archivos de configuración corren en Node, fuera del proyecto TS.
  {
    files: ["*.config.{mjs,ts,js}", "eslint.config.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Prettier va último: apaga toda regla de formato que pelearía con él.
  prettier,
);
