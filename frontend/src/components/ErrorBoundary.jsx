// frontend/src/components/ErrorBoundary.jsx
import React from "react";
import axios from "axios";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);

    // Send to backend error log endpoint
    axios.post("/api/log/frontend-error", {
      message: error.toString(),
      stack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    }).catch(err => {
      console.warn("Failed to send error to backend", err);
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please reload the page.</h1>;
    }

    return this.props.children;
  }
}
