const React = require("react");
module.exports = new Proxy({}, {
  get: (_t, name) => (props) => React.createElement("svg", { "data-testid": String(name), ...props })
});
