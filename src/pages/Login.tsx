import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Leaf, Loader2, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
    const { t } = useTranslation();
    const [countryCode, setCountryCode] = useState('57'); // Default to Colombia
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const savedPhone = localStorage.getItem('login_phone');
        const savedCode = localStorage.getItem('login_code');
        if (savedPhone) {
            setPhoneNumber(savedPhone);
            setRememberMe(true);
        }
        if (savedCode) {
            setCountryCode(savedCode);
        }
    }, []);

    const loginMutation = useMutation({
        mutationFn: async () => {
            const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
            return login(fullPhone, pin);
        },
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (rememberMe) {
                localStorage.setItem('login_phone', phoneNumber);
                localStorage.setItem('login_code', countryCode);
            } else {
                localStorage.removeItem('login_phone');
                localStorage.removeItem('login_code');
            }

            navigate('/inbox');
        },
        onError: () => {
            setError(t('login.error_credentials'));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!phoneNumber || !pin) {
            setError(t('login.error_missing_fields'));
            return;
        }
        loginMutation.mutate();
    };

    return (
        <div
            className="min-h-screen relative flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/login-bg.png')" }}
        >
            <div className="absolute inset-0 bg-white/10 z-0" />

            {/* Card Container */}
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-md relative z-10">
                <CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
                    <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                        <Leaf className="h-6 w-6 text-emerald-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">{t('login.title')}</CardTitle>
                    <CardDescription>{t('login.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative flex items-center">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                                <div className="absolute left-9 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 border-r border-slate-200 pr-2 h-6">
                                    <span className="text-sm font-medium text-slate-500">+</span>
                                    <input
                                        type="text"
                                        className="w-7 text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none p-0 appearance-none"
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        maxLength={3}
                                    />
                                </div>
                                <Input
                                    type="tel"
                                    placeholder={t('login.phone_placeholder')}
                                    className="pl-[5.5rem]"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type={showPin ? "text" : "password"}
                                    placeholder={t('login.pin_placeholder')}
                                    className="pl-9 pr-10 font-mono text-lg tracking-[0.5em] placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            />
                            <Label htmlFor="remember" className="text-sm font-medium text-slate-500 cursor-pointer select-none">{t('login.remember_me')}</Label>
                        </div>
                        {error && (
                            <div className="text-xs text-red-500 font-medium text-center bg-red-50 py-2 rounded">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('login.signing_in')}
                                </>
                            ) : (
                                t('login.sign_in')
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t pt-4">
                    <span className="text-xs text-slate-400">{t('login.powered_by')}</span>
                </CardFooter>
            </Card>
        </div>
    );
}
