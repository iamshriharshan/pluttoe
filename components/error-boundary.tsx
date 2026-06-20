"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError() {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Pluttoe UI error", error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-2xl font-semibold text-zinc-950">
            Something slipped off the rail.
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Pluttoe caught the issue before the whole page crashed. Try again and we
            will reload the experience cleanly.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}
