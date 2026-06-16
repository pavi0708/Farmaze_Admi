export const analytics = {
  // Weekly consumption data
  weeklyConsumption: [
    { day: 'Monday', value: 120 },
    { day: 'Tuesday', value: 150 },
    { day: 'Wednesday', value: 180 },
    { day: 'Thursday', value: 140 },
    { day: 'Friday', value: 200 },
    { day: 'Saturday', value: 220 },
    { day: 'Sunday', value: 160 }
  ],
  
  // Consumption by day
  consumptionByDay: [
    { id: '1', name: 'Tomato - Country', value: 25, percentage: 20.83 },
    { id: '2', name: 'Onion - Big', value: 15, percentage: 12.5 },
    { id: '4', name: 'Carrot - Ooty', value: 10, percentage: 8.33 },
    { id: '8', name: 'Drumstick', value: 8, percentage: 6.67 },
    { id: '9', name: 'Ginger', value: 6, percentage: 5 },
    { id: 'others', name: 'Others', value: 56, percentage: 46.67 }
  ],
  
  // Consumption for specific days
  consumptionForDay: {
    'Monday': [
      { id: '1', name: 'Tomato - Country', value: 25, percentage: 20.83, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 15, percentage: 12.5, sku: 'ONI001' },
      { id: '4', name: 'Carrot - Ooty', value: 10, percentage: 8.33, sku: 'CAR001' },
      { id: '8', name: 'Drumstick', value: 8, percentage: 6.67, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 6, percentage: 5, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 5, percentage: 4.17, sku: 'GAR001' },
      { id: '11', name: 'Cabbage', value: 5, percentage: 4.17, sku: 'CAB001' },
      { id: '12', name: 'Cauliflower', value: 5, percentage: 4.17, sku: 'CAU001' },
      { id: '13', name: 'Ladies Finger', value: 5, percentage: 4.17, sku: 'LAD001' },
      { id: '14', name: 'Brinjal', value: 5, percentage: 4.17, sku: 'BRI001' },
      { id: '15', name: 'Mushroom', value: 5, percentage: 4.17, sku: 'MUS001' },
      { id: '16', name: 'Curry Leaves', value: 5, percentage: 4.17, sku: 'CUR001' },
      { id: '17', name: 'Mint Leaves', value: 5, percentage: 4.17, sku: 'MIN001' },
      { id: '19', name: 'Green Capsicum', value: 5, percentage: 4.17, sku: 'CAP001' },
      { id: '20', name: 'Yellow Pumpkin', value: 5, percentage: 4.17, sku: 'PUM001' }
    ],
    'Tuesday': [
      { id: '1', name: 'Tomato - Country', value: 30, percentage: 20, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 20, percentage: 13.33, sku: 'ONI001' },
      { id: '4', name: 'Carrot - Ooty', value: 15, percentage: 10, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 15, percentage: 10, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 10, percentage: 6.67, sku: 'BAN001' },
      { id: '8', name: 'Drumstick', value: 10, percentage: 6.67, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 10, percentage: 6.67, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 10, percentage: 6.67, sku: 'GAR001' },
      { id: '11', name: 'Cabbage', value: 10, percentage: 6.67, sku: 'CAB001' },
      { id: '12', name: 'Cauliflower', value: 10, percentage: 6.67, sku: 'CAU001' },
      { id: '13', name: 'Ladies Finger', value: 10, percentage: 6.67, sku: 'LAD001' }
    ],
    'Wednesday': [
      { id: '1', name: 'Tomato - Country', value: 35, percentage: 19.44, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 25, percentage: 13.89, sku: 'ONI001' },
      { id: '3', name: 'Potato', value: 20, percentage: 11.11, sku: 'POT001' },
      { id: '4', name: 'Carrot - Ooty', value: 20, percentage: 11.11, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 20, percentage: 11.11, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 15, percentage: 8.33, sku: 'BAN001' },
      { id: '7', name: 'Coconut - Big', value: 15, percentage: 8.33, sku: 'COC001' },
      { id: '8', name: 'Drumstick', value: 10, percentage: 5.56, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 10, percentage: 5.56, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 10, percentage: 5.56, sku: 'GAR001' }
    ],
    'Thursday': [
      { id: '1', name: 'Tomato - Country', value: 30, percentage: 21.43, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 20, percentage: 14.29, sku: 'ONI001' },
      { id: '3', name: 'Potato', value: 15, percentage: 10.71, sku: 'POT001' },
      { id: '4', name: 'Carrot - Ooty', value: 15, percentage: 10.71, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 15, percentage: 10.71, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 10, percentage: 7.14, sku: 'BAN001' },
      { id: '7', name: 'Coconut - Big', value: 10, percentage: 7.14, sku: 'COC001' },
      { id: '8', name: 'Drumstick', value: 10, percentage: 7.14, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 10, percentage: 7.14, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 5, percentage: 3.57, sku: 'GAR001' }
    ],
    'Friday': [
      { id: '1', name: 'Tomato - Country', value: 40, percentage: 20, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 30, percentage: 15, sku: 'ONI001' },
      { id: '3', name: 'Potato', value: 25, percentage: 12.5, sku: 'POT001' },
      { id: '4', name: 'Carrot - Ooty', value: 25, percentage: 12.5, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 20, percentage: 10, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 15, percentage: 7.5, sku: 'BAN001' },
      { id: '7', name: 'Coconut - Big', value: 15, percentage: 7.5, sku: 'COC001' },
      { id: '8', name: 'Drumstick', value: 10, percentage: 5, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 10, percentage: 5, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 10, percentage: 5, sku: 'GAR001' }
    ],
    'Saturday': [
      { id: '1', name: 'Tomato - Country', value: 45, percentage: 20.45, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 35, percentage: 15.91, sku: 'ONI001' },
      { id: '3', name: 'Potato', value: 30, percentage: 13.64, sku: 'POT001' },
      { id: '4', name: 'Carrot - Ooty', value: 25, percentage: 11.36, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 25, percentage: 11.36, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 20, percentage: 9.09, sku: 'BAN001' },
      { id: '7', name: 'Coconut - Big', value: 15, percentage: 6.82, sku: 'COC001' },
      { id: '8', name: 'Drumstick', value: 10, percentage: 4.55, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 10, percentage: 4.55, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 5, percentage: 2.27, sku: 'GAR001' }
    ],
    'Sunday': [
      { id: '1', name: 'Tomato - Country', value: 35, percentage: 21.88, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 25, percentage: 15.63, sku: 'ONI001' },
      { id: '3', name: 'Potato', value: 20, percentage: 12.5, sku: 'POT001' },
      { id: '4', name: 'Carrot - Ooty', value: 20, percentage: 12.5, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 15, percentage: 9.38, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 15, percentage: 9.38, sku: 'BAN001' },
      { id: '7', name: 'Coconut - Big', value: 10, percentage: 6.25, sku: 'COC001' },
      { id: '8', name: 'Drumstick', value: 10, percentage: 6.25, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 5, percentage: 3.13, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 5, percentage: 3.13, sku: 'GAR001' }
    ]
  },
  
  // Consumption for specific months
  consumptionForMonth: {
    '2025-01': [
      { id: '1', name: 'Tomato - Country', value: 800, percentage: 20, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 600, percentage: 15, sku: 'ONI001' },
      { id: '3', name: 'Potato', value: 500, percentage: 12.5, sku: 'POT001' },
      { id: '4', name: 'Carrot - Ooty', value: 400, percentage: 10, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 400, percentage: 10, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 300, percentage: 7.5, sku: 'BAN001' },
      { id: '7', name: 'Coconut - Big', value: 300, percentage: 7.5, sku: 'COC001' },
      { id: '8', name: 'Drumstick', value: 200, percentage: 5, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 200, percentage: 5, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 200, percentage: 5, sku: 'GAR001' },
      { id: '11', name: 'Cabbage', value: 100, percentage: 2.5, sku: 'CAB001' }
    ],
    '2025-02': [
      { id: '1', name: 'Tomato - Country', value: 750, percentage: 18.75, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 650, percentage: 16.25, sku: 'ONI001' },
      { id: '3', name: 'Potato', value: 550, percentage: 13.75, sku: 'POT001' },
      { id: '4', name: 'Carrot - Ooty', value: 450, percentage: 11.25, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 350, percentage: 8.75, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 350, percentage: 8.75, sku: 'BAN001' },
      { id: '7', name: 'Coconut - Big', value: 250, percentage: 6.25, sku: 'COC001' },
      { id: '8', name: 'Drumstick', value: 250, percentage: 6.25, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 200, percentage: 5, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 200, percentage: 5, sku: 'GAR001' }
    ],
    '2025-03': [
      { id: '1', name: 'Tomato - Country', value: 900, percentage: 22.5, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 700, percentage: 17.5, sku: 'ONI001' },
      { id: '3', name: 'Potato', value: 500, percentage: 12.5, sku: 'POT001' },
      { id: '4', name: 'Carrot - Ooty', value: 400, percentage: 10, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 400, percentage: 10, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 300, percentage: 7.5, sku: 'BAN001' },
      { id: '7', name: 'Coconut - Big', value: 300, percentage: 7.5, sku: 'COC001' },
      { id: '8', name: 'Drumstick', value: 200, percentage: 5, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 200, percentage: 5, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 100, percentage: 2.5, sku: 'GAR001' }
    ],
    '2025-04': [
      { id: '1', name: 'Tomato - Country', value: 850, percentage: 21.25, sku: 'TOM001' },
      { id: '2', name: 'Onion - Big', value: 650, percentage: 16.25, sku: 'ONI001' },
      { id: '3', name: 'Potato', value: 550, percentage: 13.75, sku: 'POT001' },
      { id: '4', name: 'Carrot - Ooty', value: 450, percentage: 11.25, sku: 'CAR001' },
      { id: '5', name: 'Apple - Dark Red', value: 350, percentage: 8.75, sku: 'APP001' },
      { id: '6', name: 'Banana - Robusta', value: 350, percentage: 8.75, sku: 'BAN001' },
      { id: '7', name: 'Coconut - Big', value: 250, percentage: 6.25, sku: 'COC001' },
      { id: '8', name: 'Drumstick', value: 250, percentage: 6.25, sku: 'DRU001' },
      { id: '9', name: 'Ginger', value: 150, percentage: 3.75, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 150, percentage: 3.75, sku: 'GAR001' }
    ]
  },
  
  // Expenditure by day
  expenditureByDay: [
    { id: '1', name: 'Tomato - Country', value: 2000, percentage: 25 },
    { id: '2', name: 'Onion - Big', value: 900, percentage: 11.25 },
    { id: '5', name: 'Apple - Dark Red', value: 3000, percentage: 37.5 },
    { id: '9', name: 'Ginger', value: 720, percentage: 9 },
    { id: 'others', name: 'Others', value: 1380, percentage: 17.25 }
  ],
  
  // Expenditure for specific days
  expenditureForDay: {
    'Monday': [
      { id: '1', name: 'Tomato - Country', value: 2000, percentage: 25, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 3000, percentage: 37.5, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 900, percentage: 11.25, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 720, percentage: 9, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 750, percentage: 9.38, sku: 'GAR001' },
      { id: '4', name: 'Carrot - Ooty', value: 630, percentage: 7.88, sku: 'CAR001' }
    ],
    'Tuesday': [
      { id: '1', name: 'Tomato - Country', value: 2400, percentage: 26.67, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 3000, percentage: 33.33, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 1200, percentage: 13.33, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 1200, percentage: 13.33, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 1200, percentage: 13.33, sku: 'GAR001' }
    ],
    'Wednesday': [
      { id: '1', name: 'Tomato - Country', value: 2800, percentage: 25.93, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 4000, percentage: 37.04, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 1500, percentage: 13.89, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 1200, percentage: 11.11, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 1300, percentage: 12.04, sku: 'GAR001' }
    ],
    'Thursday': [
      { id: '1', name: 'Tomato - Country', value: 2400, percentage: 28.57, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 3000, percentage: 35.71, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 1200, percentage: 14.29, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 1200, percentage: 14.29, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 600, percentage: 7.14, sku: 'GAR001' }
    ],
    'Friday': [
      { id: '1', name: 'Tomato - Country', value: 3200, percentage: 26.67, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 4000, percentage: 33.33, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 1800, percentage: 15, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 1200, percentage: 10, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 1800, percentage: 15, sku: 'GAR001' }
    ],
    'Saturday': [
      { id: '1', name: 'Tomato - Country', value: 3600, percentage: 27.27, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 5000, percentage: 37.88, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 2100, percentage: 15.91, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 1200, percentage: 9.09, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 1300, percentage: 9.85, sku: 'GAR001' }
    ],
    'Sunday': [
      { id: '1', name: 'Tomato - Country', value: 2800, percentage: 29.17, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 3000, percentage: 31.25, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 1500, percentage: 15.63, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 600, percentage: 6.25, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 1700, percentage: 17.71, sku: 'GAR001' }
    ]
  },
  
  // Expenditure for specific months
  expenditureForMonth: {
    '2025-01': [
      { id: '1', name: 'Tomato - Country', value: 64000, percentage: 26.67, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 80000, percentage: 33.33, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 36000, percentage: 15, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 24000, percentage: 10, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 36000, percentage: 15, sku: 'GAR001' }
    ],
    '2025-02': [
      { id: '1', name: 'Tomato - Country', value: 60000, percentage: 25, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 70000, percentage: 29.17, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 39000, percentage: 16.25, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 24000, percentage: 10, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 47000, percentage: 19.58, sku: 'GAR001' }
    ],
    '2025-03': [
      { id: '1', name: 'Tomato - Country', value: 72000, percentage: 30, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 80000, percentage: 33.33, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 42000, percentage: 17.5, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 24000, percentage: 10, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 22000, percentage: 9.17, sku: 'GAR001' }
    ],
    '2025-04': [
      { id: '1', name: 'Tomato - Country', value: 68000, percentage: 28.33, sku: 'TOM001' },
      { id: '5', name: 'Apple - Dark Red', value: 70000, percentage: 29.17, sku: 'APP001' },
      { id: '2', name: 'Onion - Big', value: 39000, percentage: 16.25, sku: 'ONI001' },
      { id: '9', name: 'Ginger', value: 18000, percentage: 7.5, sku: 'GIN001' },
      { id: '10', name: 'Garlic', value: 45000, percentage: 18.75, sku: 'GAR001' }
    ]
  }
};
