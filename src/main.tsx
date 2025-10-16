
  import { createRoot } from "react-dom/client";
  import App from "./App";
  import "./styles/globals.css";
  import "./index.css";

  console.log('🚀 main.tsx: Script carregado');
  
  const rootElement = document.getElementById("root");
  console.log('🎯 main.tsx: Root element:', rootElement);
  
  if (rootElement) {
    console.log('✅ main.tsx: Root element encontrado, criando app...');
    createRoot(rootElement).render(<App />);
    console.log('✅ main.tsx: App renderizado');
  } else {
    console.error('❌ main.tsx: Root element não encontrado!');
  }
  