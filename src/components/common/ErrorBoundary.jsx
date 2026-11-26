// src/components/common/ErrorBoundary.jsx
import React from 'react';
import ErrorPage from './ErrorPage';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Lỗi hiển thị giao diện',
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lỗi ứng dụng (ErrorBoundary):', error, errorInfo);
    // Có thể gọi API bắn cảnh báo lỗi về Telegram tại đây
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          statusCode={500}
          errorDetail={import.meta.env.DEV ? this.state.errorMessage : null}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}