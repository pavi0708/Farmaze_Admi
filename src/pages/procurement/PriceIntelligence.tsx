import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IndianRupee, TrendingDown, TrendingUp, Package, AlertTriangle,
  Search, ChevronLeft, ChevronRight, CalendarIcon, Download,
  Sparkles, Loader2, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/context/AuthContext';
import BranchFilterSelector from '@/components/analytics/BranchFilterSelector';
import { agentChat } from '@/api/agentApi';
import MarkdownContent from '@/components/chat/MarkdownContent';
import {
  getMarketComparison,
  getPriceAlerts,
  type MarketComparisonData,
  type MarketComparisonParams,
  type PriceRow,
} from '@/api/procurementApi';

const PAGE_SIZE = 20;
const formatINR = (v: number) => `₹${Math.abs(v).toLocaleString('en-IN')}`;

// ── AI Summary ──────────────────────────────────────────────────────────

const AISummary: React.FC<{ data: MarketComparisonData; dateLabel: string; clientId: string; clientName: string; branchName: string }> = ({ data, dateLabel, clientId, clientName, branchName }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [failed, setFailed] = useState(false);

  const generate = useCallback(async () => {
    if (data.priceRows.length === 0) return;
    setLoading(true);
    setFailed(false);
    try {
      const top10 = [...data.priceRows]
        .sort((a, b) => b.farmazePrice - a.farmazePrice)
        .slice(0, 10)
        .map(r => `${r.productName} (${r.unit}): ₹${r.farmazePrice}`)
        .join(', ');

      const branchCtx = branchName ? ` for branch "${branchName}"` : '';
      const prompt = `You are Farmaze's pricing analyst. Analyze this spend data for ${dateLabel}${branchCtx} and give 2-3 concise actionable insights in 3-4 lines. Focus on: highest spend items, any unusually high prices, and suggestions.

Total spend: ₹${data.totalOrderValue.toLocaleString('en-IN')} across ${data.skuCount} SKUs.
Top SKU: ${data.topSku?.name || 'N/A'} (₹${data.topSku?.spend?.toLocaleString('en-IN') || 0}).
Top 10 by price: ${top10}

Keep it brief, use Indian Rupee format (₹), be specific with numbers.`;

      const resp = await agentChat({
        message: prompt,
        client_id: clientId,
        client_name: clientName,
        channel: 'dashboard',
      });
      setSummary(resp.data.response);
      setGenerated(true);
    } catch (err) {
      console.error('AI Price Insights failed:', err);
      setSummary('Unable to generate insights right now.');
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [data, dateLabel, branchName, clientId, clientName]);

  // Auto-generate when data is ready
  useEffect(() => {
    if (data.priceRows.length > 0 && !generated && !loading && !failed) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.priceRows.length, dateLabel, branchName]);

  // Reset when date/branch changes so we regenerate
  useEffect(() => {
    setGenerated(false);
    setSummary('');
    setFailed(false);
  }, [dateLabel, branchName]);

  if (data.priceRows.length === 0) return null;

  return (
    <Card className="border-indigo-100 bg-indigo-50/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-indigo-900 mb-1">AI Price Insights</p>
              {loading ? (
                <p className="text-sm text-indigo-600 inline-flex items-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Analyzing your spend…
                </p>
              ) : generated && summary ? (
                <div className="text-sm text-indigo-800 prose prose-sm max-w-none">
                  <MarkdownContent content={summary} />
                </div>
              ) : (
                <p className="text-sm text-indigo-600">
                  {failed ? 'Unable to generate insights right now.' : 'Preparing insights…'}
                </p>
              )}
            </div>
          </div>
          {failed && !loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={generate}
              className="flex-shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ── Summary Cards ───────────────────────────────────────────────────────

interface SummaryCardsProps {
  totalOrderValue: number;
  skuCount: number;
  totalSavings: number;
  savingsPercent: number;
  topSku: { name: string; spend: number } | null;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalOrderValue, skuCount, totalSavings, savingsPercent, topSku,
}) => {
  const cards = [
    {
      label: 'TOTAL SPEND', value: formatINR(totalOrderValue), subtitle: 'Order value',
      badge: `${skuCount} SKUs`, icon: IndianRupee,
      iconBg: 'bg-orange-50', iconColor: 'text-farmaze-orange',
      badgeBg: 'bg-orange-50 text-farmaze-orange border-orange-200', borderColor: 'border-orange-200',
    },
    {
      label: 'SAVINGS', value: formatINR(totalSavings), subtitle: 'vs average vendor price',
      badge: `${savingsPercent}% cheaper`, icon: TrendingDown,
      iconBg: 'bg-green-50', iconColor: 'text-green-600',
      badgeBg: 'bg-green-50 text-green-700 border-green-200', borderColor: 'border-green-200',
    },
    {
      label: 'TOP SKU', value: topSku?.name || '--', subtitle: 'Highest spend this period',
      badge: topSku ? `${formatINR(topSku.spend)} total` : '--', icon: Package,
      iconBg: 'bg-green-50', iconColor: 'text-green-600',
      badgeBg: 'bg-red-50 text-red-600 border-red-200', borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className={`border ${card.borderColor}`}>
          <CardContent className="p-6">
            <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center mb-4`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <p className="text-xs uppercase text-muted-foreground font-medium tracking-wider mb-1">{card.label}</p>
            <p className={`font-bold ${card.label === 'TOP SKU' ? 'text-lg' : 'text-3xl'}`}>{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.subtitle}</p>
            <Badge variant="outline" className={`mt-2 text-xs ${card.badgeBg}`}>{card.badge}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ── Price Comparison Table ───────────────────────────────────────────────

type SortKey = 'name' | 'price' | 'savings';
type SortDir = 'asc' | 'desc';

interface PriceTableProps {
  rows: PriceRow[];
  vendorColumns: string[];
  page: number;
  onPageChange: (page: number) => void;
  prevPriceMap: Record<string, number>;
}

const COMPETITOR_SET = new Set(['HyperPure', 'BigBasket B2B', 'Mandi']);

const PriceTable: React.FC<PriceTableProps> = ({ rows, vendorColumns, page, onPageChange, prevPriceMap }) => {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const SortIcon: React.FC<{ column: SortKey }> = ({ column }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.productName.localeCompare(b.productName);
      else if (sortKey === 'price') cmp = a.farmazePrice - b.farmazePrice;
      else if (sortKey === 'savings') cmp = (a.savingsPercent ?? -999) - (b.savingsPercent ?? -999);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-medium text-foreground mb-1">No order data found</h3>
        <p className="text-sm text-muted-foreground">Try selecting a different date.</p>
      </div>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-gray-700 text-sm">
            <tr>
              <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <span className="inline-flex items-center">SKU name <SortIcon column="name" /></span>
              </th>
              <th className="px-4 py-3 text-left font-medium">Unit</th>
              <th className="px-4 py-3 text-left font-medium">Qty</th>
              <th className="px-4 py-3 text-left font-medium bg-green-50 text-green-700 cursor-pointer select-none" onClick={() => toggleSort('price')}>
                <span className="inline-flex items-center">Farmaze price <SortIcon column="price" /></span>
              </th>
              {vendorColumns.map(col => (
                <th key={col} className="px-4 py-3 text-left font-medium">{col}</th>
              ))}
              <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort('savings')}>
                <span className="inline-flex items-center">Savings <SortIcon column="savings" /></span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map(row => {
              const knownPrices = Object.values(row.vendorPrices).filter((p): p is number => p !== null);
              const minVendor = knownPrices.length > 0 ? Math.min(...knownPrices) : null;
              const prevPrice = prevPriceMap[row.productId];
              const priceDiff = prevPrice ? row.farmazePrice - prevPrice : 0;
              const pricePct = prevPrice ? Math.round((priceDiff / prevPrice) * 100) : 0;

              return (
                <tr key={row.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-orange-50 rounded flex items-center justify-center">
                        <Package className="w-3.5 h-3.5 text-farmaze-orange" />
                      </div>
                      <span className="font-medium text-foreground">{row.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{row.unit}</td>
                  <td className="px-4 py-4 text-muted-foreground">{row.quantity}</td>
                  <td className="px-4 py-4 bg-green-50/50">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-green-700">{formatINR(row.farmazePrice)}</span>
                      {prevPrice !== undefined && pricePct !== 0 && (
                        <span className={`inline-flex items-center text-xs ${pricePct > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {pricePct > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                          {Math.abs(pricePct)}%
                        </span>
                      )}
                    </div>
                  </td>
                  {vendorColumns.map(col => {
                    const price = row.vendorPrices[col];
                    const isCompetitor = COMPETITOR_SET.has(col);
                    if (price === null) {
                      return (
                        <td key={col} className="px-4 py-4 text-muted-foreground">
                          {isCompetitor ? <Badge variant="outline" className="text-xs text-muted-foreground">--</Badge> : '--'}
                        </td>
                      );
                    }
                    const isCheapest = price === minVendor;
                    return (
                      <td key={col} className="px-4 py-4">
                        <span className={isCheapest ? 'text-green-700 font-medium' : ''}>{formatINR(price)}</span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-4">
                    {row.savingsPercent !== null ? (
                      <Badge variant="outline" className={row.savingsPercent >= 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}>
                        {row.savingsPercent}%
                      </Badge>
                    ) : <span className="text-muted-foreground">--</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs text-muted-foreground px-2">{page}/{totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

// ── Price Alerts ─────────────────────────────────────────────────────────

interface PriceAlert {
  product_id: string;
  product_name: string;
  current_price: number;
  previous_price: number;
  change_pct: number;
}

const PriceAlerts: React.FC<{ alerts: PriceAlert[] }> = ({ alerts }) => {
  if (alerts.length === 0) return null;
  return (
    <div>
      <h2 className="text-lg font-medium font-playfair text-foreground mb-3">Price Alerts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map(alert => (
          <Card key={alert.product_id} className="border-red-200">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-sm">{alert.product_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatINR(alert.previous_price)} → {formatINR(alert.current_price)}
                </p>
                <Badge variant="outline" className="mt-1 text-xs bg-red-50 text-red-600 border-red-200">
                  +{Math.round(alert.change_pct)}% spike
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ── CSV Download ─────────────────────────────────────────────────────────

function downloadCSV(rows: PriceRow[], vendorColumns: string[], dateLabel: string) {
  const headers = ['SKU Name', 'Unit', 'Qty', 'Farmaze Price', ...vendorColumns, 'Savings %'];
  const csvRows = [headers.join(',')];
  for (const row of rows) {
    const values = [
      `"${row.productName}"`,
      row.unit,
      row.quantity,
      row.farmazePrice,
      ...vendorColumns.map(col => row.vendorPrices[col] ?? ''),
      row.savingsPercent ?? '',
    ];
    csvRows.push(values.join(','));
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `farmaze-prices-${dateLabel.replace(/[,\s]+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ────────────────────────────────────────────────────────────

const PriceIntelligence: React.FC = () => {
  const { user, selectedBranch } = useAuth();
  const clientId = user?.client_id || user?.id || '';
  const branchId = selectedBranch?.id ?? undefined;
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MarketComparisonData>({
    priceRows: [], vendorColumns: [], totalOrderValue: 0,
    totalSavings: 0, savingsPercent: 0, skuCount: 0, topSku: null,
  });
  const [prevPriceMap, setPrevPriceMap] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  const formatDateParam = (d: Date) => d.toISOString().split('T')[0];

  useEffect(() => {
    if (!clientId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const dateStr = formatDateParam(selectedDate);

        // Fetch previous day's data for trend indicators
        const prevDate = new Date(selectedDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = formatDateParam(prevDate);

        const params: MarketComparisonParams = {
          timePeriod: 'custom', startDate: dateStr, endDate: dateStr, branchId,
        };
        const prevParams: MarketComparisonParams = {
          timePeriod: 'custom', startDate: prevDateStr, endDate: prevDateStr, branchId,
        };

        const [marketData, prevData, alertsResp] = await Promise.all([
          getMarketComparison(clientId, params),
          getMarketComparison(clientId, prevParams).catch(() => null),
          getPriceAlerts(clientId).catch(() => null),
        ]);

        setData(marketData);

        // Build prev price map for trend arrows
        const pm: Record<string, number> = {};
        if (prevData?.priceRows) {
          for (const row of prevData.priceRows) {
            if (row.farmazePrice > 0) pm[row.productId] = row.farmazePrice;
          }
        }
        setPrevPriceMap(pm);

        if (alertsResp?.data?.alerts) {
          setAlerts(alertsResp.data.alerts);
        }
      } catch (error) {
        console.error('Error loading price intelligence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
    setPage(1);
  }, [clientId, selectedDate, branchId]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    data.priceRows.forEach(r => { if (r.category) cats.add(r.category); });
    return Array.from(cats).sort();
  }, [data.priceRows]);

  // Filter rows by search + category
  const filteredRows = useMemo(() => {
    let rows = data.priceRows;
    if (categoryFilter !== 'all') {
      rows = rows.filter(r => r.category === categoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r => r.productName.toLowerCase().includes(q));
    }
    return rows;
  }, [data.priceRows, searchQuery, categoryFilter]);

  useEffect(() => { setPage(1); }, [searchQuery, categoryFilter]);

  const dateLabel = selectedDate.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farmaze-orange" />
          <span className="ml-3 text-muted-foreground">Loading price intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-playfair text-foreground">Price Intelligence</h1>
          <p className="text-sm text-muted-foreground font-rubik mt-1">
            Compare Farmaze selling prices against suppliers and market competitors
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BranchFilterSelector />
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-rubik text-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => { if (date) { setSelectedDate(date); setCalendarOpen(false); } }}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalOrderValue={data.totalOrderValue}
        skuCount={data.skuCount}
        totalSavings={data.totalSavings}
        savingsPercent={data.savingsPercent}
        topSku={data.topSku}
      />

      {/* AI Summary */}
      <AISummary data={data} dateLabel={dateLabel} clientId={clientId} clientName={user?.name || ''} branchName={selectedBranch?.name || ''} />

      {/* Price Comparison Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xs uppercase text-muted-foreground font-medium tracking-wider">
            Price Comparison &middot; {categoryFilter === 'all' ? 'All SKUs' : categoryFilter} &middot; {dateLabel}
          </h2>
          <div className="flex items-center gap-2">
            {categories.length > 1 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] text-sm h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => downloadCSV(filteredRows, data.vendorColumns, dateLabel)}
              disabled={filteredRows.length === 0}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              CSV
            </Button>
          </div>
        </div>
        <PriceTable
          rows={filteredRows}
          vendorColumns={data.vendorColumns}
          page={page}
          onPageChange={setPage}
          prevPriceMap={prevPriceMap}
        />
      </div>

      {/* Price Alerts */}
      <PriceAlerts alerts={alerts} />
    </div>
  );
};

export default PriceIntelligence;
