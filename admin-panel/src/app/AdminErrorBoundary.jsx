'use client';

import { Component } from 'react';

export default class AdminErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.error('Admin panel render error:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 24 }}>
                    <h1>Something went wrong.</h1>
                    <p>Reload the page or sign in again.</p>
                </div>
            );
        }
        return this.props.children;
    }
}
