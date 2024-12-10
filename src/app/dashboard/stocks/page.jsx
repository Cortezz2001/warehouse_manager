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
    Minus,
} from "lucide-react";
import AddStockPage from "./addForm";
import DeleteStockPage from "./deleteForm";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);

export default function StocksPage() {
    const [stocks, setStocks] = useState([]);
    const [allStocks, setAllStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showSelectionInfo, setShowSelectionInfo] = useState(false);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isDeliting, setIsDeliting] = useState(false);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const response = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "67514c74002d0fedcd30",
                    [Query.orderDesc("$createdAt"), Query.limit(100)]
                );
                setAllStocks(response.documents);
                setTotalDocuments(response.total);
                setLoading(false);
            } catch (error) {
                console.error("Ошибка при загрузке записей:", error);
                setLoading(false);
            }
        };

        fetchStocks();
    }, []);

    useEffect(() => {
        // Фильтруем запасы на основе поискового запроса
        let filteredStocks = allStocks.filter((stock) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                (stock.products?.name &&
                    stock.products.name.toLowerCase().includes(searchLower)) ||
                stock.quantity.toString().includes(searchLower) ||
                (stock.warehouses?.location &&
                    stock.warehouses.location
                        .toLowerCase()
                        .includes(searchLower))
            );
        });

        // Сортировка, если выбрана колонка
        if (sortColumn) {
            filteredStocks.sort((a, b) => {
                let valueA, valueB;

                switch (sortColumn) {
                    case "product":
                        valueA = a.products?.name || "";
                        valueB = b.products?.name || "";
                        break;
                    case "quantity":
                        valueA = a.quantity || 0;
                        valueB = b.quantity || 0;
                        break;
                    case "warehouse":
                        valueA = a.warehouses?.location || "";
                        valueB = b.warehouses?.location || "";
                        break;
                    default:
                        return 0;
                }

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

        // Разбиваем отсортированные запасы по страницам
        setStocks(
            filteredStocks.slice((currentPage - 1) * 10, currentPage * 10)
        );
        setTotalPages(Math.ceil(filteredStocks.length / 10));
    }, [searchQuery, allStocks, currentPage, sortColumn, sortDirection]);

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

    const handleDeleteClick = () => {
        setIsDeliting(true);
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
    };

    const handleCancelDelete = () => {
        setIsDeliting(false);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleAdded = async () => {
        const response = await databases.listDocuments(
            "6750a65c001d7b857826",
            "67514c74002d0fedcd30",
            [Query.orderDesc("$createdAt"), Query.limit(100)]
        );
        setAllStocks(response.documents);
        setIsAdding(false);
        setIsDeliting(false);
        setTotalDocuments(response.total);
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const toggleSelectAll = () => {
        if (stocks.length === 0) return;

        const newSelectedRows = new Set(selectedRows);
        if (stocks.every((stock) => newSelectedRows.has(stock.$id))) {
            stocks.forEach((stock) => newSelectedRows.delete(stock.$id));
        } else {
            stocks.forEach((stock) => newSelectedRows.add(stock.$id));
        }
        setSelectedRows(newSelectedRows);
        setShowSelectionInfo(newSelectedRows.size > 0);
    };

    const toggleSelectRow = (id) => {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.has(id)) {
            newSelectedRows.delete(id);
        } else {
            newSelectedRows.add(id);
        }
        setSelectedRows(newSelectedRows);
        setShowSelectionInfo(newSelectedRows.size > 0);
    };

    const isAllSelected =
        stocks.length > 0 &&
        stocks.every((stock) => selectedRows.has(stock.$id));

    const handleCancelSelection = () => {
        setSelectedRows(new Set());
        setShowSelectionInfo(false);
    };

    const handleGenerateReport = () => {
        let stocksToExport =
            selectedRows.size > 0
                ? allStocks.filter((stock) => selectedRows.has(stock.$id))
                : allStocks.filter((stock) => {
                      const searchLower = searchQuery.toLowerCase();
                      return (
                          (stock.products?.name &&
                              stock.products.name
                                  .toLowerCase()
                                  .includes(searchLower)) ||
                          stock.quantity.toString().includes(searchLower) ||
                          (stock.warehouses?.location &&
                              stock.warehouses.location
                                  .toLowerCase()
                                  .includes(searchLower))
                      );
                  });

        // Применяем сортировку, если она установлена
        if (sortColumn) {
            stocksToExport.sort((a, b) => {
                let valueA, valueB;

                switch (sortColumn) {
                    case "product":
                        valueA = a.products?.name || "";
                        valueB = b.products?.name || "";
                        break;
                    case "quantity":
                        valueA = a.quantity || 0;
                        valueB = b.quantity || 0;
                        break;
                    case "warehouse":
                        valueA = a.warehouses?.location || "";
                        valueB = b.warehouses?.location || "";
                        break;
                    default:
                        return 0;
                }

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

        // Подготавливаем данные для таблицы
        const tableBody = [["№", "Товар", "Количество", "Склад"]];

        stocksToExport.forEach((stock, index) => {
            tableBody.push([
                (index + 1).toString(),
                stock.products?.name || "-",
                stock.quantity || "-",
                stock.warehouses?.location || "-",
            ]);
        });

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        // Конфигурация документа
        const documentDefinition = {
            pageSize: "A4",
            pageOrientation: "landscape",
            content: [
                {
                    text: "Отчет по запасам на складах",
                    style: "header",
                    alignment: "center",
                    margin: [0, 0, 0, 10],
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ["auto", "*", "auto", "auto"],
                        body: tableBody,
                    },
                    layout: {
                        fillColor: function (rowIndex) {
                            return rowIndex % 2 === 0 ? "#f2f2f2" : null;
                        },
                    },
                },
                {
                    text: `Всего записей: ${stocksToExport.length}`,
                    style: "footer",
                    margin: [0, 10, 0, 0],
                },
                {
                    text: `Дата и время создания: ${formattedDate}`,
                    style: "footer",
                    margin: [0, 10, 0, 0],
                },
            ],
            styles: {
                header: {
                    fontSize: 16,
                    bold: true,
                },
                footer: {
                    fontSize: 10,
                    italics: true,
                },
            },
            defaultStyle: {
                font: "Roboto",
            },
        };

        // Создаем PDF
        pdfMake.createPdf(documentDefinition).open();
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
                <AddStockPage
                    onCancel={handleCancelAdd}
                    onStockAdded={handleAdded}
                />
            ) : isDeliting ? (
                <DeleteStockPage
                    onCancel={handleCancelDelete}
                    onStockDeleted={handleAdded}
                />
            ) : (
                <>
                    <h1 className="text-2xl mb-4 text-black font-semibold">
                        Запасы на складах
                    </h1>
                    <hr className="border-t border-gray-300 mb-6" />
                    <div className="flex justify-between mb-4">
                        <div className="relative flex-grow max-w-md mr-4">
                            <input
                                type="text"
                                placeholder="Поиск запасов..."
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
                            `}
                                title="Удалить запись"
                                onClick={handleDeleteClick}
                            >
                                <Minus size={20} />
                            </button>
                            <button
                                className="bg-purple-500 text-white w-10 h-10 rounded-lg flex justify-center items-center hover:bg-purple-600 transition"
                                title="Создать отчет"
                                onClick={handleGenerateReport}
                            >
                                <FileText size={20} />
                            </button>
                        </div>
                    </div>
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
                                    onClick={() => handleSort("product")}
                                >
                                    Товар
                                    {sortColumn === "product" && (
                                        <span className="ml-2">
                                            {sortDirection === "asc"
                                                ? "▲"
                                                : "▼"}
                                        </span>
                                    )}
                                </th>
                                <th
                                    className="border p-2 text-left text-black cursor-pointer hover:bg-blue-100"
                                    onClick={() => handleSort("quantity")}
                                >
                                    Количество
                                    {sortColumn === "quantity" && (
                                        <span className="ml-2">
                                            {sortDirection === "asc"
                                                ? "▲"
                                                : "▼"}
                                        </span>
                                    )}
                                </th>
                                <th
                                    className="border p-2 text-left text-black cursor-pointer hover:bg-blue-100"
                                    onClick={() => handleSort("warehouse")}
                                >
                                    Склад
                                    {sortColumn === "warehouse" && (
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
                            {stocks.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center p-4">
                                        <AlertTriangle
                                            className="inline-block mr-2"
                                            size={20}
                                        />
                                        Ничего не найдено по вашему запросу.
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock) => (
                                    <tr
                                        key={stock.$id}
                                        className="bg-white border hover:bg-blue-100"
                                    >
                                        <td className="border p-2 text-center">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-blue-600"
                                                checked={selectedRows.has(
                                                    stock.$id
                                                )}
                                                onChange={() =>
                                                    toggleSelectRow(stock.$id)
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                        </td>
                                        <td className="border p-2 text-black max-w-[200px] truncate">
                                            {stock.products?.name ||
                                                "Не указан"}
                                        </td>
                                        <td className="border p-2 text-black">
                                            {stock.quantity}
                                        </td>
                                        <td className="border p-2 text-black max-w-[150px] truncate">
                                            {stock.warehouses?.location ||
                                                "Не указан"}
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
