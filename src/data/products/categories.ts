
import { ProductCategory } from "./types";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { 
    name: "Vegetables", 
    image: "https://images.unsplash.com/photo-1557844352-761f2565b576?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
    subcategories: [
      { name: "Tomato, Onion, Potato" },
      { name: "Leafy Vegetables" },
      { name: "Capsicum" },
      { name: "Mushroom" },
      { name: "Exotic Vegetables" },
      { name: "Frozen Vegetables" },
      { name: "Cut Vegetables" },
    ]
  },
  { 
    name: "Fruits", 
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
    subcategories: [
      { name: "Citrus Fruits" },
      { name: "Tropical Fruits" },
      { name: "Berries" },
      { name: "Imported Fruits" },
      { name: "Frozen Fruits" },
      { name: "Dried Fruits" },
    ]
  },
  { 
    name: "Dairy", 
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
    subcategories: [
      { name: "Milk" },
      { name: "Yogurt" },
      { name: "Cheese" },
      { name: "Butter & Cream" },
    ]
  },
  { 
    name: "Groceries", 
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
    subcategories: [
      { name: "Rice & Grains" },
      { name: "Pulses" },
      { name: "Flour & Baking" },
      { name: "Oils & Spices" },
    ]
  },
  { 
    name: "Meat & Seafood", 
    image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
    subcategories: [
      { name: "Chicken" },
      { name: "Mutton" },
      { name: "Fish" },
      { name: "Shellfish" },
      { name: "Processed Meats" },
    ]
  },
];
