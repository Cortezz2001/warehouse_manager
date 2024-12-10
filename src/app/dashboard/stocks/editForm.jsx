"use client";
import React, { useState, useEffect } from "react";
import { Client, Databases } from "appwrite";
import { ChevronRight, X } from "lucide-react";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);

export default function EditForm({ product, onCancel, onProductUpdated }) {
    const [name, setName] = useState(product.name);
    const [desc, setDesc] = useState(product.desc);
    const [price, setPrice] = useState(product.price);
    const [supplierId, setSupplierId] = useState(product.suppliers.$id);
    const [categoryId, setCategoryId] = useState(product.categories.$id);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const suppliersResponse = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "6750a6b200175bde0b9d"
                );
                setSuppliers(suppliersResponse.documents);
            } catch (error) {
                console.error("Ошибка при загрузке поставщиков:", error);
            }
        };

        const fetchCategories = async () => {
            try {
                const categoriesResponse = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "6750a92d00172a547a05"
                );
                setCategories(categoriesResponse.documents);
            } catch (error) {
                console.error("Ошибка при загрузке категорий:", error);
            }
        };

        fetchSuppliers();
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await databases.updateDocument(
                "6750a65c001d7b857826",
                "6751443200130b3a0b9c",
                product.$id,
                {
                    name,
                    desc,
                    price: parseFloat(price),
                    suppliers: supplierId,
                    categories: categoryId,
                }
            );

            setShowSuccessModal(true);
        } catch (error) {
            console.error("Ошибка при обновлении товара:", error);
            setError("Не удалось обновить товар. Проверьте данные.");
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
                            Успешное обновление
                        </h2>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                onProductUpdated();
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p className="mb-6 text-black">
                        Товар &quot;{name}&quot; был успешно обновлен.
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                onProductUpdated();
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
                    Товары
                </span>
                <ChevronRight
                    size={24}
                    className="text-black relative top-[2px]"
                />
                <span className="text-2xl text-black font-semibold">
                    Редактирование товара
                </span>
            </div>
            <hr className="border-t border-gray-300 mb-6" />
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-black mb-2">Название</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border rounded-md text-black"
                        required
                    />
                </div>

                <div>
                    <label className="block text-black mb-2">Описание</label>
                    <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        className="w-full p-2 border rounded-md text-black h-56"
                        required
                    />
                </div>

                <div>
                    <label className="block text-black mb-2">Цена</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-2 border rounded-md text-black"
                        min="0"
                        step="0.01"
                        required
                    />
                </div>

                <div>
                    <label className="block text-black mb-2">Поставщик</label>
                    <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full p-2 border rounded-md text-black"
                        required
                    >
                        <option value="" disabled hidden>
                            Выберите поставщика
                        </option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.$id} value={supplier.$id}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-black mb-2">Категория</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full p-2 border rounded-md text-black"
                        required
                    >
                        <option value="" disabled hidden>
                            Выберите категорию
                        </option>
                        {categories.map((category) => (
                            <option key={category.$id} value={category.$id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
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
                        {isSubmitting ? "Обновление..." : "Обновить"}
                    </button>
                </div>
            </form>
        </div>
    );
}
