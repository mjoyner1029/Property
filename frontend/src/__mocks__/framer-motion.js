// Mock for framer-motion to silence animation warnings in Jest
module.exports = {
	motion: {
		div: (props) => props.children,
		span: (props) => props.children,
	},
};
