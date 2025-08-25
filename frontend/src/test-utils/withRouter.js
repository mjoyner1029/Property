// Utility to wrap components with React Router context in tests
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

export function withRouter(ui, { route = '/' } = {}) {
	window.history.pushState({}, 'Test page', route);
	return <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>;
}
