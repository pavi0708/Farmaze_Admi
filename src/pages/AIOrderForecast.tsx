import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, Loader2, Info, ChevronDown, ChevronUp, AlertTriangle, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatePicker } from '@/components/ui/date-picker';
import analyticsApi, {
  ProductSuggestion,
  ForecastResponse,
  ProductForecast,
  ForecastAccuracyResponse,
  SuggestionContext,
  CalibrationDateResponse,
  CalibrationProduct,
  CalibrationStatusResponse,
  CalibrationStatusProduct,
} from '@/api/analyticsApi';
import productApi from '@/api/productApi';
import { Product } from '@/components/products/ProductTypes';
import TomorrowsPrediction, { ForecastItem } from '@/components/forecast/TomorrowsPrediction';
import ActualVsPredictedChart, { ActualVsPredictedPoint } from '@/components/forecast/ActualVsPredictedChart';
import WeeklyPatternChart, { WeeklyPatternData } from '@/components/forecast/WeeklyPatternChart';
import ProductForecastAccordion, { ProductForecastDetail } from '@/components/forecast/ProductForecastAccordion';
import CalendarContextCard from '@/components/forecast/CalendarContextCard';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getCurrentDay = () => DAYS[new Date().getDay()];
const getTomorrowDay = () => DAYS[(new Date().getDay() + 1) % 7];

const formatTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatDateRange = () => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
};

// ── Helper: is the selected date today or tomorrow (live forecast) ───
const isLiveDate = (date: Date | undefined): boolean => {
  if (!date) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);
  return selected >= today;
};

// ── Confidence label badge ───────────────────────────────────────────
const ConfidenceLabelBadge = ({ label }: { label: string | null | undefined }) => {
  if (!label) return null;
  const styles: Record<string, string> = {
    high: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase border ${styles[label] || styles.low}`}>
      {label}
    </span>
  );
};

// ── Forecast method badge ────────────────────────────────────────────
const ForecastMethodBadge = ({ method }: { method: string | null | undefined }) => {
  if (!method) return null;
  const labels: Record<string, string> = {
    prophet_ml: 'Prophet ML',
    moving_avg: 'Moving Avg',
    last_weekday: 'Last Weekday',
    simple_average: 'Simple Avg',
  };
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
      {labels[method] || method}
    </span>
  );
};

// ── Error color for pct_error ────────────────────────────────────────
const getErrorColor = (pctError: number | null): string => {
  if (pctError === null) return 'text-gray-400';
  if (pctError < 15) return 'text-green-600';
  if (pctError < 30) return 'text-amber-600';
  return 'text-red-600';
};

const getErrorBg = (pctError: number | null): string => {
  if (pctError === null) return '';
  if (pctError < 15) return 'bg-green-50';
  if (pctError < 30) return 'bg-amber-50';
  return 'bg-red-50';
};

const AIOrderForecast = () => {
  const [loading, setLoading] = useState(true);
  const [forecastItems, setForecastItems] = useState<ForecastItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPatternData[]>([]);
  const [chartData, setChartData] = useState<ActualVsPredictedPoint[]>([]);
  const [productDetails, setProductDetails] = useState<ProductForecastDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modelAccuracy, setModelAccuracy] = useState<number | null>(null);
  const [accuracyRating, setAccuracyRating] = useState<string>('');
  const [contextData, setContextData] = useState<SuggestionContext | null>(null);
  const [forecastSource, setForecastSource] = useState<'prophet' | 'suggestions'>('suggestions');

  // Calibration state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calibrationData, setCalibrationData] = useState<CalibrationDateResponse | null>(null);
  const [calibrationStatus, setCalibrationStatus] = useState<CalibrationStatusResponse | null>(null);
  const [healthOpen, setHealthOpen] = useState(false);
  const [loadingCalibration, setLoadingCalibration] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Per-product confidence and method from live forecast
  const [productConfidence, setProductConfidence] = useState<Record<string, string>>({});
  const [productMethod, setProductMethod] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const today = getCurrentDay();

  // ── Build data from real Prophet ML forecast API ──────────────────
  const buildFromForecastData = (
    forecastData: ForecastResponse,
    products: Product[],
    suggestions: ProductSuggestion[]
  ) => {
    const trendMap: Record<string, 'up' | 'down' | 'stable'> = {
      increasing: 'up',
      decreasing: 'down',
      stable: 'stable',
    };

    // Track per-product confidence and method
    const confMap: Record<string, string> = {};
    const methodMap: Record<string, string> = {};

    // 1. ForecastItems for TomorrowsPrediction
    const mapped: ForecastItem[] = forecastData.products
      .map((pf: ProductForecast) => {
        const tomorrowForecast = pf.forecast[0];
        if (!tomorrowForecast) return null;

        const matchingProduct = products.find(
          (p: Product) => p.name.toLowerCase() === pf.product_name.toLowerCase()
        );

        const predictedQty = tomorrowForecast.predicted_qty;
        const intervalWidth = tomorrowForecast.upper - tomorrowForecast.lower;

        // Confidence: from suggestion score, or derive from forecast interval
        const matchingSuggestion = suggestions.find(
          s => (s.product_id === pf.product_id) ||
               ((s.product_name || s.name || '').toLowerCase() === pf.product_name.toLowerCase())
        );
        const confidence = matchingSuggestion?.confidence_score
          ? Math.round(matchingSuggestion.confidence_score * 100)
          : (predictedQty > 0 ? Math.round(Math.max(50, 100 - (intervalWidth / predictedQty * 100))) : 70);

        // Trend percent from interval width
        const trendPercent = predictedQty > 0
          ? Math.round((intervalWidth / predictedQty) * 50)
          : 0;

        // Store calibration metadata
        if (pf.confidence_label) confMap[pf.product_id] = pf.confidence_label;
        if (pf.forecast_method) methodMap[pf.product_id] = pf.forecast_method;

        return {
          id: pf.product_id,
          name: pf.product_name,
          quantity: Math.round(predictedQty),
          unit: pf.unit || matchingProduct?.unit || 'kg',
          price: matchingProduct?.price || 0,
          confidence,
          trend: trendMap[pf.trend] || 'stable',
          trendPercent,
        };
      })
      .filter((item): item is ForecastItem => item !== null)
      .sort((a, b) => b.quantity - a.quantity);

    setForecastItems(mapped);
    setProductConfidence(confMap);
    setProductMethod(methodMap);

    // 2. WeeklyPatternData from Prophet's weekly_pattern
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const aggregatedPattern: Record<string, number> = {};

    for (const pf of forecastData.products) {
      for (const [day, qty] of Object.entries(pf.weekly_pattern || {})) {
        aggregatedPattern[day] = (aggregatedPattern[day] || 0) + qty;
      }
    }

    const weeklyPattern: WeeklyPatternData[] = dayOrder.map((day, idx) => ({
      day: SHORT_DAYS[idx],
      quantity: Math.round(aggregatedPattern[day] || 0),
      isToday: day === today,
    }));
    setWeeklyData(weeklyPattern);

    // 3. ActualVsPredictedChart — aggregate forecast per date
    const dayMap = new Map<string, { predicted: number; lower: number; upper: number }>();
    for (const product of forecastData.products) {
      for (const fp of product.forecast) {
        const label = new Date(fp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const existing = dayMap.get(label) || { predicted: 0, lower: 0, upper: 0 };
        existing.predicted += fp.predicted_qty;
        existing.lower += fp.lower;
        existing.upper += fp.upper;
        dayMap.set(label, existing);
      }
    }

    const chartPoints: ActualVsPredictedPoint[] = [];
    dayMap.forEach((val, date) => {
      chartPoints.push({
        date,
        predicted: Math.round(val.predicted * 10) / 10,
        confidenceLow: Math.round(val.lower * 10) / 10,
        confidenceHigh: Math.round(val.upper * 10) / 10,
      });
    });
    setChartData(chartPoints);

    // 4. ProductForecastDetail for accordion (top 8)
    const details: ProductForecastDetail[] = forecastData.products.slice(0, 8).map((pf: ProductForecast) => {
      // Forecast data points from API
      const forecastDataPoints = pf.forecast.map(fp => ({
        date: new Date(fp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        quantity: fp.predicted_qty,
      }));

      // Seasonality note: derive from trend + festival/weather effects
      const matchingSuggestion = suggestions.find(
        s => (s.product_id === pf.product_id) ||
             ((s.product_name || s.name || '').toLowerCase() === pf.product_name.toLowerCase())
      );

      let seasonalityNote = 'Consistent ordering pattern';
      if (matchingSuggestion?.festival_effect?.length) {
        seasonalityNote = matchingSuggestion.festival_effect.map(e => e.reason).join('; ');
      } else if (matchingSuggestion?.weather_effect?.length) {
        seasonalityNote = matchingSuggestion.weather_effect.map(e => e.reason).join('; ');
      } else if (pf.trend === 'increasing') {
        seasonalityNote = 'Demand trending upward';
      } else if (pf.trend === 'decreasing') {
        seasonalityNote = 'Slight seasonal decline observed';
      } else if (pf.method === 'simple_average') {
        seasonalityNote = 'Limited data — using average-based forecast';
      }

      // avgLastYear: weekly_pattern average as proxy
      const weeklyValues = Object.values(pf.weekly_pattern || {});
      const avgLastYear = weeklyValues.length > 0
        ? weeklyValues.reduce((s, v) => s + v, 0) / weeklyValues.length
        : pf.forecast[0]?.predicted_qty || 0;

      return {
        productName: pf.product_name,
        unit: pf.unit,
        avgLastYear,
        seasonalityNote,
        historicalData: [],
        forecastData: forecastDataPoints,
      };
    });
    setProductDetails(details);
  };

  // ── Fallback: build from suggestion data (no Prophet) ─────────────
  const buildFromSuggestionData = async (
    suggestions: ProductSuggestion[],
    products: Product[],
    tomorrow: string
  ) => {
    // Map suggestions to ForecastItems (no random values)
    const mapped: ForecastItem[] = suggestions
      .map(suggestion => {
        const name = suggestion.product_name || suggestion.name || '';
        const matchingProduct = products.find(
          (p: Product) => p.name.toLowerCase() === name.toLowerCase()
        );
        if (!matchingProduct && !name) return null;

        const confidence = suggestion.confidence_score
          ? Math.round(suggestion.confidence_score * 100)
          : 75;

        // Use seasonal_factor from backend if available
        const seasonalFactor = suggestion.seasonal_factor || 1.0;
        const trend: 'up' | 'down' | 'stable' =
          seasonalFactor > 1.1 ? 'up' : seasonalFactor < 0.9 ? 'down' : 'stable';
        const trendPercent = Math.round(Math.abs(seasonalFactor - 1.0) * 100);

        return {
          id: matchingProduct?.id || suggestion.product_id || name,
          name,
          quantity: Math.round(suggestion.suggested_quantity),
          unit: suggestion.unit || suggestion.product_unit || matchingProduct?.unit || 'kg',
          price: matchingProduct?.price || 0,
          confidence,
          trend,
          trendPercent,
        };
      })
      .filter((item): item is ForecastItem => item !== null);

    setForecastItems(mapped);

    // Weekly pattern from 7-day suggestions
    try {
      const [allDaySuggestions, weeklyConsumption] = await Promise.all([
        Promise.all(DAYS.map(day => analyticsApi.getProductSuggestionsForDay(day))),
        analyticsApi.getWeeklyConsumptionSummary(),
      ]);

      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const weeklyPattern: WeeklyPatternData[] = dayOrder.map((day, idx) => {
        const consumptionEntry = weeklyConsumption.find((e: any) => e.name === day);
        const dayResult = allDaySuggestions[DAYS.indexOf(day)];
        const daySuggestions = dayResult?.suggestions || [];
        const totalQty = daySuggestions.reduce((s: number, p: ProductSuggestion) => s + (p.suggested_quantity || 0), 0);
        return {
          day: SHORT_DAYS[idx],
          quantity: totalQty || (consumptionEntry?.value || 0),
          isToday: day === today,
        };
      });
      setWeeklyData(weeklyPattern);
    } catch (err) {
      console.warn('Failed to fetch weekly pattern:', err);
    }

    // No chart data in fallback mode (no fake history)
    setChartData([]);

    // Product details: basic info, no fake forecast lines
    const details: ProductForecastDetail[] = mapped.slice(0, 8).map(item => {
      const matchingSuggestion = suggestions.find(
        s => (s.product_name || s.name || '').toLowerCase() === item.name.toLowerCase()
      );
      let seasonalityNote = 'Based on ordering patterns';
      if (matchingSuggestion?.festival_effect?.length) {
        seasonalityNote = matchingSuggestion.festival_effect.map(e => e.reason).join('; ');
      } else if (matchingSuggestion?.weather_effect?.length) {
        seasonalityNote = matchingSuggestion.weather_effect.map(e => e.reason).join('; ');
      }

      return {
        productName: item.name,
        unit: item.unit,
        avgLastYear: item.quantity,
        seasonalityNote,
        historicalData: [],
        forecastData: [],
      };
    });
    setProductDetails(details);
  };

  // ── Main data fetch ───────────────────────────────────────────────
  const fetchLiveForecast = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCalibrationData(null);

      const tomorrow = getTomorrowDay();

      const [forecastResult, accuracyResult, suggestionsResult, productsResult] =
        await Promise.allSettled([
          analyticsApi.getDemandForecast(7),
          analyticsApi.getForecastAccuracy(),
          analyticsApi.getProductSuggestionsWithContext(tomorrow),
          productApi.getAllProducts(),
        ]);

      const forecastData = forecastResult.status === 'fulfilled' ? forecastResult.value : null;
      const accuracyData = accuracyResult.status === 'fulfilled' ? accuracyResult.value : null;
      const suggestionsWithCtx = suggestionsResult.status === 'fulfilled'
        ? suggestionsResult.value
        : { suggestions: [], context: null };
      const products = productsResult.status === 'fulfilled' ? productsResult.value : [];

      if (suggestionsWithCtx.context) {
        setContextData(suggestionsWithCtx.context);
      }

      if (accuracyData?.overall_mape != null) {
        const accuracy = Math.round(100 - accuracyData.overall_mape);
        setModelAccuracy(Math.max(0, Math.min(100, accuracy)));
        setAccuracyRating(accuracyData.overall_rating);
      }

      if (forecastData && forecastData.products && forecastData.products.length > 0) {
        setForecastSource('prophet');
        buildFromForecastData(forecastData, products, suggestionsWithCtx.suggestions);
      } else {
        setForecastSource('suggestions');
        await buildFromSuggestionData(
          suggestionsWithCtx.suggestions, products, tomorrow
        );
      }
    } catch (err) {
      console.error('Error fetching forecast data:', err);
      setError('Failed to load AI demand forecast. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch calibration data for a past date ────────────────────────
  const fetchCalibrationForDate = useCallback(async (date: Date) => {
    try {
      setLoadingCalibration(true);
      setError(null);
      const dateStr = format(date, 'yyyy-MM-dd');
      const data = await analyticsApi.getCalibrationForDate(dateStr);
      setCalibrationData(data);
    } catch (err) {
      console.error('Error fetching calibration data:', err);
      setError('Failed to load historical forecast data for this date.');
    } finally {
      setLoadingCalibration(false);
    }
  }, []);

  // ── Date change handler ───────────────────────────────────────────
  const handleDateChange = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    if (!date || isLiveDate(date)) {
      setCalibrationData(null);
      fetchLiveForecast();
    } else {
      fetchCalibrationForDate(date);
    }
  }, [fetchLiveForecast, fetchCalibrationForDate]);

  // ── Fetch model health ────────────────────────────────────────────
  const fetchHealthStatus = useCallback(async () => {
    if (calibrationStatus) return; // already loaded
    try {
      setLoadingHealth(true);
      const data = await analyticsApi.getCalibrationStatus();
      setCalibrationStatus(data);
    } catch (err) {
      console.error('Error fetching calibration status:', err);
    } finally {
      setLoadingHealth(false);
    }
  }, [calibrationStatus]);

  const handleHealthToggle = (open: boolean) => {
    setHealthOpen(open);
    if (open) fetchHealthStatus();
  };

  // Initial load
  useEffect(() => {
    fetchLiveForecast();
  }, [fetchLiveForecast]);

  // ── Accuracy badge styling ────────────────────────────────────────
  const getAccuracyBadgeClass = () => {
    if (modelAccuracy === null) return 'bg-gray-50 text-gray-600 border-gray-200';
    if (modelAccuracy >= 85) return 'bg-green-50 text-green-700 border-green-200';
    if (modelAccuracy >= 75) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getAccuracyLabel = () => {
    if (modelAccuracy !== null) {
      const ratingLabel = accuracyRating ? ` · ${accuracyRating}` : '';
      return `${modelAccuracy}% accurate${ratingLabel}`;
    }
    if (forecastSource === 'suggestions') return 'Pattern-based · 2 yrs data';
    return 'Loading...';
  };

  // ── Weather emoji helper ──────────────────────────────────────────
  const getWeatherEmoji = () => {
    if (!contextData) return '';
    if (contextData.rainfall_mm > 50) return '\u{1F327}\u{FE0F}';
    if (contextData.rainfall_mm > 0) return '\u{1F326}\u{FE0F}';
    if (contextData.temperature && contextData.temperature > 38) return '\u{1F321}\u{FE0F}';
    return '\u{2600}\u{FE0F}';
  };

  // ── Whether we're showing a past date ─────────────────────────────
  const showingPastDate = selectedDate && !isLiveDate(selectedDate);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-playfair text-2xl font-semibold text-foreground">AI Demand Forecast</h1>
            <p className="text-sm text-muted-foreground font-rubik mt-1">
              {showingPastDate
                ? `Historical: ${format(selectedDate!, 'EEEE, d MMMM yyyy')}`
                : formatDateRange()
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase border ${getAccuracyBadgeClass()}`}
            >
              <BrainCircuit size={12} className="mr-1.5" />
              {getAccuracyLabel()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/smart-order')}
              className="rounded-md font-medium"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Date Picker */}
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-full sm:w-64">
              <DatePicker
                date={selectedDate}
                onDateChange={handleDateChange}
                placeholder="Today / Tomorrow (live)"
                maxDate={new Date()}
                className="w-full"
              />
            </div>
            {showingPastDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateChange(undefined)}
                className="text-sm text-muted-foreground"
              >
                Clear date (show live forecast)
              </Button>
            )}
          </div>
        </section>

        {/* Calendar & Weather Context */}
        {!showingPastDate && contextData && (
          <CalendarContextCard context={contextData} />
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Past Date: Calibration Table (Predicted vs Actual) ──── */}
        {showingPastDate && (
          <section className="mb-8">
            <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-[#4A6FA5] to-[#4A6FA5]/30" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-playfair text-lg font-medium text-foreground">
                      Predicted vs Actual
                    </h2>
                    <p className="text-sm text-muted-foreground font-rubik mt-1">
                      {format(selectedDate!, 'EEEE, d MMMM yyyy')}
                    </p>
                  </div>
                  {calibrationData?.products && (
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold uppercase">
                      {calibrationData.products.length} products
                    </Badge>
                  )}
                </div>

                {loadingCalibration ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                    <span className="text-muted-foreground font-rubik">Loading historical data...</span>
                  </div>
                ) : calibrationData?.products && calibrationData.products.length > 0 ? (
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100">
                          <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
                          <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground text-right">Predicted</TableHead>
                          <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground text-right">Actual</TableHead>
                          <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground text-right">Error %</TableHead>
                          <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Confidence</TableHead>
                          <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calibrationData.products.map((item: CalibrationProduct) => (
                          <TableRow
                            key={item.product_id}
                            className={`border-gray-50 hover:bg-gray-50/50 transition-colors ${getErrorBg(item.pct_error)}`}
                          >
                            <TableCell>
                              <span className="font-rubik font-medium text-foreground">{item.product_name}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-rubik font-semibold text-foreground">
                                {item.predicted_qty.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-rubik font-semibold text-foreground">
                                {item.actual_qty.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-rubik font-semibold ${getErrorColor(item.pct_error)}`}>
                                {item.pct_error !== null ? `${item.pct_error.toFixed(1)}%` : '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <ConfidenceLabelBadge label={item.confidence_label} />
                            </TableCell>
                            <TableCell>
                              <ForecastMethodBadge method={item.model_version} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-10 text-muted-foreground font-rubik">
                    No forecast data available for this date.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Live Forecast Sections (Today/Tomorrow) ──────────────── */}
        {!showingPastDate && (
          <>
            {/* Festival / Weather Context Banner */}
            {!loading && contextData && (contextData.festivals?.length > 0 || contextData.weather_condition) && (
              <section className="mb-6">
                <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {contextData.festivals && contextData.festivals.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{'\u{1F389}'}</span>
                        <div>
                          <p className="text-sm font-medium text-amber-900">
                            {contextData.festivals.join(', ')}
                          </p>
                          {contextData.festival && contextData.festival !== 'Normal day — no festivals or observances' && (
                            <p className="text-xs text-amber-700">{contextData.festival}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {contextData.is_purattasi && (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                        Purattasi (Non-veg abstinence)
                      </Badge>
                    )}
                    {contextData.is_muhurtham && (
                      <Badge className="bg-pink-100 text-pink-800 border-pink-300 text-xs">
                        Muhurtham (Wedding day)
                      </Badge>
                    )}
                    {contextData.is_ramadan && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                        Ramadan
                      </Badge>
                    )}

                    {contextData.weather_condition && (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-lg">{getWeatherEmoji()}</span>
                        <div className="text-right">
                          <p className="text-sm font-medium text-amber-900">
                            {contextData.weather_condition}
                            {contextData.temperature != null && ` · ${contextData.temperature}°C`}
                          </p>
                          {contextData.weather && contextData.weather !== 'Normal weather — no demand impact expected' && (
                            <p className="text-xs text-amber-700">{contextData.weather}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Fallback source indicator */}
            {forecastSource === 'suggestions' && !loading && !error && forecastItems.length > 0 && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <Info size={16} className="text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  Showing pattern-based predictions. ML forecasting will provide more accurate results when sufficient data is processed.
                </AlertDescription>
              </Alert>
            )}

            {/* Section 1 – Tomorrow's Predicted Order (with confidence + method badges) */}
            <section className="mb-8">
              <TomorrowsPrediction
                items={forecastItems}
                tomorrowDate={formatTomorrowDate()}
                loading={loading}
              />
              {/* Confidence + method labels under the table */}
              {!loading && forecastItems.length > 0 && Object.keys(productConfidence).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {forecastItems.slice(0, 10).map(item => {
                    const conf = productConfidence[item.id];
                    const meth = productMethod[item.id];
                    if (!conf && !meth) return null;
                    return (
                      <div key={item.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-medium truncate max-w-[120px]">{item.name}:</span>
                        {conf && <ConfidenceLabelBadge label={conf} />}
                        {meth && <ForecastMethodBadge method={meth} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 2 & 3 – Charts side by side on desktop */}
            {!loading && !error && (chartData.length > 0 || weeklyData.length > 0) && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {chartData.length > 0 && <ActualVsPredictedChart data={chartData} />}
                {weeklyData.length > 0 && <WeeklyPatternChart data={weeklyData} />}
              </section>
            )}

            {/* Section 4 – Product-Level Forecast Detail */}
            {!loading && !error && productDetails.length > 0 && (
              <section className="mb-8">
                <ProductForecastAccordion products={productDetails} />
              </section>
            )}
          </>
        )}

        {/* ── Model Health (Collapsible) ──────────────────────────── */}
        {!loading && !error && (
          <section className="mb-8">
            <Collapsible open={healthOpen} onOpenChange={handleHealthToggle}>
              <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Activity size={18} className="text-muted-foreground" />
                      <span className="font-playfair text-base font-medium text-foreground">Model Health</span>
                      {calibrationStatus?.summary && (
                        <span className="text-xs text-muted-foreground font-rubik ml-2">
                          {calibrationStatus.summary.high_confidence} high / {calibrationStatus.summary.medium_confidence} med / {calibrationStatus.summary.low_confidence} low
                          {calibrationStatus.summary.avg_mape != null && ` · ${calibrationStatus.summary.avg_mape.toFixed(1)}% MAPE`}
                        </span>
                      )}
                    </div>
                    {healthOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    {loadingHealth ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span className="text-sm text-muted-foreground">Loading model health...</span>
                      </div>
                    ) : calibrationStatus?.products && calibrationStatus.products.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-100">
                              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
                              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground text-right">MAPE %</TableHead>
                              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Confidence</TableHead>
                              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground text-right">Bias</TableHead>
                              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground text-right">Signal</TableHead>
                              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground text-right">Samples</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {calibrationStatus.products.map((p: CalibrationStatusProduct) => {
                              const drifting = Math.abs(p.tracking_signal) > 4.0;
                              return (
                                <TableRow key={p.product_id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      {drifting && (
                                        <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                                      )}
                                      <span className="font-rubik font-medium text-foreground">{p.product_name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`font-rubik font-semibold ${
                                      p.rolling_mape === null ? 'text-gray-400' :
                                      p.rolling_mape < 15 ? 'text-green-600' :
                                      p.rolling_mape < 25 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                      {p.rolling_mape !== null ? `${p.rolling_mape.toFixed(1)}%` : '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <ConfidenceLabelBadge label={p.confidence_label} />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="font-rubik text-sm text-muted-foreground">
                                      {p.rolling_bias > 0 ? '+' : ''}{p.rolling_bias.toFixed(1)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`font-rubik text-sm ${drifting ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                                      {p.tracking_signal.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="font-rubik text-sm text-muted-foreground">{p.sample_size}</span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        {calibrationStatus.summary.drift_flagged > 0 && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
                            <AlertTriangle size={12} />
                            <span>{calibrationStatus.summary.drift_flagged} product(s) flagged for model drift (|tracking signal| &gt; 4.0)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-center py-6 text-muted-foreground font-rubik text-sm">
                        No calibration data available yet. Run walk-forward validation to populate.
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </section>
        )}

        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span className="text-muted-foreground font-rubik">Loading forecast data...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIOrderForecast;
