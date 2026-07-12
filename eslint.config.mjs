import nextConfig from "eslint-config-next";

const eslintConfig = [
  { ignores: ["coverage/**", "test-results/**", "playwright-report/**", "blob-report/**"] },
  ...nextConfig,
  {
    // Fetch-on-mount (`useEffect(() => { fetchX(); }, [])`) is this codebase's
    // established data-fetching pattern across every hook/page — downgraded
    // instead of rewriting ~15 call sites to satisfy a React Compiler-oriented rule.
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
];

export default eslintConfig;
