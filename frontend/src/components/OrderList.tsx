'use client';

import React, { useState, useEffect } from 'react';

interface Order {
  id: number;
  type: 'Reparatur' | 'Wartung' | 'Modernisierung' | 'Neubau';
  description: string;
  location: string;
  coords: [number, number];
  planned_start: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  customer: string;
}

interface OrderListProps {
  orders: Order[];
  onOrderReorder: (orders: Order[]) => void;
  onOrderStatusChange: (orderId: number, status: Order['status']) => void;
  onOrderSelect: (order: Order) => void;
  selectedOrder?: Order | null;
}

const OrderList: React.FC<OrderListProps> = ({
  orders,
  onOrderReorder,
  onOrderStatusChange,
  onOrderSelect,
  selectedOrder
}) => {
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const handleDragStart = (e: React.DragEvent, orderId: number) => {
    setDraggedItem(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetOrderId: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetOrderId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = localOrders.findIndex(order => order.id === draggedItem);
    const targetIndex = localOrders.findIndex(order => order.id === targetOrderId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newOrders = [...localOrders];
    const [draggedOrder] = newOrders.splice(draggedIndex, 1);
    newOrders.splice(targetIndex, 0, draggedOrder);

    setLocalOrders(newOrders);
    onOrderReorder(newOrders);
    setDraggedItem(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-900 border border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-900 border border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-900 border border-green-200';
      default: return 'bg-gray-100 text-gray-900 border border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Reparatur': return 'bg-red-100 text-red-900 border border-red-200';
      case 'Wartung': return 'bg-blue-100 text-blue-900 border border-blue-200';
      case 'Modernisierung': return 'bg-yellow-100 text-yellow-900 border border-yellow-200';
      case 'Neubau': return 'bg-green-100 text-green-900 border border-green-200';
      default: return 'bg-gray-100 text-gray-900 border border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-900 border border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-900 border border-blue-200';
      case 'Open': return 'bg-gray-100 text-gray-900 border border-gray-200';
      case 'Cancelled': return 'bg-red-100 text-red-900 border border-red-200';
      default: return 'bg-gray-100 text-gray-900 border border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Aufträge ({localOrders.length})
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Ziehen Sie die Aufträge, um die Reihenfolge zu ändern
        </p>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {localOrders.map((order, index) => (
          <div
            key={order.id}
            draggable
            onDragStart={(e) => handleDragStart(e, order.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, order.id)}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
              selectedOrder?.id === order.id ? 'bg-[#0066b3]/10' : ''
            } ${draggedItem === order.id ? 'bg-[#0066b3]/20 shadow-lg' : ''}`}
            onClick={() => onOrderSelect(order)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(order.type)}`}>
                    {order.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    #{index + 1}
                  </span>
                </div>
                
                <h3 className="font-medium text-gray-900 mb-1">
                  {order.customer}
                </h3>
                
                <p className="text-sm text-gray-600 mb-2">
                  {order.description}
                </p>
                
                                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span className="font-medium">⏰ {new Date(order.planned_start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-medium">📍 {order.location}</span>
                        </div>
              </div>
              
              <div className="flex flex-col space-y-1 ml-4">
                                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOrderStatusChange(order.id, 'In Progress');
                          }}
                          disabled={order.status === 'Completed'}
                          className="text-xs bg-[#0066b3] text-white px-3 py-1 rounded font-medium hover:bg-[#005a9e] disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                        >
                          Starten
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOrderStatusChange(order.id, 'Completed');
                          }}
                          disabled={order.status === 'Completed'}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                        >
                          Abschließen
                        </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList; 