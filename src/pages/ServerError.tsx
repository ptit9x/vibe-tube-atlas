import { Button } from '@/components/ui/button';
import { ServerCrash } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const ServerError = () => {
    const { t } = useI18n();

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="flex bg-destructive/10 p-6 rounded-full">
                    <ServerCrash className="h-16 w-16 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">500</h1>
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.errors.internalServerError}</h2>
                </div>
                <p className="max-w-[600px] text-muted-foreground">
                    {t.errors.serverErrorDesc}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={() => window.location.reload()}
                    >
                        {t.errors.tryAgain}
                    </Button>
                    <Button
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={() => window.location.href = '/'}
                    >
                        {t.errors.goToHome}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ServerError;
