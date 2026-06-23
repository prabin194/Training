import './bootstrap';
import { createRoot } from 'react-dom/client';
import { App } from '@/Components/App';

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
