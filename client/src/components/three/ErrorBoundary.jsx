import { Component } from "react";

// GLTF load failures (e.g. a placeholder model file that doesn't exist yet)
// surface as thrown errors inside Suspense — only a real error boundary
// catches those, a try/catch around JSX will not.
export class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
