export const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; }
  body { font-family: Inter, system-ui, sans-serif; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-2); }
`;
