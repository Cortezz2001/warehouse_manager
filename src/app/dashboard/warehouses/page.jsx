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
import AddWarehousePage from "./addForm"; // Обновите путь к вашему компоненту добавления склада
import EditWarehousePage from "./editForm"; // Обновите путь к вашему компоненту редактирования склада
import DeleteModal from "./deleteModal";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState([]);
    const [allWarehouses, setAllWarehouses] = useState([]); // Храним все склады
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showSelectionInfo, setShowSelectionInfo] = useState(false);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const response = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "67514b8c003152e8054d",
                    [
                        Query.orderDesc("$createdAt"),
                        Query.limit(100), // Загружаем больше записей для поиска
                        Query.select(["$id", "location"]),
                    ]
                );
                setAllWarehouses(response.documents); // Сохраняем все склады
                setTotalDocuments(response.total);
                setLoading(false);
            } catch (error) {
                console.error("Ошибка при загрузке записей:", error);
                setLoading(false);
            }
        };

        fetchWarehouses();
    }, []);

    useEffect(() => {
        // Фильтруем склады на основе поискового запроса
        let filteredWarehouses = allWarehouses.filter((warehouse) => {
            const searchLower = searchQuery.toLowerCase();
            return warehouse.location.toLowerCase().includes(searchLower);
        });

        // Сортировка, если выбрана колонка
        if (sortColumn) {
            filteredWarehouses.sort((a, b) => {
                let valueA = a[sortColumn] || "";
                let valueB = b[sortColumn] || "";

                // Сравнение значений с учетом направления сортировки
                if (typeof valueA === "string") {
                    return sortDirection === "asc"
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                } else {
                    return sortDirection === "asc"
                        ? valueA - valueB
                        : valueB - valueA;
                }
            });
        }

        // Разбиваем отсортированные склады по страницам
        setWarehouses(
            filteredWarehouses.slice((currentPage - 1) * 10, currentPage * 10)
        );
        setTotalPages(Math.ceil(filteredWarehouses.length / 10));
    }, [searchQuery, allWarehouses, currentPage, sortColumn, sortDirection]);

    const handleDeleteComplete = async () => {
        // Обновляем список складов после удаления
        const response = await databases.listDocuments(
            "6750a65c001d7b857826",
            "67514b8c003152e8054d",
            [Query.orderDesc("$createdAt"), Query.limit(100)]
        );
        setAllWarehouses(response.documents);
        setSelectedRows(new Set()); // Очищаем выбранные записи
        setShowSelectionInfo(false);

        // Обновляем totalDocuments
        setTotalDocuments(response.total);
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
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
            "67514b8c003152e8054d",
            [Query.orderDesc("$createdAt"), Query.limit(100)]
        );
        setAllWarehouses(response.documents);
        setIsAdding(false);

        // Обновляем totalDocuments
        setTotalDocuments(response.total);
    };

    const handleEditClick = (warehouse) => {
        setEditingWarehouse(warehouse);
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
        if (warehouses.length === 0) return; // Если нет складов, ничего не делаем

        const newSelectedRows = new Set(selectedRows);
        if (
            warehouses.every((warehouse) => newSelectedRows.has(warehouse.$id))
        ) {
            // Если все записи на странице выделены, снимаем выделение
            warehouses.forEach((warehouse) =>
                newSelectedRows.delete(warehouse.$id)
            );
        } else {
            // Иначе выделяем все записи на странице
            warehouses.forEach((warehouse) =>
                newSelectedRows.add(warehouse.$id)
            );
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
        warehouses.length > 0 &&
        warehouses.every((warehouse) => selectedRows.has(warehouse.$id));

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
                <AddWarehousePage
                    onCancel={handleCancelAdd}
                    onWarehouseAdded={handleAdded}
                />
            ) : isEditing ? (
                <EditWarehousePage
                    warehouse={editingWarehouse}
                    onCancel={() => setIsEditing(false)}
                    onWarehouseUpdated={handleAdded}
                />
            ) : (
                <>
                    <h1 className="text-2xl mb-4 text-black font-semibold">
                        Склады
                    </h1>
                    <hr className="border-t border-gray-300 mb-6" />
                    <div className="flex justify-between mb-4">
                        <div className="relative flex-grow max-w-md mr-4">
                            <input
                                type="text"
                                placeholder="Поиск складов..."
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-blue-500 text-black"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate -y-1/2 text-gray-400 hover:text-gray-500 transition"
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
                        </div>
                    </div>
                    {showDeleteModal && (
                        <DeleteModal
                            selectedRows={selectedRows}
                            onClose={() => setShowDeleteModal(false)}
                            onDeleteComplete={handleDeleteComplete}
                        />
                    )}
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
                                <th
                                    className="border p-2 text-left text-black cursor-pointer hover:bg-blue-100"
                                    onClick={() => handleSort("location")}
                                >
                                    Адрес
                                    {sortColumn === "location" && (
                                        <span className="ml-2">
                                            {sortDirection === "asc"
                                                ? "▲"
                                                : "▼"}
                                        </span>
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouses.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="text-center p-4">
                                        <AlertTriangle
                                            className="inline-block mr-2"
                                            size={20}
                                        />
                                        Ничего не найдено по вашему запросу.
                                    </td>
                                </tr>
                            ) : (
                                warehouses.map((warehouse) => (
                                    <tr
                                        key={warehouse.$id}
                                        className="bg-white border hover:bg-blue-100 cursor-pointer"
                                        onClick={() =>
                                            handleEditClick(warehouse)
                                        }
                                    >
                                        <td className="border p-2 text-center">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-blue-600"
                                                checked={selectedRows.has(
                                                    warehouse.$id
                                                )}
                                                onChange={() =>
                                                    toggleSelectRow(
                                                        warehouse.$id
                                                    )
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                        </td>
                                        <td className="border p-2 text-black max-w-[200px] truncate">
                                            {warehouse.location}
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
