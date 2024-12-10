"use client";
import React, { useState, useEffect } from "react";
import { Client, Databases, Query } from "appwrite";
import { ChevronRight, X } from "lucide-react";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);

export default function DeleteStockPage({ onCancel, onStockDeleted }) {
    const [quantity, setQuantity] = useState("");
    const [productId, setProductId] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [currentStock, setCurrentStock] = useState(null);
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

    useEffect(() => {
        const fetchCurrentStock = async () => {
            if (productId && warehouseId) {
                try {
                    const existingStocksResponse =
                        await databases.listDocuments(
                            "6750a65c001d7b857826",
                            "67514c74002d0fedcd30",
                            [
                                Query.equal("products", productId),
                                Query.equal("warehouses", warehouseId),
                            ]
                        );

                    if (existingStocksResponse.documents.length > 0) {
                        setCurrentStock(existingStocksResponse.documents[0]);
                    } else {
                        setCurrentStock(null);
                    }
                } catch (error) {
                    console.error(
                        "Ошибка при загрузке текущих запасов:",
                        error
                    );
                }
            }
        };

        fetchCurrentStock();
    }, [productId, warehouseId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (currentStock) {
                const currentQuantity = currentStock.quantity;

                if (parseInt(quantity) > currentQuantity) {
                    setError("Количество для списания превышает доступное.");
                    return;
                }

                if (parseInt(quantity) === currentQuantity) {
                    // Удаляем запись, если списываем всё количество
                    await databases.deleteDocument(
                        "6750a65c001d7b857826",
                        "67514c74002d0fedcd30",
                        currentStock.$id
                    );
                } else {
                    // Обновляем количество
                    await databases.updateDocument(
                        "6750a65c001d7b857826",
                        "67514c74002d0fedcd30",
                        currentStock.$id,
                        {
                            quantity: currentQuantity - parseInt(quantity),
                        }
                    );
                }

                setShowSuccessModal(true);
            } else {
                setError("Запись не найдена для выбранного товара и склада.");
            }
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
                            Успешное списание
                        </h2>{" "}
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
                        Запись была успешно списана.
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
                {currentStock && (
                    <div className="text-black mb-2">
                        Доступное количество: {currentStock.quantity}
                    </div>
                )}
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
                        {isSubmitting ? "Списание..." : "Списать"}
                    </button>
                </div>
            </form>
        </div>
    );
}
