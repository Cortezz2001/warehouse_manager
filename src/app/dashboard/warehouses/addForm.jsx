"use client";
import React, { useState } from "react";
import { Client, Databases } from "appwrite";
import { ChevronRight, X } from "lucide-react";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);

export default function AddWarehousePage({ onCancel, onWarehouseAdded }) {
    const [location, setLocation] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await databases.createDocument(
                "6750a65c001d7b857826", // Database ID
                "67514b8c003152e8054d", // Collection ID для складов
                "unique()", // Автогенерируемый ID
                {
                    location, // Атрибут локации
                }
            );

            setShowSuccessModal(true);
        } catch (error) {
            console.error("Ошибка при добавлении склада:", error);
            setError("Не удалось добавить склад. Проверьте данные.");
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
                                onWarehouseAdded();
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p className="mb-6 text-black">
                        Склад &quot;{location}&quot; был успешно добавлен.
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                onWarehouseAdded();
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
                    Склады
                </span>
                <ChevronRight
                    size={24}
                    className="text-black relative top-[2px]"
                />
                <span className="text-2xl text-black font-semibold">
                    Добавление склада
                </span>
            </div>
            <hr className="border-t border-gray-300 mb-6" />
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-black mb-2">Адрес</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-2 border rounded-md text-black"
                        placeholder="Введите адрес склада"
                        required
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
