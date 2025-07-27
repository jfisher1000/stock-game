import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // This lifecycle method is triggered after an error has been thrown by a descendant component.
  // It receives the error that was thrown as a parameter and should return a value to update state.
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  // This lifecycle method is also called after an error has been thrown by a descendant component.
  // It is a good place for logging errors.
  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  // Function to reset the error state and try to re-render the component tree
  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex items-center justify-center h-screen bg-background p-4">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-destructive">Oops! Something Went Wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If the problem persists, please contact support.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="p-2 text-left bg-muted rounded-md">
                  <summary className="cursor-pointer">Error Details</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                  </pre>
                </details>
              )}
              <Button onClick={this.handleTryAgain}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
