
import { ProductCategory } from "./types";
import { 
  Coffee,
  IceCream,
  Beef,
  Pizza,
  Sandwich,
  Utensils,
  Soup,
  Package,
} from "lucide-react";
import React from "react";

export const B2B_CATEGORIES: ProductCategory[] = [
  { 
    name: "Brownies, Lavas & Cakes", 
    image: "", 
    icon: React.createElement(Utensils, { className: "h-5 w-5" }),
    subcategories: [
      { name: "Brownie" },
      { name: "Lava" },
      { name: "Cake" }
    ]
  },
  { 
    name: "Frozen Non-Veg Snacks", 
    image: "", 
    icon: React.createElement(Beef, { className: "h-5 w-5" }),
    subcategories: [
      { name: "Chicken" },
      { name: "Fish" },
      { name: "Mutton" }
    ]
  },
  { 
    name: "Burger Solutions", 
    image: "", 
    icon: React.createElement(Sandwich, { className: "h-5 w-5" }),
    subcategories: [
      { name: "Burger Patty" },
      { name: "Buns" },
      { name: "Sauces" }
    ]
  },
  { 
    name: "Pizzas & Crusts", 
    image: "", 
    icon: React.createElement(Pizza, { className: "h-5 w-5" }),
    subcategories: [
      { name: "Pizza Base" },
      { name: "Toppings" },
      { name: "Cheese" }
    ]
  },
  { 
    name: "Beverages", 
    image: "", 
    icon: React.createElement(Coffee, { className: "h-5 w-5" }),
    subcategories: [
      { name: "Coffee" },
      { name: "Tea" },
      { name: "Juices" }
    ]
  },
  { 
    name: "Desserts", 
    image: "", 
    icon: React.createElement(IceCream, { className: "h-5 w-5" }),
    subcategories: [
      { name: "Ice Cream" },
      { name: "Pastries" },
      { name: "Puddings" }
    ]
  },
  { 
    name: "Sauces & Dips", 
    image: "", 
    icon: React.createElement(Soup, { className: "h-5 w-5" }),
    subcategories: [
      { name: "Ketchup" },
      { name: "Mayonnaise" },
      { name: "Dips" }
    ]
  },
  { 
    name: "Packaging", 
    image: "", 
    icon: React.createElement(Package, { className: "h-5 w-5" }),
    subcategories: [
      { name: "Boxes" },
      { name: "Bags" },
      { name: "Containers" }
    ]
  }
];
