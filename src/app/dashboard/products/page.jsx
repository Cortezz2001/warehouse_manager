"use client";
import React, { useState, useEffect } from "react";
import { Client, Databases, Query } from "appwrite";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    FileText,
    X,
} from "lucide-react";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [selectAllPages, setSelectAllPages] = useState(false);
    const [showSelectionInfo, setShowSelectionInfo] = useState(false);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "6751443200130b3a0b9c",
                    [
                        Query.orderDesc("$createdAt"),
                        Query.limit(10),
                        Query.offset((currentPage - 1) * 10),
                        Query.select([
                            "$id",
                            "name",
                            "desc",
                            "price",
                            "suppliers.$id",
                            "suppliers.name",
                            "categories.$id",
                            "categories.name",
                        ]),
                    ]
                );
                setProducts(response.documents);
                setTotalPages(Math.ceil(response.total / 10));
                setTotalDocuments(response.total);
                setLoading(false);

                // Проверяем, что чекбокс "выбрать все" должен быть активен только на текущей странице
                const currentPageProductIds = new Set(
                    response.documents.map((product) => product.$id)
                );
                const isAllCurrentPageSelected = [
                    ...currentPageProductIds,
                ].every((id) => selectedRows.has(id));
                setSelectAllPages(
                    isAllCurrentPageSelected &&
                        selectedRows.size >= currentPageProductIds.size
                );
            } catch (error) {
                console.error("Ошибка при загрузке записей:", error);
                setLoading(false);
            }
        };

        fetchProducts();
    }, [currentPage, selectedRows]);

    const handleDeleteProducts = async () => {
        setIsDeleting(true);
        setDeleteError(null);

        try {
            // Convert Set to Array for iteration
            const productsToDelete = Array.from(selectedRows);

            // Delete each selected product
            const deletePromises = productsToDelete.map((productId) =>
                databases.deleteDocument(
                    "6750a65c001d7b857826",
                    "6751443200130b3a0b9c",
                    productId
                )
            );

            // Wait for all deletions to complete
            await Promise.all(deletePromises);

            // Reset selection and close modal
            setSelectedRows(new Set());
            setShowDeleteModal(false);
            setShowSelectionInfo(false);
            setSelectAllPages(false);

            // Refresh current page or go to previous page if no items left
            if (products.length === selectedRows.size && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                // Trigger a re-fetch of products
                const response = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "6751443200130b3a0b9c",
                    [
                        Query.orderDesc("$createdAt"),
                        Query.limit(10),
                        Query.offset((currentPage - 1) * 10),
                    ]
                );
                setProducts(response.documents);
                setTotalPages(Math.ceil(response.total / 10));
                setTotalDocuments(response.total);
            }
        } catch (error) {
            console.error("Ошибка при удалении записей:", error);
            setDeleteError("Не удалось удалить запись. Попробуйте еще раз.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Deletion Modal Component
    const DeleteModal = () => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg p-6 w-96">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-black">
                            Подтверждение удаления
                        </h2>
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p className="mb-6 text-black">
                        Вы действительно хотите удалить {selectedRows.size}{" "}
                        записей?
                    </p>
                    {deleteError && (
                        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                            {deleteError}
                        </div>
                    )}
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleDeleteProducts}
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
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value); // Обновляем поисковый запрос
    };

    const clearSearch = () => {
        setSearchQuery(""); // Очищаем поисковый запрос
    };

    // Modify the delete button to show modal
    const handleShowDeleteModal = () => {
        if (selectedRows.size > 0) {
            setShowDeleteModal(true);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const toggleSelectAll = () => {
        if (!selectAllPages) {
            // Получаем id всех документов на текущей странице
            const currentPageProductIds = new Set(
                products.map((product) => product.$id)
            );

            // Создаем новый Set, объединяющий уже выбранные строки с новыми
            const newSelectedRows = new Set(selectedRows);
            currentPageProductIds.forEach((id) => newSelectedRows.add(id));

            setSelectedRows(newSelectedRows);
            setSelectAllPages(true);
        } else {
            // Удаляем id документов текущей страницы из выбранных
            const currentPageProductIds = new Set(
                products.map((product) => product.$id)
            );
            const newSelectedRows = new Set(selectedRows);
            currentPageProductIds.forEach((id) => newSelectedRows.delete(id));

            setSelectedRows(newSelectedRows);
            setSelectAllPages(false);
        }

        setShowSelectionInfo(true);
    };

    const toggleSelectRow = (id) => {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.has(id)) {
            newSelectedRows.delete(id);
        } else {
            newSelectedRows.add(id);
        }

        setSelectedRows(newSelectedRows);

        // Проверка, выбраны ли все строки на текущей странице
        const currentPageProductIds = new Set(
            products.map((product) => product.$id)
        );
        const isAllCurrentPageSelected = [...currentPageProductIds].every(
            (id) => newSelectedRows.has(id)
        );
        setSelectAllPages(isAllCurrentPageSelected);

        setShowSelectionInfo(true);
    };

    const handleCancelSelection = () => {
        setSelectedRows(new Set());
        setShowSelectionInfo(false);
        setSelectAllPages(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-2xl mb-4 text-black font-semibold">Товары</h1>
            <hr className="border-t border-gray-300 mb-6" />

            <div className="flex justify-between mb-4">
                <div className="relative flex-grow max-w-md mr-4">
                    <input
                        type="text"
                        placeholder="Поиск товаров..."
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-blue-500 text-black"
                        value={searchQuery} // Устанавливаем значение для поля поиска
                        onChange={handleSearchChange} // Обработчик изменения значения
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch} // Очищаем поле поиска
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                            <X size={20} />
                        </button>
                    )}
                    <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                    />
                </div>

                <div className="flex space-x-2">
                    <button
                        className="bg-green-500 text-white w-10 h-10 rounded-lg flex justify-center items-center hover:bg-green-600 transition"
                        title="Добавить запись"
                    >
                        <Plus size={20} />
                    </button>
                    <button
                        className={`bg-red-500 text-white w-10 h-10 rounded-lg flex justify-center items-center hover:bg-red-600 transition 
                ${
                    selectedRows.size === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                }`}
                        title="Удалить запись"
                        onClick={handleShowDeleteModal}
                        disabled={selectedRows.size === 0}
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        className="bg-purple-500 text-white w-10 h-10 rounded-lg flex justify-center items-center hover:bg-purple-600 transition"
                        title="Создать отчет"
                    >
                        <FileText size={20} />
                    </button>
                </div>
            </div>
            {showDeleteModal && <DeleteModal />}
            <table className="w-full border-collapse mb-4">
                <thead>
                    <tr className="bg-blue-50">
                        <th className="border p-2 w-12 text-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-blue-600"
                                checked={selectAllPages}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        <th className="border p-2 text-left text-black">
                            Название
                        </th>
                        <th className="border p-2 text-left text-black">
                            Описание
                        </th>
                        <th className="border p-2 text-left text-black">
                            Цена
                        </th>
                        <th className="border p-2 text-left text-black">
                            Поставщик
                        </th>
                        <th className="border p-2 text-left text-black">
                            Категория
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr
                            key={product.$id}
                            className="bg-white border hover:bg-blue-100"
                        >
                            <td className="border p-2 text-center">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-blue-600"
                                    checked={selectedRows.has(product.$id)}
                                    onChange={() =>
                                        toggleSelectRow(product.$id)
                                    }
                                />
                            </td>
                            <td className="border p-2 text-black max-w-[200px] truncate">
                                {product.name}
                            </td>
                            <td className="border p-2 text-black max-w-[300px] truncate">
                                {product.desc}
                            </td>
                            <td className="border p-2 text-black">
                                {product.price} ₸
                            </td>
                            <td className="border p-2 text-black max-w-[150px] truncate">
                                {product.suppliers?.name || "Не указан"}
                            </td>
                            <td className="border p-2 text-black max-w-[150px] truncate">
                                {product.categories?.name || "Не указана"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showSelectionInfo && selectedRows.size > 0 && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 shadow-lg rounded-md p-4 flex justify-between items-center w-1/3">
                    <span>
                        {selectedRows.size} / {totalDocuments} записей выбрано
                    </span>
                    <button
                        className="text-red-500"
                        onClick={handleCancelSelection}
                    >
                        Отмена
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div className="text-gray-600">
                    Страница {currentPage} из {totalPages}
                </div>
                <div className="flex space-x-2">
                    <button
                        className={`bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition ${
                            currentPage === 1
                                ? "cursor-not-allowed opacity-50"
                                : ""
                        }`}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        className={`bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition ${
                            currentPage === totalPages
                                ? "cursor-not-allowed opacity-50"
                                : ""
                        }`}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </>
    );
}
