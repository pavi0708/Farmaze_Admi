export const orders = [
  {
    id: 'order1',
    orderNumber: 'ORD-2025-001',
    date: '2025-04-01',
    status: 'delivered',
    items: [
      { productId: '1', name: 'Tomato - Country', quantity: 5, unit: 'Kg', price: 80 },
      { productId: '2', name: 'Onion - Big', quantity: 3, unit: 'Kg', price: 60 },
      { productId: '4', name: 'Carrot - Ooty', quantity: 2, unit: 'Kg', price: 70 }
    ],
    total: 730,
    customer: {
      name: 'Restaurant A',
      address: '123 Main St, Bangalore',
      phone: '+91 9876543210'
    }
  },
  {
    id: 'order2',
    orderNumber: 'ORD-2025-002',
    date: '2025-04-03',
    status: 'processing',
    items: [
      { productId: '5', name: 'Apple - Dark Red', quantity: 3, unit: 'Kg', price: 200 },
      { productId: '6', name: 'Banana - Robusta', quantity: 2, unit: 'Dozen', price: 60 },
      { productId: '18', name: 'Lemon', quantity: 1, unit: 'Kg', price: 120 }
    ],
    total: 840,
    customer: {
      name: 'Restaurant B',
      address: '456 Park Ave, Bangalore',
      phone: '+91 9876543211'
    }
  },
  {
    id: 'order3',
    orderNumber: 'ORD-2025-003',
    date: '2025-04-05',
    status: 'pending',
    items: [
      { productId: '8', name: 'Drumstick', quantity: 2, unit: 'Kg', price: 90 },
      { productId: '9', name: 'Ginger', quantity: 1, unit: 'Kg', price: 120 },
      { productId: '10', name: 'Garlic', quantity: 1, unit: 'Kg', price: 150 },
      { productId: '16', name: 'Curry Leaves', quantity: 3, unit: 'Bunch', price: 20 }
    ],
    total: 510,
    customer: {
      name: 'Restaurant C',
      address: '789 Oak St, Bangalore',
      phone: '+91 9876543212'
    }
  },
  {
    id: 'order4',
    orderNumber: 'ORD-2025-004',
    date: '2025-04-06',
    status: 'delivered',
    items: [
      { productId: '11', name: 'Cabbage', quantity: 4, unit: 'Kg', price: 40 },
      { productId: '12', name: 'Cauliflower', quantity: 3, unit: 'Pcs', price: 60 },
      { productId: '13', name: 'Ladies Finger', quantity: 2, unit: 'Kg', price: 80 },
      { productId: '14', name: 'Brinjal', quantity: 2, unit: 'Kg', price: 70 }
    ],
    total: 610,
    customer: {
      name: 'Restaurant D',
      address: '321 Pine St, Bangalore',
      phone: '+91 9876543213'
    }
  },
  {
    id: 'order5',
    orderNumber: 'ORD-2025-005',
    date: '2025-04-07',
    status: 'processing',
    items: [
      { productId: '15', name: 'Mushroom', quantity: 5, unit: 'Box', price: 80 },
      { productId: '17', name: 'Mint Leaves', quantity: 4, unit: 'Bunch', price: 20 },
      { productId: '19', name: 'Green Capsicum', quantity: 3, unit: 'Kg', price: 100 },
      { productId: '20', name: 'Yellow Pumpkin', quantity: 2, unit: 'Kg', price: 40 }
    ],
    total: 780,
    customer: {
      name: 'Restaurant E',
      address: '654 Elm St, Bangalore',
      phone: '+91 9876543214'
    }
  }
];
