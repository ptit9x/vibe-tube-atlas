import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const Forbidden = () => {
    const { t } = useI18n();

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="flex bg-destructive/10 p-6 rounded-full">
                    <ShieldAlert className="h-16 w-16 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">403</h1>
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.errors.accessDenied}</h2>
                </div>
                <p className="max-w-[600px] text-muted-foreground">
                    {t.errors.accessDeniedDesc}
                </p>
                <Button asChild size="lg" className="mt-4">
                    <Link to="/">{t.errors.returnToDashboard}</Link>
                </Button>
            </div>
        </div>
    );
};

export default Forbidden;
