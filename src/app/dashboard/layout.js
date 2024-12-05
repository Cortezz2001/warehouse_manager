'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout, account } from '../../app/lib/appwrite';
import Link from 'next/link';
import "../globals.css";
import { ShoppingBag, Box, ArrowLeftRight, Warehouse } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await account.getSession('current');
        if (session) {
          const user = await account.get();
          setUserName(user.name);
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      }
    };

    checkSession();
  }, [router]);

  // Функция для определения активной ссылки
  const isActive = (path) => pathname.startsWith(path);

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-blue-500 text-white py-4 px-6 flex justify-between items-center">
        <div className='font-semibold'>Добро пожаловать, {userName || 'User'}</div>
        <button 
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded font-semibold hover:bg-red-600 transition"
        >
          Выйти
        </button>
      </header>
      <div className="flex flex-1">
        <nav className="bg-blue-50 p-6 border-r w-64 sticky top-0 h-screen overflow-y-auto">  
        <ul className="space-y-4">
            <li>
              <Link 
                href="/dashboard/products" 
                className={`flex items-center space-x-2 ${
                  isActive('/dashboard/products') 
                    ? 'text-blue-500 font-bold' 
                    : 'text-gray-700 hover:text-blue-500'
                }`}
              >
                <ShoppingBag className="h-6 w-6" />
                <span>Товары</span>
              </Link>
            </li>
            <hr className="border-gray-300" />
            <li>
              <Link 
                href="/dashboard/stocks" 
                className={`flex items-center space-x-2 ${
                  isActive('/dashboard/stocks') 
                    ? 'text-blue-500 font-bold' 
                    : 'text-gray-700 hover:text-blue-500'
                }`}
              >
                <Box className="h-6 w-6" />
                <span>Запасы</span>
              </Link>
            </li>
            <hr className="border-gray-300" />
            <li>
              <Link 
                href="/dashboard/movements" 
                className={`flex items-center space-x-2 ${
                  isActive('/dashboard/movements') 
                    ? 'text-blue-500 font-bold' 
                    : 'text-gray-700 hover:text-blue-500'
                }`}
              >
                <ArrowLeftRight className="h-6 w-6" />
                <span>Движения</span>
              </Link>
            </li>
            <hr className="border-gray-300" />
            <li>
              <Link 
                href="/dashboard/warehouses" 
                className={`flex items-center space-x-2 ${
                  isActive('/dashboard/warehouses') 
                    ? 'text-blue-500 font-bold' 
                    : 'text-gray-700 hover:text-blue-500'
                }`}
              >
                <Warehouse className="h-6 w-6" />
                <span>Склады</span>
              </Link>
            </li>
          </ul>
        </nav>
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}