"use client";
import React, { useState, useEffect } from "react";
import { Client, Databases, Query } from "appwrite";
import {
    Search,
    Plus,
    AlertTriangle,
    Trash2,
    ChevronLeft,
    ChevronRight,
    FileText,
    X,
} from "lucide-react";
import AddProductPage from "./addForm";
import EditForm from "./editForm";
const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // Храним все продукты
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showSelectionInfo, setShowSelectionInfo] = useState(false);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "6751443200130b3a0b9c",
                    [
                        Query.orderDesc("$createdAt"),
                        Query.limit(100), // Загружаем больше записей для поиска
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
                setAllProducts(response.documents); // Сохраняем все продукты
                setTotalDocuments(response.total);
                setLoading(false);
            } catch (error) {
                console.error("Ошибка при загрузке записей:", error);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        // Фильтруем продукты на основе поискового запроса
        const filteredProducts = allProducts.filter((product) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                product.name.toLowerCase().includes(searchLower) ||
                product.desc.toLowerCase().includes(searchLower) ||
                product.price.toString().includes(searchLower) ||
                (product.suppliers?.name &&
                    product.suppliers.name
                        .toLowerCase()
                        .includes(searchLower)) ||
                (product.categories?.name &&
                    product.categories.name.toLowerCase().includes(searchLower))
            );
        });

        // Устанавливаем текущие продукты для отображения на странице
        setProducts(
            filteredProducts.slice((currentPage - 1) * 10, currentPage * 10)
        );
        setTotalPages(Math.ceil(filteredProducts.length / 10));
    }, [searchQuery, allProducts, currentPage]);

    const handleDeleteProducts = async () => {
        setIsDeleting(true);
        setDeleteError(null);

        try {
            const productsToDelete = Array.from(selectedRows);
            const deletePromises = productsToDelete.map((productId) =>
                databases.deleteDocument(
                    "6750a65c001d7b857826",
                    "6751443200130b3a0b9c",
                    productId
                )
            );

            await Promise.all(deletePromises);
            setSelectedRows(new Set());
            setShowDeleteModal(false);
            setShowSelectionInfo(false);

            // Обновляем все продукты после удаления
            const response = await databases.listDocuments(
                "6750a65c001d7b857826",
                "6751443200130b3a0b9c",
                [Query.orderDesc("$createdAt"), Query.limit(100)]
            );
            setAllProducts(response.documents);
        } catch (error) {
            console.error("Ошибка при удалении записей:", error);
            setDeleteError("Не удалось удалить запись. Попробуйте еще раз.");
        } finally {
            setIsDeleting(false);
        }
    };

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

    const handleAddClick = () => {
        setIsAdding(true);
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleAdded = async () => {
        const response = await databases.listDocuments(
            "6750a65c001d7b857826",
            "6751443200130b3a0b9c",
            [Query.orderDesc("$createdAt"), Query.limit(100)]
        );
        setAllProducts(response.documents);
        setIsAdding(false);
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setIsEditing(true);
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const handleShowDeleteModal = () => {
        if (selectedRows.size > 0) {
            setShowDeleteModal(true);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const toggleSelectAll = () => {
        if (products.length === 0) return; // Если нет продуктов, ничего не делаем

        const newSelectedRows = new Set(selectedRows);
        if (products.every((product) => newSelectedRows.has(product.$id))) {
            // Если все записи на странице выделены, снимаем выделение
            products.forEach((product) => newSelectedRows.delete(product.$id));
        } else {
            // Иначе выделяем все записи на странице
            products.forEach((product) => newSelectedRows.add(product.$id));
        }
        setSelectedRows(newSelectedRows);
        setShowSelectionInfo(newSelectedRows.size > 0);
    };

    const toggleSelectRow = (id) => {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.has(id)) {
            newSelectedRows.delete(id); // Снимаем выделение
        } else {
            newSelectedRows.add(id); // Выделяем
        }
        setSelectedRows(newSelectedRows);
        setShowSelectionInfo(newSelectedRows.size > 0);
    };
    const isAllSelected =
        products.length > 0 &&
        products.every((product) => selectedRows.has(product.$id));

    const handleCancelSelection = () => {
        setSelectedRows(new Set()); // Снимаем выделения
        setShowSelectionInfo(false);
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
            {isAdding ? (
                <AddProductPage
                    onCancel={handleCancelAdd}
                    onProductAdded={handleAdded}
                />
            ) : isEditing ? (
                <EditForm
                    product={editingProduct}
                    onCancel={() => setIsEditing(false)}
                    onProductUpdated={handleAdded}
                />
            ) : (
                <>
                    <h1 className="text-2xl mb-4 text-black font-semibold">
                        Товары
                    </h1>
                    <hr className="border-t border-gray-300 mb-6" />
                    <div className="flex justify-between mb-4">
                        <div className="relative flex-grow max-w-md mr-4">
                            <input
                                type="text"
                                placeholder="Поиск товаров..."
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-blue-500 text-black"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text -gray-400 hover:text-gray-500 transition"
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
                                onClick={handleAddClick}
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
                                        checked={isAllSelected}
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
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center p-4">
                                        <AlertTriangle
                                            className="inline-block mr-2"
                                            size={20}
                                        />
                                        Ничего не найдено по вашему запросу.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr
                                        key={product.$id}
                                        className="bg-white border hover:bg-blue-100 cursor-pointer"
                                        onClick={() => handleEditClick(product)}
                                    >
                                        <td className="border p-2 text-center">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-blue-600"
                                                checked={selectedRows.has(
                                                    product.$id
                                                )}
                                                onChange={() =>
                                                    toggleSelectRow(product.$id)
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
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
                                            {product.suppliers?.name ||
                                                "Не указан"}
                                        </td>
                                        <td className="border p-2 text-black max-w-[150px] truncate">
                                            {product.categories?.name ||
                                                "Не указана"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {showSelectionInfo && selectedRows.size > 0 && (
                        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 shadow-lg rounded-md p-4 flex justify-between items-center w-1/3">
                            <span>
                                {selectedRows.size} / {totalDocuments} записей
                                выбрано
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
                                onClick={() =>
                                    handlePageChange(currentPage - 1)
                                }
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
                                onClick={() =>
                                    handlePageChange(currentPage + 1)
                                }
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
