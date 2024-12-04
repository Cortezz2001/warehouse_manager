import { Client, Account } from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6750318900371dbd1cf3'); 

export const account = new Account(client);

export const login = async (loginValue, password) => {
    try {
        const session = await account.createEmailPasswordSession(loginValue, password);
        return session;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await account.deleteSession('current');
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const getSession = async () => {
    try {
        const session = await account.getSession('current');
        console.log('Текущая сессия:', session);
        return session;
    } catch (error) {
        console.log('Сессия не найдена');
        return null; // Если сессии нет, возвращаем null
    }
};