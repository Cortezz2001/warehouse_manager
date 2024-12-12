"use client";
import React, { useState, useEffect } from "react";
import { Client, Databases, Query, Account } from "appwrite";
import {
    Search,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    FileText,
    X,
    PlusCircle,
    MinusCircle,
} from "lucide-react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("6750318900371dbd1cf3");

const databases = new Databases(client);
const account = new Account(client);

export default function MovementsPage() {
    const [movements, setMovements] = useState([]);
    const [allMovements, setAllMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showSelectionInfo, setShowSelectionInfo] = useState(false);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");
    const [users, setUsers] = useState({});

    useEffect(() => {
        const fetchMovements = async () => {
            try {
                // Get the current authenticated user
                const user = await account.get();

                // Create a user map with just the current user
                const usersMap = {
                    [user.$id]: user.name,
                };
                setUsers(usersMap);

                // Fetching movements with related data
                const response = await databases.listDocuments(
                    "6750a65c001d7b857826",
                    "6751508c00274d3012e5",
                    [
                        Query.orderDesc("$createdAt"),
                        Query.limit(100),
                        Query.select([
                            "$id",
                            "type",
                            "user_id",
                            "product",
                            "warehouse",
                            "quantity",
                            "$createdAt",
                        ]),
                    ]
                );

                setAllMovements(response.documents);
                setTotalDocuments(response.total);
                setLoading(false);
            } catch (error) {
                console.error("Ошибка при загрузке записей:", error);
                setLoading(false);
            }
        };

        fetchMovements();
    }, []);

    useEffect(() => {
        // Filtering and sorting logic similar to ProductsPage
        let filteredMovements = allMovements.filter((movement) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                movement.product.toLowerCase().includes(searchLower) ||
                movement.warehouse.toLowerCase().includes(searchLower) ||
                movement.user_id.toLowerCase().includes(searchLower) ||
                movement.type.toLowerCase().includes(searchLower)
            );
        });

        if (sortColumn) {
            filteredMovements.sort((a, b) => {
                let valueA, valueB;

                switch (sortColumn) {
                    case "type":
                        valueA = a.type || "";
                        valueB = b.type || "";
                        break;
                    case "product":
                        valueA = a.product || "";
                        valueB = b.product || "";
                        break;
                    case "quantity":
                        valueA = a.quantity || 0;
                        valueB = b.quantity || 0;
                        break;
                    case "warehouse":
                        valueA = a.warehouse || "";
                        valueB = b.warehouse || "";
                        break;
                    case "user":
                        valueA = a.user_id || "";
                        valueB = b.user_id || "";
                        break;
                    case "createdAt":
                        valueA = new Date(a.$createdAt);
                        valueB = new Date(b.$createdAt);
                        break;
                    default:
                        return 0;
                }

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

        setMovements(
            filteredMovements.slice((currentPage - 1) * 10, currentPage * 10)
        );
        setTotalPages(Math.ceil(filteredMovements.length / 10));
    }, [
        searchQuery,
        allMovements,
        currentPage,
        sortColumn,
        sortDirection,
        users,
    ]);

    // Most methods from ProductsPage can be directly adapted here
    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const toggleSelectAll = () => {
        if (movements.length === 0) return;

        const newSelectedRows = new Set(selectedRows);
        if (movements.every((movement) => newSelectedRows.has(movement.$id))) {
            movements.forEach((movement) =>
                newSelectedRows.delete(movement.$id)
            );
        } else {
            movements.forEach((movement) => newSelectedRows.add(movement.$id));
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

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleGenerateReport = () => {
        // Similar to ProductsPage report generation
        let movementsToExport =
            selectedRows.size > 0
                ? allMovements.filter((movement) =>
                      selectedRows.has(movement.$id)
                  )
                : allMovements.filter((movement) => {
                      const searchLower = searchQuery.toLowerCase();
                      return (
                          movement.product
                              .toLowerCase()
                              .includes(searchLower) ||
                          movement.warehouse
                              .toLowerCase()
                              .includes(searchLower) ||
                          movement.user_id
                              ?.toLowerCase()
                              .includes(searchLower) ||
                          movement.type.toLowerCase().includes(searchLower)
                      );
                  });

        // Apply sorting
        if (sortColumn) {
            movementsToExport.sort((a, b) => {
                let valueA, valueB;

                switch (sortColumn) {
                    case "type":
                        valueA = a.type || "";
                        valueB = b.type || "";
                        break;
                    case "product":
                        valueA = a.product || "";
                        valueB = b.product || "";
                        break;
                    case "quantity":
                        valueA = a.quantity || 0;
                        valueB = b.quantity || 0;
                        break;
                    case "warehouse":
                        valueA = a.warehouse || "";
                        valueB = b.warehouse || "";
                        break;
                    case "user":
                        valueA = a.user_id || "";
                        valueB = b.user_id || "";
                        break;
                    case "createdAt":
                        valueA = new Date(a.$createdAt);
                        valueB = new Date(b.$createdAt);
                        break;
                    default:
                        return 0;
                }

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

        const tableBody = [
            [
                "№",
                "Тип движения",
                "Товар",
                "Количество",
                "Склад",
                "Сотрудник",
                "Дата и время",
            ],
        ];

        movementsToExport.forEach((movement, index) => {
            tableBody.push([
                (index + 1).toString(),
                movement.type === "Поступление" ? "+" : "-",
                movement.product || "-",
                movement.quantity || "-",
                movement.warehouse || "-",
                movement.user_id || "-",
                new Date(movement.$createdAt).toLocaleString("ru-RU"),
            ]);
        });

        // PDF generation similar to ProductsPage
        const documentDefinition = {
            pageSize: "A4",
            pageOrientation: "landscape",
            content: [
                {
                    text: "Отчет по движениям товаров",
                    style: "header",
                    alignment: "center",
                    margin: [0, 0, 0, 10],
                },
                {
                    table: {
                        headerRows: 1,
                        widths: [
                            "auto",
                            "auto",
                            "*",
                            "auto",
                            "auto",
                            "auto",
                            "auto",
                        ],
                        body: tableBody,
                    },
                    layout: {
                        fillColor: function (rowIndex) {
                            return rowIndex % 2 === 0 ? "#f2f2f2" : null;
                        },
                    },
                },
                {
                    text: `Всего записей: ${movementsToExport.length}`,
                    style: "footer",
                    margin: [0, 10, 0, 0],
                },
                {
                    text: `Дата и время создания: ${new Date().toLocaleString(
                        "ru-RU"
                    )}`,
                    style: "footer",
                    margin: [0, 10, 0, 0],
                },
            ],
            styles: {
                header: { fontSize: 16, bold: true },
                footer: { fontSize: 10, italics: true },
            },
            defaultStyle: { font: "Roboto" },
        };

        pdfMake.createPdf(documentDefinition).open();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    const isAllSelected =
        movements.length > 0 &&
        movements.every((movement) => selectedRows.has(movement.$id));

    return (
        <>
            <h1 className="text-2xl mb-4 text-black font-semibold">
                Движения товаров
            </h1>
            <hr className="border-t border-gray-300 mb-6" />
            <div className="flex justify-between mb-4">
                <div className="relative flex-grow max-w-md mr-4">
                    <input
                        type="text"
                        placeholder="Поиск движений..."
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-blue-500 text-black"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500 transition"
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
                            onClick={() => handleSort("type")}
                        >
                            {sortColumn === "type" && (
                                <span className="ml-2">
                                    {sortDirection === "asc" ? "▲" : "▼"}
                                </span>
                            )}
                        </th>
                        <th
                            className="border p-2 text-left text-black cursor-pointer hover:bg-blue-100"
                            onClick={() => handleSort("product")}
                        >
                            Товар
                            {sortColumn === "product" && (
                                <span className="ml-2">
                                    {sortDirection === "asc" ? "▲" : "▼"}
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
                                    {sortDirection === "asc" ? "▲" : "▼"}
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
                                    {sortDirection === "asc" ? "▲" : "▼"}
                                </span>
                            )}
                        </th>
                        <th
                            className="border p-2 text-left text-black cursor-pointer hover:bg-blue-100"
                            onClick={() => handleSort("user")}
                        >
                            Сотрудник
                            {sortColumn === "user" && (
                                <span className="ml-2">
                                    {sortDirection === "asc" ? "▲" : "▼"}
                                </span>
                            )}
                        </th>
                        <th
                            className="border p-2 text-left text-black cursor-pointer hover:bg-blue-100"
                            onClick={() => handleSort("createdAt")}
                        >
                            Дата и время
                            {sortColumn === "createdAt" && (
                                <span className="ml-2">
                                    {sortDirection === "asc" ? "▲" : "▼"}
                                </span>
                            )}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {movements.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="text-center p-4">
                                <AlertTriangle
                                    className="inline-block mr-2"
                                    size={20}
                                />
                                Ничего не найдено по вашему запросу.
                            </td>
                        </tr>
                    ) : (
                        movements.map((movement) => (
                            <tr
                                key={movement.$id}
                                className="bg-white border hover:bg-blue-100"
                            >
                                <td className="border p-2 text-center">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-4 w-4 text-blue-600"
                                        checked={selectedRows.has(movement.$id)}
                                        onChange={() =>
                                            toggleSelectRow(movement.$id)
                                        }
                                    />
                                </td>
                                <td className="border p-2 text-center">
                                    {movement.type === "Поступление" ? (
                                        <PlusCircle
                                            size={20}
                                            className="text-green-500 inline-block"
                                        />
                                    ) : (
                                        <MinusCircle
                                            size={20}
                                            className="text-red-500 inline-block"
                                        />
                                    )}
                                </td>
                                <td className="border p-2 text-black max-w-[200px] truncate">
                                    {movement.product || "Не указан"}
                                </td>
                                <td className="border p-2 text-black">
                                    {movement.quantity}
                                </td>
                                <td className="border p-2 text-black max-w-[150px] truncate">
                                    {movement.warehouse || "Не указан"}
                                </td>
                                <td className="border p-2 text-black max-w-[150px] truncate">
                                    {movement.user_id || "Не указан"}
                                </td>
                                <td className="border p-2 text-black">
                                    {new Date(
                                        movement.$createdAt
                                    ).toLocaleString("ru-RU")}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {showSelectionInfo && selectedRows.size > 0 && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 shadow-lg rounded-md p-4 flex justify-between items-center w-1/3">
                    <span>
                        {selectedRows.size} / {totalDocuments} записей выбрано
                    </span>
                    <button
                        className="text-red-500"
                        onClick={() => {
                            setSelectedRows(new Set());
                            setShowSelectionInfo(false);
                        }}
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
