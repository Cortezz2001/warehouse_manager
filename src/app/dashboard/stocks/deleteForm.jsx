"use client";
import React, { useState, useEffect } from "react";
import { Client, Databases, Query, Account } from "appwrite";
import { ChevronRight, X } from "lucide-react";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);
const account = new Account(client);

export default function DeleteStockPage({ onCancel, onStockDeleted }) {
    const [stocks, setStocks] = useState([]);
    const [selectedStock, setSelectedStock] = useState("");
    const [quantity, setQuantity] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                // Получаем все записи stocks с populated данными о товарах и складах
                const stocksResponse = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "67514c74002d0fedcd30",
                    [
                        Query.greaterThan("quantity", 0),
                        Query.orderDesc("$createdAt"),
                    ]
                );

                // Наполняем stocks данными о товарах и складах
                const populatedStocks = stocksResponse.documents.map(
                    (stock) => ({
                        ...stock,
                        productName:
                            stock.products?.name || "Неизвестный товар",
                        warehouseLocation:
                            stock.warehouses?.location || "Неизвестный склад",
                    })
                );

                setStocks(populatedStocks);
            } catch (error) {
                console.error("Ошибка при загрузке запасов:", error);
                setError("Не удалось загрузить данные о запасах");
            }
        };

        fetchStocks();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const stock = stocks.find((s) => s.$id === selectedStock);
            const newQuantity = stock.quantity - parseInt(quantity);

            if (newQuantity < 0) {
                setError(
                    "Невозможно списать больше товара, чем есть на складе"
                );
                setIsSubmitting(false);
                return;
            }

            if (newQuantity === 0) {
                // Если количество становится 0, удаляем документ
                await databases.deleteDocument(
                    "6750a65c001d7b857826",
                    "67514c74002d0fedcd30",
                    selectedStock
                );
            } else {
                // Обновляем количество
                await databases.updateDocument(
                    "6750a65c001d7b857826",
                    "67514c74002d0fedcd30",
                    selectedStock,
                    {
                        quantity: newQuantity,
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
                    type: "Списание",
                    product: stock.productName,
                    warehouse: stock.warehouseLocation,
                    quantity: parseInt(quantity),
                }
            );

            setShowSuccessModal(true);
        } catch (error) {
            console.error("Ошибка при списании товара:", error);
            setError("Не удалось списать товар. Проверьте данные.");
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
                            Списание выполнено
                        </h2>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                onStockDeleted();
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p className="mb-6 text-black">
                        Товар успешно списан со склада.
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                onStockDeleted();
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
                    Списание товара
                </span>
            </div>
            <hr className="border-t border-gray-300 mb-6" />
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-black mb-2">
                        Товар и склад
                    </label>
                    <select
                        value={selectedStock}
                        onChange={(e) => setSelectedStock(e.target.value)}
                        required
                        className="border border-gray-300 rounded-md p-2 w-full"
                    >
                        <option value="" disabled hidden>
                            Выберите товар на складе
                        </option>
                        {stocks.map((stock) => (
                            <option key={stock.$id} value={stock.$id}>
                                {`${stock.productName} (${stock.warehouseLocation}) - ${stock.quantity} шт.`}
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
                        max={
                            selectedStock
                                ? stocks.find((s) => s.$id === selectedStock)
                                      ?.quantity
                                : 0
                        }
                        min={1}
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
                        disabled={isSubmitting || !selectedStock}
                        className={`bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 
                        ${
                            isSubmitting || !selectedStock
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }`}
                    >
                        {isSubmitting ? "Списание..." : "Списать"}
                    </button>
                </div>
            </form>
        </div>
    );
}
