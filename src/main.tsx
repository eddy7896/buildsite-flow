import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSeedData } from './lib/seedDatabase'

// Initialize database with seed data if needed
initializeSeedData();

createRoot(document.getElementById("root")!).render(<App />);
