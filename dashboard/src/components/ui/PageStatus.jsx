import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export function PageStatus({ isLoading, error, onRetry, loadingText = 'Loading...', errorText = 'Failed to load data' }) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 w-full h-full text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" aria-label={loadingText} />
                <p className="font-medium animate-pulse">{loadingText}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6 text-red-500" aria-hidden="true" />
                </div>
                <p className="text-lg font-semibold text-zinc-100">{errorText}</p>
                <p className="text-zinc-500 max-w-sm">Please check your connection and try again. If the problem persists, contact support.</p>
                {onRetry && (
                    <Button onClick={onRetry} variant="outline" className="mt-4">
                        Try Again
                    </Button>
                )}
            </div>
        );
    }

    return null;
}
