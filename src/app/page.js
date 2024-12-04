'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, account, logout } from './lib/appwrite'; // Убедитесь, что функции подключены правильно

export default function Login() {
    const [loginValue, setLoginValue] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true); // Новое состояние для проверки сессии
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await account.getSession('current');
                if (session) {
                    router.push('/dashboard/products'); // Если сессия активна, перенаправляем пользователя
                }
            } catch {
                // Сессии нет, продолжаем загрузку страницы
            } finally {
                setIsCheckingSession(false); // Завершаем проверку
            }
        };
        checkSession();
    }, [router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Создаем новую сессию
            const session = await login(loginValue, password);
            if (session) {
                router.push('/dashboard/products');
            }
        } catch (err) {
            if (err.message.includes('Session not found')) {
                setError('Не удалось создать новую сессию. Попробуйте ещё раз.');
            } else {
                setError('Неверный логин или пароль');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingSession) {
        // Отображаем индикатор загрузки, пока проверяем сессию
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-t-blue-600 border-blue-300 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl mb-6 text-center text-black">Вход в систему</h2>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
                        {error}
                    </div>
                )}
                <form onSubmit={handleLogin}>
                    <div className="mb-5">
                        <label htmlFor="login" className="block text-sm font-medium text-gray-600">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={loginValue}
                            onChange={(e) => setLoginValue(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition text-gray-800"
                            placeholder="Введите ваш email"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600">
                            Пароль
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition text-gray-800"
                            placeholder="Введите ваш пароль"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 shadow-md transition"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-t-2 border-blue-600 border-solid rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            'Войти'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
