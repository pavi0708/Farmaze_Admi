import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getInvoices, Invoice as ApiInvoice } from "@/api/invoiceApi";
import { downloadInvoiceFor } from "@/utils/downloadInvoice";
import { parseCustomDate, formatDate, formatTime } from '@/utils/dateUtils';
import { 
  Download,
  FileText, 
  ArrowUpDown, 
  ChevronRight, 
  ChevronLeft, 
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Clock,
  Calendar
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import FadeInSection from "@/components/ui/FadeInSection";
import Pagination from "@/components/products/Pagination";
import { useAuth } from "@/context/AuthContext";

// Remove this interface as we're using InvoiceDisplay throughout the component
// interface Invoice {
//   id: string;
//   date: string;
//   dueDate: string;
//   amount: number;
//   status: "Paid" | "Pending" | "Overdue";
//   orderIds: string[];
// }

// Define our local invoice interface
interface InvoiceDisplay {
  id: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue" | "Approved";
  orderIds: string[];
  orderId: string; // The order ID for API calls
  invoiceNumber: string; // The invoice number for display
  branchName?: string; // Branch name for multi-branch clients
}

const Invoices = () => {
  const navigate = useNavigate();
  const { branches } = useAuth();
  const showBranchColumn = branches && branches.length > 1;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('all');
  const [invoices, setInvoices] = useState<InvoiceDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [downloadingInvoice, setDownloadingInvoice] = useState('');
  const [dateFilter, setDateFilter] = useState('Last 7 days');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: addDays(new Date(), -7), to: new Date() });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Selection state
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Function to get date range based on filter
  const getDateRange = (filter: string) => {
    if (filter === 'Custom' && dateRange.from && dateRange.to) {
      // Format dates in YYYY-MM-DD format without timezone conversion
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        startDate: formatDate(dateRange.from),
        endDate: formatDate(dateRange.to)
      };
    }
    const endDate = new Date();
    const startDate = new Date();

    switch (filter) {
      case 'Last 7 days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'Last 30 days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'Last 90 days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'Last year':
        // Set to previous year's date range
        startDate.setFullYear(endDate.getFullYear() - 1);
        startDate.setMonth(0); // January
        startDate.setDate(1); // First day
        endDate.setFullYear(endDate.getFullYear() - 1);
        endDate.setMonth(11); // December
        endDate.setDate(31); // Last day
        break;
      case 'All time':
        return { startDate: undefined, endDate: undefined };
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const { startDate, endDate } = getDateRange(dateFilter);
        const response = await getInvoices(startDate, endDate);
        
        if (!response || !response.invoices) {
          setInvoices([]);
          setTotalAmount(0);
          setPaidAmount(0);
          setPendingAmount(0);
          return;
        }
        
        const transformedInvoices: InvoiceDisplay[] = response.invoices.map(invoice => {
          let formattedDate = 'N/A';
          let dueDate = new Date();
          let formattedDueDate = 'N/A';
          
          try {
            if (invoice.generated_at) {
              const generatedDate = parseCustomDate(invoice.generated_at);
              
              if (generatedDate) {
                formattedDate = formatDate(generatedDate);
                dueDate = new Date(generatedDate);
                dueDate.setDate(dueDate.getDate() + 15);
                formattedDueDate = formatDate(dueDate);
              }
            }
          } catch (error) {
            console.error('Error formatting invoice dates:', error);
            dueDate = new Date();
          }
          
          let displayStatus: "Paid" | "Pending" | "Overdue" | "Approved";
          switch (invoice.status.toLowerCase()) {
            case 'paid':
              displayStatus = 'Paid';
              break;
            case 'pending':
              displayStatus = 'Pending';
              break;
            case 'approved':
              displayStatus = 'Approved';
              break;
            default:
              displayStatus = dueDate < new Date() ? 'Overdue' : 'Pending';
          }
          
          return {
            id: invoice.id,
            date: formattedDate,
            dueDate: formattedDueDate,
            amount: invoice.total_amount,
            status: displayStatus,
            orderIds: [invoice.order_number],
            orderId: invoice.order_id,
            invoiceNumber: invoice.invoice_number,
            branchName: invoice.branch_name || ''
          };
        });
        
        setInvoices(transformedInvoices);
        setTotalAmount(response.total);
        setPaidAmount(response.paid);
        setPendingAmount(response.pending);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoices();
  }, [dateFilter, dateRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Check size={14} />;
      case 'Pending':
        return <Clock size={14} />;
      case 'Overdue':
        return <X size={14} />;
      case 'Approved':
        return <Check size={14} className="text-purple-800" />;
      default:
        return <FileText size={14} />;
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortInvoices = (invoicesToSort: InvoiceDisplay[]) => {
    return [...invoicesToSort].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'date':
          // Safely parse dates for comparison
          try {
            const dateA = a.date !== 'N/A' ? new Date(a.date).getTime() : 0;
            const dateB = b.date !== 'N/A' ? new Date(b.date).getTime() : 0;
            comparison = dateA - dateB;
          } catch (error) {
            comparison = 0;
          }
          break;
        case 'dueDate':
          // Safely parse dates for comparison
          try {
            const dueDateA = a.dueDate !== 'N/A' ? new Date(a.dueDate).getTime() : 0;
            const dueDateB = b.dueDate !== 'N/A' ? new Date(b.dueDate).getTime() : 0;
            comparison = dueDateA - dueDateB;
          } catch (error) {
            comparison = 0;
          }
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const filterInvoicesByStatus = (invoicesToFilter: InvoiceDisplay[]) => {
    if (activeTab === 'all') return invoicesToFilter;
    
    return invoicesToFilter.filter(invoice => {
      const status = invoice.status;
      switch (activeTab) {
        case 'paid':
          return status === 'Paid';
        case 'pending':
          return status === 'Pending';
        case 'overdue':
          return status === 'Overdue';
        case 'approved':
          return status === 'Approved';
        default:
          return true;
      }
    });
  };

  // Handle invoice download.
  // The download button is only rendered when invoice.status === 'approved'.
  // By the time admin approves an invoice (api/invoice.go ApproveInvoice), the underlying
  // order is already in invoice_approved status, so the order-status guard on the backend
  // will always pass for approved invoices.
  const handleDownloadInvoice = async (invoice: InvoiceDisplay) => {
    try {
      setDownloadingInvoice(invoice.id);
      await downloadInvoiceFor(invoice.orderId, invoice.invoiceNumber);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    } finally {
      setTimeout(() => setDownloadingInvoice(''), 1000);
    }
  };

  // Handle checkbox selection
  const handleSelectInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedInvoices(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(paginatedInvoices.map(invoice => invoice.id));
      setSelectedInvoices(allIds);
      setSelectAll(true);
    }
  };

  // Handle bulk download
  const handleBulkDownload = async () => {
    const selectedInvoicesList = paginatedInvoices.filter(invoice => selectedInvoices.has(invoice.id));
    
    for (const invoice of selectedInvoicesList) {
      try {
        await downloadInvoiceFor(invoice.orderId, invoice.invoiceNumber);
      } catch (error) {
        console.error(`Error downloading invoice ${invoice.invoiceNumber}:`, error);
      }
    }
  };

  const filteredInvoices = invoices
    .filter(invoice => 
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.orderIds.some(id => id.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(invoice => filterInvoicesByStatus([invoice]).length > 0);

  const sortedInvoices = useMemo(() => {
    return sortInvoices(filterInvoicesByStatus(filteredInvoices));
  }, [filteredInvoices, sortColumn, sortDirection]);

  // Calculate paginated invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedInvoices.slice(startIndex, endIndex);
  }, [sortedInvoices, currentPage, itemsPerPage]);

  return (
    <div className="frame-container mx-auto px-4 py-8">
      <FadeInSection>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-farmaze-brown">Invoices</h1>
          <p className="text-gray-600">View and manage your invoice history</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-72"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              className="h-10 w-10"
            >
              <Filter size={18} />
            </Button>
            <div className="flex items-center gap-2">
              <select 
                className="h-10 px-4 rounded-md border border-input bg-background text-sm" 
                value={dateFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setDateFilter(value);
                  if (value === 'Custom') {
                    // Set date range to current month when selecting Custom
                    const now = new Date();
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    setDateRange({ from: firstDayOfMonth, to: now });
                    setShowDatePicker(true);
                  } else {
                    setShowDatePicker(false);
                  }
                }}
              >
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="Last 90 days">Last 90 days</option>
                <option value="Last year">Last year</option>
                <option value="All time">All time</option>
                <option value="Custom">Custom Range</option>
              </select>
              {showDatePicker && (
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={(newDate) => {
                    setDateRange(newDate);
                    // Keep the filter as Custom when date changes
                    setDateFilter('Custom');
                  }}
                />
              )}
            </div>
          </div>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-5 w-[600px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Bulk Actions */}
        {selectedInvoices.size > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedInvoices.size} invoice{selectedInvoices.size > 1 ? 's' : ''} selected
              </span>
              <Button 
                onClick={handleBulkDownload}
                className="bg-farmaze-orange hover:bg-farmaze-orange/90 text-white"
              >
                <Download size={16} className="mr-2" />
                Download Selected
              </Button>
            </div>
          </div>
        )}
        
        {/* Desktop Table View */}
        <Card className="hidden md:block mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-farmaze-orange focus:ring-farmaze-orange border-gray-300 rounded"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left cursor-pointer" 
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      Invoice Number
                      {sortColumn === 'id' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      {sortColumn === 'date' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  {showBranchColumn && (
                    <th className="px-6 py-3 text-left">Branch</th>
                  )}
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center">
                      Due Date
                      {sortColumn === 'dueDate' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      Amount
                      {sortColumn === 'amount' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedInvoices.length === 0 ? (
                  <tr className='text-center'>
                    <td className="px-6 py-4 font-medium" colSpan={showBranchColumn ? 8 : 7}>
                      <p className="text-gray-500">No invoices match your search criteria.</p>
                    </td>
                  </tr>
                ) : (paginatedInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.has(invoice.id)}
                        onChange={() => handleSelectInvoice(invoice.id)}
                        className="h-4 w-4 text-farmaze-orange focus:ring-farmaze-orange border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4">{invoice.date}</td>
                    {showBranchColumn && (
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {invoice.branchName || '—'}
                      </td>
                    )}
                    <td className="px-6 py-4">{invoice.dueDate}</td>
                    <td className="px-6 py-4 font-medium">${invoice.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(invoice.status)} flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(invoice.status)}
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {invoice.status.toLowerCase() === 'approved' && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9"
                            onClick={() => handleDownloadInvoice(invoice)}
                            disabled={downloadingInvoice === invoice.id}
                          >
                            {downloadingInvoice === invoice.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                            ) : (
                              <Download size={16} />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
            
          <Pagination 
            totalItems={sortedInvoices.length} 
            shownItems={paginatedInvoices.length}
            currentPage={currentPage}
            totalPages={Math.ceil(sortedInvoices.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </Card>
        
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No invoices match your search criteria.</p>
              </CardContent>
            </Card>
          ) : (
            sortedInvoices.map(invoice => (
              <Card 
                key={invoice.id} 
                className="hover:shadow-md transition-all"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.has(invoice.id)}
                            onChange={() => handleSelectInvoice(invoice.id)}
                            className="h-4 w-4 text-farmaze-orange focus:ring-farmaze-orange border-gray-300 rounded"
                          />
                          <div>
                            <h3 className="font-semibold text-farmaze-brown text-lg mb-1">
                              {invoice.invoiceNumber}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 gap-2">
                              <Calendar size={14} />
                              <span>{invoice.date}</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(invoice.status)} flex items-center gap-1`}
                        >
                          {getStatusIcon(invoice.status)}
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-gray-500">Invoice #:</div>
                        <div className="font-medium">{invoice.invoiceNumber}</div>

                        {showBranchColumn && invoice.branchName && (
                          <>
                            <div className="text-gray-500">Branch:</div>
                            <div className="font-medium">{invoice.branchName}</div>
                          </>
                        )}

                        <div className="text-gray-500">Due Date:</div>
                        <div className="font-medium">{invoice.dueDate}</div>
                        
                        <div className="text-gray-500">Related Orders:</div>
                        <div className="font-medium">{invoice.orderIds.join(', ')}</div>
                      </div>
                    </div>
                    
                    <div className="p-4 flex justify-between items-center bg-gray-50">
                      <span className="font-medium text-farmaze-brown">Total: ${invoice.amount.toFixed(2)}</span>
                      {invoice.status.toLowerCase() === 'approved' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-farmaze-orange text-farmaze-orange hover:bg-farmaze-orange/10"
                          onClick={() => handleDownloadInvoice(invoice)}
                          disabled={downloadingInvoice === invoice.id}
                        >
                          {downloadingInvoice === invoice.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-farmaze-orange mr-2"></div>
                          ) : (
                            <Download size={16} className="mr-2" />
                          )}
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </FadeInSection>
    </div>
  );
};

export default Invoices;
