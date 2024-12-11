"use client";
import React, { useState, useEffect } from "react";
import { Client, Databases, Query, Account } from "appwrite";
import { ChevronRight, X } from "lucide-react";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);
const account = new Account(client);

export default function AddStockPage({ onCancel, onStockAdded }) {
    const [quantity, setQuantity] = useState("");
    const [productId, setProductId] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const productsResponse = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "6751443200130b3a0b9c"
                );
                setProducts(productsResponse.documents);
            } catch (error) {
                console.error("Ошибка при загрузке товаров:", error);
            }
        };

        const fetchWarehouses = async () => {
            try {
                const warehousesResponse = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "67514b8c003152e8054d"
                );
                setWarehouses(warehousesResponse.documents);
            } catch (error) {
                console.error("Ошибка при загрузке складов:", error);
            }
        };

        fetchProducts();
        fetchWarehouses();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Сначала проверяем существующие записи
            const existingStocksResponse = await databases.listDocuments(
                "6750a65c001d7b857826",
                "67514c74002d0fedcd30",
                [
                    Query.equal("products", productId),
                    Query.equal("warehouses", warehouseId),
                ]
            );

            if (existingStocksResponse.documents.length > 0) {
                // Если запись существует, обновляем количество
                const existingStock = existingStocksResponse.documents[0];
                await databases.updateDocument(
                    "6750a65c001d7b857826",
                    "67514c74002d0fedcd30",
                    existingStock.$id,
                    {
                        quantity: existingStock.quantity + parseInt(quantity),
                    }
                );
            } else {
                // Если записи нет, создаем новую
                await databases.createDocument(
                    "6750a65c001d7b857826",
                    "67514c74002d0fedcd30",
                    "unique()",
                    {
                        quantity: parseInt(quantity),
                        products: productId,
                        warehouses: warehouseId,
                    }
                );
            }

            // Получаем информацию о текущем пользователе
            const user = await account.get(); // Получаем информацию о пользователе

            // Добавляем запись в коллекцию movements
            await databases.createDocument(
                "6750a65c001d7b857826",
                "6751508c00274d3012e5",
                "unique()",
                {
                    user_id: user.$id,
                    type: "Поступление",
                    product: products.find((p) => p.$id === productId)?.name,
                    warehouse: warehouses.find((w) => w.$id === warehouseId)
                        ?.location,
                    quantity: parseInt(quantity),
                }
            );

            setShowSuccessModal(true);
        } catch (error) {
            console.error("Ошибка при добавлении/обновлении записи:", error);
            setError(
                "Не удалось добавить или обновить запись. Проверьте данные."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const SuccessModal = () => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg p-6 w-96">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-black">
                            Успешное добавление
                        </h2>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                onStockAdded();
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p className="mb-6 text-black">
                        Запись была успешно добавлена.
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                onStockAdded();
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                        >
                            ОК
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {showSuccessModal && <SuccessModal />}
            <div className="flex items-center mb-4 space-x-2">
                <span
                    className="cursor-pointer hover:underline text-2xl text-black font-semibold"
                    onClick={onCancel}
                >
                    Запасы на складах
                </span>
                <ChevronRight
                    size={24}
                    className="text-black relative top-[2px]"
                />
                <span className="text-2xl text-black font-semibold">
                    Поступление товара
                </span>
            </div>
            <hr className="border-t border-gray-300 mb-6" />
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-black mb-2">Товар</label>
                    <select
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        required
                        className="border border-gray-300 rounded-md p-2 w-full"
                    >
                        <option value="" disabled hidden>
                            Выберите товар
                        </option>
                        {products.map((product) => (
                            <option key={product.$id} value={product.$id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-black mb-2">Склад</label>
                    <select
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        required
                        className="border border-gray-300 rounded-md p-2 w-full"
                    >
                        <option value="" disabled hidden>
                            Выберите склад
                        </option>
                        {warehouses.map((warehouse) => (
                            <option key={warehouse.$id} value={warehouse.$id}>
                                {warehouse.location}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-black mb-2">Количество</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        className="border border-gray-300 rounded-md p-2 w-full"
                    />
                </div>
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-md">
                        {error}
                    </div>
                )}

                <div className="flex justify-end space-x-2 mt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 
                        ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {isSubmitting ? "Добавление..." : "Добавить"}
                    </button>
                </div>
            </form>
        </div>
    );
}
