import React, { useState, useCallback, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, Sector
} from "recharts";
import {ANLYTICS_BASE_URL} from "@/api/url_config"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Info, Download, Zap, BarChart4, ChevronRight, Filter, RefreshCw, Maximize2 } from "lucide-react";
import axios from "axios";
import FadeInSection from "@/components/ui/FadeInSection";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import analyticsApi from "@/api/analyticsApi";
import DayDetailView, { DetailedDayData } from "@/components/analytics/DayDetailView";
import AnalyticsViewToggle from "@/components/analytics/AnalyticsViewToggle";

// Chart colors for consistency across the application
const COLORS = {
  // Product categories
  potatoes: "#27ae60",    // farmaze-green
  onions: "#7ed56f",      // farmaze-light-green
  carrots: "#f39c12",     // farmaze-yellow
  tomatoes: "#F16870",    // farmaze-orange
  others: "#3a2e2e",      // farmaze-brown
  
  // Days of the week
  monday: "#4F75BB",      // blue
  tuesday: "#5D8BC9",     // light blue
  wednesday: "#6A9FD7",   // lighter blue
  thursday: "#77B3E4",    // even lighter blue
  friday: "#84C8F2",     // very light blue
  saturday: "#91DCF0",    // sky blue
  sunday: "#9DF0FF",      // pale blue
};

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const years = ["2023", "2024", "2025"];

// Custom render function for active pie chart segment
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#333" className="text-sm font-medium">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#333" className="text-base font-bold">
        {value.toFixed(1)}
      </text>
      <text x={cx} y={cy} dy={25} textAnchor="middle" fill="#666" className="text-xs">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const Analytics = () => {
  // Use toast for notifications
  const { toast } = useToast();
  
  // View state management
  const [activeView, setActiveView] = useState<"consumption" | "expenses">("consumption");
  const [isCachingEnabled, setIsCachingEnabled] = useState<boolean>(true); // State for cache toggle
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [expandedChartOpen, setExpandedChartOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<"monthly" | "daily" | "weekly">("monthly");
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Loading states
  const [isLoading, setIsLoading] = useState({
    consumption: true,
    expenses: true,
    dailyConsumption: true,
    dailyExpenses: true,
    detailedDay: false
  });
  
  // API data states
  const [weeklyConsumptionData, setWeeklyConsumptionData] = useState<any[]>([]);
  const [weeklyExpensesData, setWeeklyExpensesData] = useState<any[]>([]);
  const [dailyConsumptionDistribution, setDailyConsumptionDistribution] = useState<any[]>([]);
  const [dailyExpensesDistribution, setDailyExpensesDistribution] = useState<any[]>([]);
  const [detailedDayConsumption, setDetailedDayConsumption] = useState<any[]>([]);
  const [detailedDayExpenses, setDetailedDayExpenses] = useState<any[]>([]);
  const [monthlyConsumptionData, setMonthlyConsumptionData] = useState<any[]>([]);
  const [monthlyExpenditureData, setMonthlyExpenditureData] = useState<any[]>([]);
  
  // Raw API response data for detailed views
  const [rawConsumptionByDay, setRawConsumptionByDay] = useState<Record<string, any[]>>({});
  const [rawExpenditureByDay, setRawExpenditureByDay] = useState<Record<string, any[]>>({});
  
  // Detailed SKU data for day view
  const [detailedSkuData, setDetailedSkuData] = useState<Record<string, DetailedDayData[]>>({});
  
  // State for date filters
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<string>("2024"); // Default to 2024 instead of current year
  
  // Function to fetch all data based on current selections
  const fetchAllData = useCallback(async () => {
    // Set loading states
    setIsLoading({
      consumption: true,
      expenses: true,
      dailyConsumption: true,
      dailyExpenses: true,
      detailedDay: false
    });
    
    try {
      // Fetch weekly summaries
      const weeklyConsumptionSummary = await analyticsApi.getWeeklyConsumptionSummary();
      const weeklyExpenditureSummary = await analyticsApi.getWeeklyExpenditureSummary();
      
      console.log('Weekly consumption summary:', weeklyConsumptionSummary);
      
      // The API now returns data already formatted for the pie chart
      console.log('Weekly consumption summary from API:', weeklyConsumptionSummary);
      console.log('Weekly expenditure summary from API:', weeklyExpenditureSummary);
      
      // Set the weekly data directly from the API response
      setWeeklyConsumptionData(weeklyConsumptionSummary);
      setWeeklyExpensesData(weeklyExpenditureSummary);
      
      // Get data for the last 30 days for daily distribution
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      // Format dates as YYYY-MM-DD
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // Fetch daily consumption and expenditure data
      const dailyConsumptionData = await analyticsApi.getConsumptionByDay(startDate, endDate);
      const dailyExpenditureData = await analyticsApi.getExpenditureByDay(startDate, endDate);
      
      // Get the weekly summary data directly
      const ANALYTICS_API_URL ='https://analytics.farmaze.com';
      // const ANALYTICS_API_URL = import.meta.env.VITE_ANALYTICS_API_URL || ANLYTICS_BASE_URL;
      const token = localStorage.getItem('farmaze_token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };
      
      // Get consumption by day data
      const consumptionResponse = await axios.get(
        `${ANALYTICS_API_URL}/consumption/by-day/?start_date=${startDate}&end_date=${endDate}`,
        { headers }
      );
      
      // Get expenditure by day data
      const expenditureResponse = await axios.get(
        `${ANALYTICS_API_URL}/expenditure/by-day/?start_date=${startDate}&end_date=${endDate}`,
        { headers }
      );
      
      // Get weekly consumption summary directly
      const weeklyConsumptionResponse = await axios.get(
        `${ANALYTICS_API_URL}/consumption/weekly-summary/`,
        { headers }
      );
      
      // Transform weekly summary data
      const weeklyData = weeklyConsumptionResponse.data?.weekly_summary || {};
      console.log('Raw weekly summary data:', weeklyData);
      
      const transformedWeeklyData = Object.keys(weeklyData).map(day => ({
        name: day,
        value: parseFloat(weeklyData[day].toFixed(2)),  // Ensure it's a number and limit decimal places
        percentage: parseFloat(weeklyData[day].toFixed(2)),  // Ensure it's a number and limit decimal places
        fill: COLORS[day.toLowerCase() as keyof typeof COLORS] || '#999'
      }));
      
      console.log('Transformed weekly data for pie chart:', transformedWeeklyData);
      
      // Update weekly consumption data - this will be used for the pie chart
      setWeeklyConsumptionData(transformedWeeklyData);
      
      // Store raw API response data
      const rawConsumptionData = consumptionResponse.data?.consumption_by_day || {};
      const rawExpenditureData = expenditureResponse.data?.expenditure_by_day || {};
      
      setRawConsumptionByDay(rawConsumptionData);
      setRawExpenditureByDay(rawExpenditureData);
      
      setDailyConsumptionDistribution(dailyConsumptionData);
      setDailyExpensesDistribution(dailyExpenditureData);
      
      // Fetch monthly data based on selected month and year
      const monthlyConsumption = await analyticsApi.getConsumptionForMonth(selectedYear, selectedMonth);
      const monthlyExpenditure = await analyticsApi.getExpenditureForMonth(selectedYear, selectedMonth);
      
      setMonthlyConsumptionData(monthlyConsumption);
      setMonthlyExpenditureData(monthlyExpenditure);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive"
      });
    } finally {
      // Reset loading states
      setIsLoading({
        consumption: false,
        expenses: false,
        dailyConsumption: false,
        dailyExpenses: false,
        detailedDay: false
      });
    }
  }, [selectedMonth, selectedYear, toast]);
  
  // Effect to fetch all data when component mounts, activeView changes, or date selection changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, activeView]);
  
  // Fetch expenditure by day data with date range limiting
  useEffect(() => {
    const fetchExpenditureByDay = async () => {
      setIsLoading(prev => ({ ...prev, dailyExpenses: true }));
      try {
        // Get data for the last 30 days only to optimize API calls
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        // Format dates as YYYY-MM-DD
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        console.log(`Fetching expenditure data from ${startDate} to ${endDate}`);
        const data = await analyticsApi.getExpenditureByDay(startDate, endDate);
        
        // Set the correct state variable
        setDailyExpensesDistribution(data);
      } catch (error) {
        console.error('Error fetching daily expenditure:', error);
        toast({
          title: "Error",
          description: "Failed to load daily expenditure data.",
          variant: "destructive"
        });
        // Set empty data when API fails
        setDailyExpensesDistribution([]);
      } finally {
        setIsLoading(prev => ({ ...prev, dailyExpenses: false }));
      }
    };
    
    fetchExpenditureByDay();
  }, [toast, activeView]);
  
  // Fetch monthly consumption data when month/year changes
  useEffect(() => {
    const fetchMonthlyConsumption = async () => {
      if (!selectedMonth || !selectedYear) return;
      
      setIsLoading(prev => ({ ...prev, consumption: true }));
      try {
        const data = await analyticsApi.getConsumptionForMonth(selectedYear, selectedMonth);
        
        // Transform API data to match the expected format for the bar chart
        const transformedData = data.map(item => ({
          name: item.product_name,
          value: item.value
        })).sort((a, b) => b.value - a.value);
        
        setMonthlyConsumptionData(transformedData);
      } catch (error) {
        console.error('Error fetching monthly consumption data:', error);
        toast({
          title: "Error",
          description: "Failed to load monthly consumption data.",
          variant: "destructive"
        });
        // Set empty data when API fails
        setMonthlyConsumptionData([]);
      } finally {
        setIsLoading(prev => ({ ...prev, consumption: false }));
      }
    };
    
    // Only fetch if we're in consumption view
    if (activeView === 'consumption') {
      fetchMonthlyConsumption();
    }
  }, [selectedMonth, selectedYear, activeView, toast]);
  
  // Fetch monthly expenditure data when month/year changes
  useEffect(() => {
    const fetchMonthlyExpenditure = async () => {
      if (!selectedMonth || !selectedYear) return;
      
      setIsLoading(prev => ({ ...prev, expenses: true }));
      try {
        const data = await analyticsApi.getExpenditureForMonth(selectedYear, selectedMonth);
        
        // Transform API data to match the expected format for the bar chart
        const transformedData = data.map(item => ({
          name: item.product_name,
          value: item.value
        })).sort((a, b) => b.value - a.value);
        
        setMonthlyExpenditureData(transformedData);
      } catch (error) {
        console.error('Error fetching monthly expenditure data:', error);
        toast({
          title: "Error",
          description: "Failed to load monthly expenditure data.",
          variant: "destructive"
        });
        // Set empty data when API fails
        setMonthlyExpenditureData([]);
      } finally {
        setIsLoading(prev => ({ ...prev, expenses: false }));
      }
    };
    
    // Only fetch if we're in expenses view
    if (activeView === 'expenses') {
      fetchMonthlyExpenditure();
    }
  }, [selectedMonth, selectedYear, activeView, toast]);
  
  // We no longer need to fetch detailed day data as we're using the raw data from handleDayClick
  // This effect is now disabled to prevent API calls
  /*
  useEffect(() => {
    const fetchDetailedDayData = async () => {
      // Implementation removed to prevent API calls
    };
    
    if (selectedDay && dialogOpen) {
      // We're not calling this anymore as we get data directly from handleDayClick
      // fetchDetailedDayData();
    }
  }, [selectedDay, dialogOpen, activeView, toast]);
  */
  
  // Fetch daily expenses distribution
  useEffect(() => {
    const fetchDailyExpenses = async () => {
      setIsLoading(prev => ({ ...prev, dailyExpenses: true }));
      try {
        const data = await analyticsApi.getExpenditureByDay();
        setDailyExpensesDistribution(data);
      } catch (error) {
        console.error('Error fetching daily expenses:', error);
        toast({
          title: "Error",
          description: "Failed to load daily expenses data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(prev => ({ ...prev, dailyExpenses: false }));
      }
    };
    
    fetchDailyExpenses();
  }, [toast]);
  
  // Handle day click for detailed view
  const handleDayClick = useCallback((day: any) => {
    setSelectedDay(day.day);
    console.log('Day clicked:', day.day);
    console.log('Raw consumption data:', rawConsumptionByDay);
    
    // Use the stored raw data instead of making a new API call
    if (activeView === "consumption") {
      // Extract the detailed product data from the raw consumption data
      const dayData = rawConsumptionByDay[day.day] || [];
      console.log('Detailed day consumption data:', dayData);
      
      // Transform the data to match the expected format for DayDetailView
      const transformedData = dayData.map((item: any) => ({
        name: item.name || item.product_name || 'Unknown',
        value: typeof item.value === 'number' ? item.value : 0,
        variant: item.variant || '',
        grade: item.grade || '',
        origin: item.origin || ''
      }));
      
      setDetailedDayConsumption(transformedData);
    } else {
      // Extract the detailed product data from the raw expenditure data
      const dayData = rawExpenditureByDay[day.day] || [];
      console.log('Detailed day expenditure data:', dayData);
      
      // Transform the data to match the expected format for DayDetailView
      const transformedData = dayData.map((item: any) => ({
        name: item.name || item.product_name || 'Unknown',
        value: typeof item.value === 'number' ? item.value : 0,
        variant: item.variant || '',
        grade: item.grade || '',
        origin: item.origin || ''
      }));
      
      setDetailedDayExpenses(transformedData);
    }
    
    // Open the dialog to show detailed data
    setDialogOpen(true);
  }, [activeView, rawConsumptionByDay, rawExpenditureByDay]);
  
  // Handle pie chart hover
  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);
  
  // Get bar chart data based on active view
  const barData = useMemo(() => {
    return activeView === "consumption" 
      ? weeklyConsumptionData
      : weeklyExpensesData;
  }, [activeView, weeklyConsumptionData, weeklyExpensesData]);
  
  // Get daily distribution data based on active view
  const dailyDistribution = useMemo(() => {
    console.log('Calculating dailyDistribution, activeView:', activeView);
    
    // Use the weekly consumption or expenditure data directly for the pie chart
    if (activeView === "consumption") {
      // Check if weeklyConsumptionData exists
      if (!weeklyConsumptionData || weeklyConsumptionData.length === 0) {
        console.error('No weekly consumption data available for pie chart');
        return []; // Return empty array as fallback
      }
      
      console.log('Using weeklyConsumptionData for pie chart:', weeklyConsumptionData);
      return weeklyConsumptionData;
    } else {
      // For expenditure view
      if (!weeklyExpensesData || weeklyExpensesData.length === 0) {
        console.error('No weekly expenditure data available for pie chart');
        return []; // Return empty array as fallback
      }
      
      console.log('Using weeklyExpensesData for pie chart:', weeklyExpensesData);
      return weeklyExpensesData;
    }
  }, [activeView, weeklyConsumptionData, weeklyExpensesData]);
  
  // Calculate total value for pie chart percentage
  const totalDailyValue = useMemo(() => {
    // Check if dailyDistribution is an array before using reduce
    if (!Array.isArray(dailyDistribution)) {
      console.error('Expected array for dailyDistribution but got:', dailyDistribution);
      return 0; // Return 0 as fallback
    }
    
    console.log('Calculating totalDailyValue from dailyDistribution:', dailyDistribution);
    
    // Safely calculate the sum by checking if each item has a valid value property
    const total = dailyDistribution.reduce((sum, item) => {
      // Ensure item.value is a number
      const value = typeof item.value === 'number' ? item.value : 0;
      return sum + value;
    }, 0);
    
    console.log('Calculated totalDailyValue:', total);
    return total;
  }, [dailyDistribution]);
  
  // Get color for dialog bar chart
  const getDialogBarChartColor = useCallback(() => {
    return activeView === "consumption" ? "#4F75BB" : "#3498db";
  }, [activeView]);
  
  // Get daily data for the bar chart
  const dailyData = useMemo(() => {
    const data = activeView === "consumption"
      ? dailyConsumptionDistribution
      : dailyExpensesDistribution;
      
    // Check if data is an array
    if (!Array.isArray(data)) {
      console.error('Expected array for daily data but got:', data);
      
      // Try to convert object to array if possible
      if (data && typeof data === 'object') {
        const consumptionByDay = data as any;
        
        if (consumptionByDay.consumption_by_day || consumptionByDay.expenditure_by_day) {
          const dayData = consumptionByDay.consumption_by_day || consumptionByDay.expenditure_by_day;
          const result = [];
          
          // Convert object of arrays to array format
          for (const day in dayData) {
            if (Object.prototype.hasOwnProperty.call(dayData, day) && Array.isArray(dayData[day])) {
              // Get total for each day
              const dayTotal = dayData[day].reduce((sum: number, item: any) => {
                return sum + (typeof item.value === 'number' ? item.value : 0);
              }, 0);
              
              result.push({
                day,
                value: dayTotal,
                // Add default category values
                potatoes: 0,
                onions: 0,
                carrots: 0,
                tomatoes: 0,
                others: 0
              });
            }
          }
          
          return result;
        }
      }
      
      return []; // Return empty array as fallback
    }
    
    return data;
  }, [activeView, dailyConsumptionDistribution, dailyExpensesDistribution]);

  return (
    <div className="frame-container mx-auto px-4 py-8 bg-gray-50">
      <FadeInSection>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-farmaze-brown mb-2">Analytics</h1>
          <p className="text-gray-500">Track your consumption and expenses patterns</p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <AnalyticsViewToggle activeView={activeView} setActiveView={setActiveView} />
          
          <div className="flex items-center gap-3">
            <Button 
              variant={isCachingEnabled ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                const newState = !isCachingEnabled;
                setIsCachingEnabled(newState);
                if (newState) {
                  analyticsApi.enableCaching();
                  toast({
                    title: "Caching Enabled",
                    description: "API responses will be cached for better performance",
                    variant: "default"
                  });
                } else {
                  analyticsApi.disableCaching();
                  analyticsApi.clearAllCaches();
                  toast({
                    title: "Caching Disabled",
                    description: "API responses will not be cached",
                    variant: "destructive"
                  });
                }
              }}
            >
              {isCachingEnabled ? (
                <>
                  <Zap size={16} className="text-yellow-400" />
                  <span>Caching On</span>
                </>
              ) : (
                <>
                  <Zap size={16} className="text-gray-400" />
                  <span>Caching Off</span>
                </>
              )}
            </Button>
            <div className="flex items-center gap-3">
              <Select
                value={selectedMonth}
                onValueChange={(value) => setSelectedMonth(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "January", "February", "March", "April",
                    "May", "June", "July", "August",
                    "September", "October", "November", "December"
                  ].map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedYear}
                onValueChange={(value) => setSelectedYear(value)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                // Clear caches
                analyticsApi.clearAllCaches();
                
                // Fetch fresh data
                fetchAllData();
                
                // Show toast notification
                
                toast({
                  title: "Refreshing Data",
                  description: "Fetching latest data from the server",
                  variant: "default"
                });
              }}
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </Button>
            
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Download size={18} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-[#333333] flex items-center">
                  <span className="w-3 h-3 rounded-sm mr-2" 
                    style={{ 
                      backgroundColor: activeView === "consumption" ? "#4F75BB" : "#3498db" 
                    }}
                  ></span>
                  {activeView === "consumption" 
                    ? `Vegetable Consumption - ${selectedMonth}` 
                    : `Vegetable Expenditure - ${selectedMonth}`}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8"
                    onClick={() => {
                      // Open expanded view in dialog
                      setSelectedChart("monthly");
                      setExpandedChartOpen(true);
                    }}
                  >
                    <Maximize2 className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Filter className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs text-gray-500">
                {activeView === "consumption" 
                  ? `Monthly consumption in kilograms for ${selectedMonth}` 
                  : `Monthly expenditure in dollars for ${selectedMonth}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 pt-0">
              {isLoading.consumption || isLoading.expenses ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-gray-200 mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activeView === "consumption" 
                        ? [...monthlyConsumptionData].sort((a, b) => b.value - a.value).slice(0, isChartExpanded ? monthlyConsumptionData.length : 8)
                        : [...monthlyExpenditureData].sort((a, b) => b.value - a.value).slice(0, isChartExpanded ? monthlyExpenditureData.length : 8)
                      }
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                    >
                    <defs>
                      <linearGradient 
                        id={`barGradient${activeView}`} 
                        x1="0" 
                        y1="0" 
                        x2="1" 
                        y2="0"
                      >
                        <stop 
                          offset="0%" 
                          stopColor={activeView === "consumption" ? "#4F75BB" : "#3498db"} 
                          stopOpacity={0.9}
                        />
                        <stop 
                          offset="100%" 
                          stopColor={activeView === "consumption" ? "#7E98C9" : "#5DADE2"} 
                          stopOpacity={0.9}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 11, fill: '#555' }} 
                      tickLine={{ stroke: '#e0e0e0' }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis 
                      dataKey="product_name" 
                      type="category" 
                      tick={{ fontSize: 11, fill: '#555' }} 
                      width={95}
                      tickLine={{ stroke: '#e0e0e0' }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip 
                      formatter={(value) => [
                        `${value} ${activeView === "consumption" ? "kg" : "$"}`,
                        activeView === "consumption" ? "Consumption" : "Cost"
                      ]}
                      contentStyle={{ 
                        backgroundColor: "white", 
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                      labelStyle={{ fontWeight: 600, marginBottom: "4px" }}
                      cursor={{fill: 'rgba(0,0,0,0.03)'}}
                    />
                    <Bar 
                      dataKey="value" 
                      fill={`url(#barGradient${activeView})`}
                      radius={[0, 4, 4, 0]} 
                      animationDuration={1200}
                      animationEasing="ease-in-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-[#333333] flex items-center">
                  <span className="w-3 h-3 rounded-sm mr-2" 
                    style={{ 
                      backgroundColor: activeView === "consumption" ? "#4F75BB" : "#3498db" 
                    }}
                  ></span>
                  {activeView === "consumption" 
                    ? "Daily Consumption Distribution" 
                    : "Daily Expenditure Distribution"}
                </CardTitle>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Info className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Breakdown by day of the week
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 pt-0">
            {isLoading.dailyConsumption || isLoading.dailyExpenses ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-gray-200 mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (dailyDistribution && dailyDistribution.length > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={dailyDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {dailyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || COLORS.others} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <div className="h-16 w-16 rounded-full border-2 border-gray-300 flex items-center justify-center mx-auto">
                      <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                  <p className="text-gray-500 font-medium">No data available</p>
                  <p className="text-gray-400 text-sm">Try changing your filters or check back later</p>
                </div>
              </div>
            )}
          </CardContent>
          </Card>
        </div>

        <Card className="mb-6 shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-medium text-[#333333] flex items-center">
                  <span className="w-3 h-3 rounded-sm mr-2" 
                    style={{ 
                      backgroundColor: activeView === "consumption" ? "#4F75BB" : "#3498db" 
                    }}
                  ></span>
                  {activeView === "consumption" 
                    ? "Daily Vegetable Breakdown" 
                    : "Daily Expenditure Breakdown"}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-1">
                  Detailed breakdown by vegetable type per day
                </CardDescription>
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center text-xs text-gray-600 self-start sm:self-auto">
                <Zap size={12} className="mr-1 text-amber-500" />
                Click on any day for detailed view
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-96 pt-2">
            {isLoading.dailyConsumption || isLoading.dailyExpenses ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : dailyData && dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData}
                  margin={{ top: 10, right: 30, left: 5, bottom: 20 }}
                  barSize={24}
                  barGap={0}
                  barCategoryGap={10}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      handleDayClick(data.activePayload[0].payload);
                    }
                  }}
                >
                <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  tick={{ 
                    fontSize: 11,
                    fill: '#555',
                    cursor: "pointer",
                    fontWeight: 500
                  }}
                />
                <YAxis 
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  tick={{ fontSize: 11, fill: '#666' }}
                  width={40}
                />
                <Tooltip 
                  formatter={(value, name, props) => {
                    // Get the product name from the data if available
                    const item = props.payload;
                    if (name === 'product1' && item && item.product1_name) {
                      return [`${value} ${activeView === "consumption" ? "kg" : "₹"}`, item.product1_name];
                    } else if (name === 'product2' && item && item.product2_name) {
                      return [`${value} ${activeView === "consumption" ? "kg" : "₹"}`, item.product2_name];
                    } else if (name === 'product3' && item && item.product3_name) {
                      return [`${value} ${activeView === "consumption" ? "kg" : "₹"}`, item.product3_name];
                    } else if (name === 'product4' && item && item.product4_name) {
                      return [`${value} ${activeView === "consumption" ? "kg" : "₹"}`, item.product4_name];
                    } else if (name === 'others') {
                      return [`${value} ${activeView === "consumption" ? "kg" : "₹"}`, 'Others'];
                    }
                    
                    // Fallback to default formatting
                    const formattedName = typeof name === 'string' 
                      ? name.charAt(0).toUpperCase() + name.slice(1) 
                      : String(name);
                    
                    return [
                      `${value} ${activeView === "consumption" ? "kg" : "₹"}`,
                      formattedName
                    ];
                  }}
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: "4px" }}
                  cursor={{fill: 'rgba(0,0,0,0.03)'}}
                />
                <Legend 
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 15 }}
                  formatter={(value, entry, index) => {
                    // Get the first item in the data array to extract product names
                    const firstItem = dailyData && dailyData.length > 0 ? dailyData[0] : null;
                    
                    if (value === 'product1' && firstItem && firstItem.product1_name) {
                      return <span className="text-xs">{firstItem.product1_name}</span>;
                    } else if (value === 'product2' && firstItem && firstItem.product2_name) {
                      return <span className="text-xs">{firstItem.product2_name}</span>;
                    } else if (value === 'product3' && firstItem && firstItem.product3_name) {
                      return <span className="text-xs">{firstItem.product3_name}</span>;
                    } else if (value === 'product4' && firstItem && firstItem.product4_name) {
                      return <span className="text-xs">{firstItem.product4_name}</span>;
                    } else if (value === 'others') {
                      return <span className="text-xs">Others</span>;
                    }
                    
                    return <span className="text-xs">{value}</span>;
                  }}
                />
                <Bar 
                  dataKey="product1" 
                  stackId="a" 
                  fill={COLORS.potatoes}
                  name={dailyData && dailyData.length > 0 && dailyData[0].product1_name ? dailyData[0].product1_name : "Product 1"}
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                />
                <Bar 
                  dataKey="product2" 
                  stackId="a" 
                  fill={COLORS.onions}
                  name={dailyData && dailyData.length > 0 && dailyData[0].product2_name ? dailyData[0].product2_name : "Product 2"}
                  animationDuration={1200} 
                  animationEasing="ease-in-out"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                />
                <Bar 
                  dataKey="product3" 
                  stackId="a" 
                  fill={COLORS.carrots}
                  name={dailyData && dailyData.length > 0 && dailyData[0].product3_name ? dailyData[0].product3_name : "Product 3"}
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                />
                <Bar 
                  dataKey="product4" 
                  stackId="a" 
                  fill={COLORS.tomatoes}
                  name={dailyData && dailyData.length > 0 && dailyData[0].product4_name ? dailyData[0].product4_name : "Product 4"}
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                />
                <Bar 
                  dataKey="others" 
                  stackId="a" 
                  fill={COLORS.others}
                  name="Others"
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <BarChart4 className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-500 font-medium">No data available</p>
                  <p className="text-gray-400 text-sm">Try changing your filters or check back later</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog for detailed day view */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {activeView === "consumption" ? "Consumption" : "Expenses"} Details for {selectedDay}
              </DialogTitle>
              <DialogDescription>
                Detailed breakdown by vegetable type
              </DialogDescription>
            </DialogHeader>
            
            {isLoading.detailedDay ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <DayDetailView 
                  data={activeView === "consumption" ? detailedDayConsumption : detailedDayExpenses}
                  barColor={getDialogBarChartColor()}
                  type={activeView}
                />
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </FadeInSection>
      {/* Expanded Chart Dialog */}
      <Dialog open={expandedChartOpen} onOpenChange={setExpandedChartOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedChart === "monthly" && (
                <>{activeView === "consumption" 
                  ? `Vegetable Consumption - ${selectedMonth} ${selectedYear}` 
                  : `Vegetable Expenditure - ${selectedMonth} ${selectedYear}`}</>
              )}
              {selectedChart === "daily" && (
                <>Daily Vegetable Breakdown</>
              )}
              {selectedChart === "weekly" && (
                <>Daily Consumption Distribution</>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedChart === "monthly" && (
                <>{activeView === "consumption" 
                  ? `Monthly consumption in kilograms for ${selectedMonth}` 
                  : `Monthly expenditure in dollars for ${selectedMonth}`}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="h-[70vh] w-full pt-4">
            {selectedChart === "monthly" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeView === "consumption" ? monthlyConsumptionData : monthlyExpenditureData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                >
                  <defs>
                    <linearGradient 
                      id={`expandedBarGradient${activeView}`} 
                      x1="0" 
                      y1="0" 
                      x2="1" 
                      y2="0"
                    >
                      <stop 
                        offset="0%" 
                        stopColor={activeView === "consumption" ? "#4F75BB" : "#3498db"} 
                        stopOpacity={0.9}
                      />
                      <stop 
                        offset="100%" 
                        stopColor={activeView === "consumption" ? "#7E98C9" : "#5DADE2"} 
                        stopOpacity={0.9}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12, fill: '#555' }} 
                    tickLine={{ stroke: '#e0e0e0' }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <YAxis 
                    dataKey="product_name" 
                    type="category" 
                    tick={{ fontSize: 12, fill: '#555' }} 
                    width={120}
                    tickLine={{ stroke: '#e0e0e0' }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <Tooltip 
                    formatter={(value) => [
                      `${value} ${activeView === "consumption" ? "kg" : "₹"}`,
                      activeView === "consumption" ? "Consumption" : "Cost"
                    ]}
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      fontSize: "13px",
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: "4px" }}
                    cursor={{fill: 'rgba(0,0,0,0.03)'}}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={`url(#expandedBarGradient${activeView})`}
                    radius={[0, 4, 4, 0]} 
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setExpandedChartOpen(false);
              setIsChartExpanded(false);
            }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analytics;
