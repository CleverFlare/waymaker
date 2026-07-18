import { mount } from 'svelte';
import './app.css'; // Optional global styles
import App from './App.svelte';

const app = mount(App, {
	target: document.getElementById('app')!
});

export default app;
