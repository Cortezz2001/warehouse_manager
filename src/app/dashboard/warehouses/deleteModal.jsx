"use client";
import React, { useState } from "react";
import { Client, Databases } from "appwrite";
import { X } from "lucide-react";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);

export default function DeleteModal({
    selectedRows,
    onClose,
    onDeleteComplete,
}) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const handleDeleteWarehouses = async () => {
        setIsDeleting(true);
        setDeleteError(null);

        try {
            const warehousesToDelete = Array.from(selectedRows);
            const deletePromises = warehousesToDelete.map((warehouseId) =>
                databases.deleteDocument(
                    "6750a65c001d7b857826",
                    "67514b8c003152e8054d", // ID коллекции складов
                    warehouseId
                )
            );

            await Promise.all(deletePromises);

            // Вызываем коллбэк для обновления данных в родительском компоненте
            onDeleteComplete();
            onClose();
        } catch (error) {
            console.error("Ошибка при удалении записей:", error);
            setDeleteError("Не удалось удалить запись. Попробуйте еще раз.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-black">
                        Подтверждение удаления
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>
                <p className="mb-6 text-black">
                    Вы действительно хотите удалить {selectedRows.size} складов?
                </p>
                {deleteError && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                        {deleteError}
                    </div>
                )}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleDeleteWarehouses}
                        disabled={isDeleting}
                        className={`bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 
                        ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {isDeleting ? "Удаление..." : "Да, удалить"}
                    </button>
                </div>
            </div>
        </div>
    );
}
