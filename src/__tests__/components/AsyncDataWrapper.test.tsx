/**
 * Unit tests for AsyncDataWrapper component
 */

import { render, screen } from '@testing-library/react';
import { AsyncDataWrapper } from '@/components/AsyncDataWrapper';

describe('AsyncDataWrapper Component', () => {
  it('should render loading state', () => {
    render(
      <AsyncDataWrapper isLoading={true} error={null} data={null}>
        Content
      </AsyncDataWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    const error = new Error('Test error');
    render(
      <AsyncDataWrapper
        isLoading={false}
        error={error}
        data={null}
        errorTitle="Failed to load"
      >
        Content
      </AsyncDataWrapper>
    );

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('should render children when data is available', () => {
    render(
      <AsyncDataWrapper isLoading={false} error={null} data={{ id: '1' }}>
        <div>Test Content</div>
      </AsyncDataWrapper>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should show no data message when data is null', () => {
    render(
      <AsyncDataWrapper isLoading={false} error={null} data={null}>
        Content
      </AsyncDataWrapper>
    );

    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('should display custom loading text', () => {
    render(
      <AsyncDataWrapper
        isLoading={true}
        error={null}
        data={null}
        loadingText="Loading posts..."
      >
        Content
      </AsyncDataWrapper>
    );

    expect(screen.getByText('Loading posts...')).toBeInTheDocument();
  });

  it('should display custom error title and description', () => {
    const error = new Error('Test error');
    render(
      <AsyncDataWrapper
        isLoading={false}
        error={error}
        data={null}
        errorTitle="Custom Error"
        errorDescription="Something went wrong"
      >
        Content
      </AsyncDataWrapper>
    );

    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show retry button when onRetry is provided', () => {
    const error = new Error('Test error');
    const onRetry = jest.fn();

    render(
      <AsyncDataWrapper
        isLoading={false}
        error={error}
        data={null}
        onRetry={onRetry}
      >
        Content
      </AsyncDataWrapper>
    );

    const retryButton = screen.getByText(/try again/i);
    expect(retryButton).toBeInTheDocument();
  });

  it('should not show retry button when onRetry is not provided', () => {
    const error = new Error('Test error');

    render(
      <AsyncDataWrapper isLoading={false} error={error} data={null}>
        Content
      </AsyncDataWrapper>
    );

    expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
  });

  it('should prioritize loading state over error state', () => {
    const error = new Error('Test error');

    render(
      <AsyncDataWrapper isLoading={true} error={error} data={null}>
        Content
      </AsyncDataWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
  });

  it('should prioritize error state over no data message', () => {
    const error = new Error('Test error');

    render(
      <AsyncDataWrapper isLoading={false} error={error} data={null}>
        Content
      </AsyncDataWrapper>
    );

    expect(screen.queryByText(/no data available/i)).not.toBeInTheDocument();
  });
});
