"use client"
import React, { useState, useEffect } from 'react';
import { Client, Databases, Query } from 'appwrite';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6750318900371dbd1cf3');

const databases = new Databases(client);

export default function ProductsPage() {
  const [selectedRows, setSelectedRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const response = await databases.listDocuments(
        '6750a65c001d7b857826',
        '6751443200130b3a0b9c',
        [
          Query.orderDesc('$createdAt'),
          Query.limit(10),
          Query.offset((currentPage - 1) * 10),
          Query.select([
            '$id',
            'name',
            'desc',
            'price',
            'suppliers.$id',
            'suppliers.name',
            'categories.$id',
            'categories.name'
          ])
        ]
      );
      setProducts(response.documents);
      setTotalPages(Math.ceil(response.total / 10));
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке товаров:', error);
      setLoading(false);
    }
  };

  fetchProducts();
}, [currentPage]);

const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
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
          />
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20} 
          />
        </div>
        
        <div className="flex space-x-2">
            <button 
                className="bg-green-500 text-white w-10 h-10 rounded-lg flex justify-center items-center hover:bg-green-600 transition"
                title="Добавить товар"
            >
                <Plus size={20} />
            </button>
            <button 
                className="bg-blue-500 text-white w-10 h-10 rounded-lg flex justify-center items-center hover:bg-blue-600 transition"
                title="Редактировать товар"
            >
                <Edit size={20} />
            </button>
            <button 
                className="bg-red-500 text-white w-10 h-10 rounded-lg flex justify-center items-center hover:bg-red-600 transition"
                title="Удалить товар"
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

      <table className="w-full border-collapse mb-4">
        <thead>
            <tr className="bg-blue-50">
            <th className="border p-2 w-12 text-center">
                <input 
                type="checkbox" 
                className="form-checkbox h-4 w-4 text-blue-600"
                />
            </th>
            <th className="border p-2 text-left text-black">Название</th>
            <th className="border p-2 text-left text-black">Описание</th>
            <th className="border p-2 text-left text-black">Цена</th>
            <th className="border p-2 text-left text-black">Поставщик</th>
            <th className="border p-2 text-left text-black">Категория</th>
            </tr>
        </thead>
        <tbody>
            {products.map((product) => (
            <tr 
                key={product.$id} 
                className={`hover:bg-gray-100 ${
                selectedRows.includes(product.$id) ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleSelectRow(product.$id)}
            >
                <td className="border p-2 text-center">
                <input 
                    type="checkbox" 
                    checked={selectedRows.includes(product.$id)}
                    onChange={() => handleSelectRow(product.$id)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                />
                </td>
                <td className="border p-2 text-black max-w-[200px] truncate">{product.name}</td>
                <td className="border p-2 text-black max-w-[300px] truncate">{product.desc}</td>
                <td className="border p-2 text-black">{product.price} ₸</td>
                <td className="border p-2 text-black max-w-[150px] truncate">
                {product.suppliers?.name || 'Не указан'}
                </td>
                <td className="border p-2 text-black max-w-[150px] truncate">
                {product.categories?.name || 'Не указана'}
                </td>
            </tr>
            ))}
        </tbody>
        </table>

      <div className="flex justify-between items-center">
        <div className="text-gray-600">
        Страница {currentPage} из {totalPages}
        </div>
        <div className="flex space-x-2">
        <button
            className={`bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition square-button ${
            currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''
            }`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
        >
            <ChevronLeft size={20} />
        </button>
        <button
            className={`bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition square-button ${
            currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''
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