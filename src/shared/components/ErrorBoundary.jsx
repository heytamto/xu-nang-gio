// src/components/common/ErrorBoundary.jsx
import React from 'react';
import ErrorPage from './ErrorPage';
import { isChunkLoadError } from '../utils/chunkRecovery';
import { RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', chunkError: false };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      chunkError: isChunkLoadError(error),
      errorMessage: error?.message || 'Lỗi hiển thị giao diện',
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lỗi ứng dụng (ErrorBoundary):', error, errorInfo);
    // Có thể gọi API bắn cảnh báo lỗi về Telegram tại đây
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '', chunkError: false });
  };

  render() {
    if (this.state.chunkError) {
      return (
        <main role="alert" className="min-h-[60dvh] flex items-center justify-center p-4 bg-stone-50">
          <section className="max-w-md w-full rounded-3xl border border-stone-200 bg-white p-6 text-center space-y-4 shadow-sm">
            <RefreshCw aria-hidden="true" className="w-9 h-9 mx-auto text-amber-800" />
            <h1 className="text-xl font-bold text-stone-900">Cần tải lại trang</h1>
            <p className="text-sm leading-relaxed text-stone-600">Website có thể vừa được cập nhật hoặc kết nối bị gián đoạn. Tải lại để tiếp tục. Thông tin chưa lưu có thể bị mất.</p>
            <button type="button" onClick={() => window.location.reload()} className="w-full min-h-11 rounded-xl bg-amber-800 px-4 py-3 font-bold text-white hover:bg-amber-900">Tải lại trang</button>
            <a href="/" className="inline-block text-sm font-medium text-stone-600 underline">Về trang chủ</a>
          </section>
        </main>
      );
    }
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