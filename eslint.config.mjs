import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs,jsx}"],
		plugins: { js },
		extends: ["js/recommended"],
	},
	{
		files: ["**/*.{js,mjs,cjs,jsx}"],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				React: "readonly", // Add this line
			},
		},
	},
	{
		...pluginReact.configs.flat.recommended,
		rules: {
			"react-in-jsx-scope": "off",
			"uses-react": "off", // Not needed in Next.js 13+
			"no-unused-vars": "off", // Warn about unused variables in JSX
			"no-undef": "error", // Ensure all JSX elements are defined
			"no-unescaped-entities": "off", // Disable this rule if you want to allow unescaped entities in JSX
		},
	},
]);
