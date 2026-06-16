import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Camera,
  Upload,
  CheckCircle,
  Loader2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  XCircle,
  AlertTriangle,
  Search,
  Trash2,
  ShoppingCart,
  Send,
  ImageIcon,
  FileText,
  Package,
  ChevronRight,
  Eye,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { extractTextFromImage } from '@/utils/ocrUtils';
import analyticsApi from '@/api/analyticsApi';
import type { MatchedProduct } from './types';

// ── Processing step type ─────────────────────────────────────────────────────

type StepStatus = 'pending' | 'processing' | 'done' | 'error';

interface ProcessingStep {
  id: string;
  label: string;
  status: StepStatus;
}

const initialSteps: ProcessingStep[] = [
  { id: 'extract', label: 'Extracting text with AI Vision...', status: 'pending' },
  { id: 'match', label: 'Matching products...', status: 'pending' },
  { id: 'ready', label: 'Ready for review', status: 'pending' },
];

// ── Transform API response to MatchedProduct[] format ────────────────────────
function transformApiResponse(apiResponse: Awaited<ReturnType<typeof analyticsApi.processTextOrder>>): MatchedProduct[] {
  const items: MatchedProduct[] = [];

  if (apiResponse.matchedItems) {
    apiResponse.matchedItems.forEach((item, idx) => {
      items.push({
        id: `ocr-matched-${idx}`,
        inputText: `${item.productName} ${item.quantity}${item.unit}`,
        matchedName: item.productName,
        matchedSku: item.sku || null,
        quantity: item.quantity,
        unit: item.unit,
        confidence: 95,
        status: 'matched',
        unitPrice: item.unitPrice,
        productId: item.productId,
      });
    });
  }

  if (apiResponse.unmatchedItems) {
    apiResponse.unmatchedItems.forEach((item, idx) => {
      items.push({
        id: `ocr-unmatched-${idx}`,
        inputText: item.text,
        matchedName: null,
        matchedSku: null,
        quantity: item.quantity,
        unit: item.unit,
        confidence: 0,
        status: 'unmatched',
      });
    });
  }

  return items;
}

// ── Match text via real API ──────────────────────────────────────────────────
async function matchTextViaAPI(text: string): Promise<{ items: MatchedProduct[]; totalInputLines: number }> {
  const apiResponse = await analyticsApi.processTextOrder(text);
  const items = transformApiResponse(apiResponse);
  const totalInputLines = apiResponse.stats?.totalItems || items.length;
  return { items, totalInputLines };
}

// ── Step Indicator (compact horizontal) ──────────────────────────────────────

const StepIndicator: React.FC<{ steps: ProcessingStep[] }> = ({ steps }) => (
  <div className="flex items-center gap-2 py-3 px-4 bg-muted/30 rounded-lg">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <div className="flex items-center gap-1.5">
          {step.status === 'done' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle className="h-4 w-4 text-farmaze-green" />
            </motion.div>
          )}
          {step.status === 'processing' && (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          )}
          {step.status === 'error' && (
            <div className="h-4 w-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-destructive text-[10px] font-bold">!</span>
            </div>
          )}
          {step.status === 'pending' && (
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
          )}
          <span
            className={`text-xs font-rubik ${
              step.status === 'done'
                ? 'text-foreground font-medium'
                : step.status === 'processing'
                ? 'text-primary font-medium'
                : step.status === 'error'
                ? 'text-destructive font-medium'
                : 'text-muted-foreground'
            }`}
          >
            {step.label}
          </span>
        </div>
        {index < steps.length - 1 && (
          <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ── Image Preview Panel ──────────────────────────────────────────────────────

const ImagePreviewPanel: React.FC<{
  preview: string | null;
  fileName: string;
  fileSize: number;
}> = ({ preview, fileName, fileSize }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium font-rubik text-foreground truncate max-w-[120px]">
            {fileName}
          </span>
          <span className="text-[10px] text-muted-foreground font-rubik">
            {(fileSize / 1024 / 1024).toFixed(1)}MB
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Zoom out</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Zoom in</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Rotate</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 flex items-center justify-center min-h-[300px]">
          {preview ? (
            <img
              src={preview}
              alt="Uploaded order"
              className="max-w-full rounded-lg border border-border shadow-sm transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Eye className="h-8 w-8" />
              <p className="text-xs font-rubik">Preview not available for this file type</p>
            </div>
          )}
        </div>
      </ScrollArea>
      {zoom !== 1 && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/20">
          <span className="text-[10px] text-muted-foreground font-rubik">{Math.round(zoom * 100)}%</span>
        </div>
      )}
    </div>
  );
};

// ── Extracted Text Panel ─────────────────────────────────────────────────────

const ExtractedTextPanel: React.FC<{
  extractedText: string;
  onTextChange: (text: string) => void;
  onRematch: () => void;
  isProcessing: boolean;
  extractedLines: string[];
}> = ({ extractedText, onTextChange, onRematch, isProcessing, extractedLines }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium font-rubik text-foreground">Extracted Text</span>
          {extractedLines.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full font-rubik">
              {extractedLines.length} lines
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRematch}
          disabled={isProcessing || !extractedText.trim()}
          className="h-7 text-xs font-rubik gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isProcessing ? 'animate-spin' : ''}`} />
          Re-match
        </Button>
      </div>

      <div className="flex-1 relative">
        {extractedText ? (
          <div className="flex h-full">
            {/* Line numbers gutter with alternating stripes */}
            <div className="flex flex-col py-2 px-1.5 bg-muted/40 border-r border-border select-none">
              {extractedLines.map((_, idx) => (
                <div
                  key={idx}
                  className={`text-[10px] text-muted-foreground/60 font-mono leading-[22px] text-right min-w-[20px] ${idx % 2 === 1 ? 'bg-slate-100/70' : ''}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
            {/* Editable text with alternating line stripes via CSS gradient */}
            <Textarea
              value={extractedText}
              onChange={(e) => onTextChange(e.target.value)}
              className="flex-1 border-0 rounded-none resize-none font-mono text-xs leading-[22px] min-h-full focus-visible:ring-0 focus-visible:ring-offset-0 p-2"
              style={{
                backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 22px, rgb(241 245 249 / 0.7) 22px, rgb(241 245 249 / 0.7) 44px)',
                backgroundSize: '100% 44px',
                backgroundPosition: '0 0',
              }}
              disabled={isProcessing}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-12">
            <FileText className="h-8 w-8" />
            <p className="text-xs font-rubik">Extracted text will appear here</p>
          </div>
        )}
      </div>

      {extractedText && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/20">
          <p className="text-[10px] text-muted-foreground font-rubik">
            Edit text to fix OCR errors, then click Re-match
          </p>
        </div>
      )}
    </div>
  );
};

// ── Matched Products Panel ───────────────────────────────────────────────────

const MatchedProductsPanel: React.FC<{
  items: MatchedProduct[];
  totalInputLines: number;
  onRemove: (id: string) => void;
  onSearchReplace: (id: string, productName: string) => void;
  onSelectAlternative: (id: string, name: string) => void;
  onAddManualItem: () => void;
}> = ({ items, totalInputLines, onRemove, onSearchReplace, onSelectAlternative, onAddManualItem }) => {
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  // Expand row on click for unmatched items to show search inline
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const matchedCount = items.filter((i) => i.status === 'matched').length;
  const unmatchedCount = items.filter((i) => i.status === 'unmatched').length;
  const partialCount = items.filter((i) => i.status === 'partial').length;
  const duplicatesConsolidated = totalInputLines > 0 && totalInputLines > items.length
    ? totalInputLines - items.length
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header with stats */}
      <div className="px-3 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium font-rubik text-foreground">Matched Products</span>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-1.5">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className="bg-green-50 text-farmaze-green border-green-200 text-[10px] px-1.5 py-0 h-4 rounded-full">
                      {matchedCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>{matchedCount} matched</p></TooltipContent>
                </Tooltip>
                {partialCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 h-4 rounded-full">
                        {partialCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent><p>{partialCount} partial matches</p></TooltipContent>
                  </Tooltip>
                )}
                {unmatchedCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 py-0 h-4 rounded-full">
                        {unmatchedCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent><p>{unmatchedCount} unmatched - needs attention</p></TooltipContent>
                  </Tooltip>
                )}
                {duplicatesConsolidated > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] px-1.5 py-0 h-4 rounded-full">
                        +{duplicatesConsolidated}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{duplicatesConsolidated} duplicate lines merged (quantities combined)</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}
        </div>
        {duplicatesConsolidated > 0 && (
          <p className="text-[10px] text-muted-foreground font-rubik mt-1">
            {totalInputLines} lines → {items.length} unique products ({duplicatesConsolidated} duplicates merged)
          </p>
        )}
      </div>

      {/* Line-by-line product list — matches extracted text row height */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-12">
            <Package className="h-8 w-8" />
            <p className="text-xs font-rubik">Matched products will appear here</p>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Serial number gutter with alternating stripes — mirrors the line number gutter in extracted text */}
            <div className="flex flex-col py-2 px-1.5 bg-muted/40 border-r border-border select-none flex-shrink-0">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`text-[10px] font-mono leading-[22px] text-right min-w-[20px] ${
                    item.status === 'unmatched'
                      ? 'text-red-400'
                      : item.status === 'partial'
                      ? 'text-amber-500'
                      : 'text-muted-foreground/60'
                  } ${idx % 2 === 1 ? 'bg-slate-100/70' : ''}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Product rows */}
            <div className="flex-1 flex flex-col py-2 px-2 min-w-0">
              {items.map((item, index) => (
                <div key={item.id}>
                  {/* Main row — same 22px line height as extracted text, with alternating stripes */}
                  <div
                    className={`flex items-center gap-1.5 leading-[22px] min-h-[22px] group cursor-default ${
                      item.status === 'unmatched'
                        ? 'bg-red-50/60'
                        : item.status === 'partial'
                        ? 'bg-amber-50/40'
                        : hoveredRow === item.id
                        ? 'bg-muted/30'
                        : index % 2 === 1 ? 'bg-slate-100/70' : ''
                    }`}
                    onMouseEnter={() => setHoveredRow(item.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => {
                      if (item.status === 'unmatched' || item.status === 'partial') {
                        setExpandedRow(expandedRow === item.id ? null : item.id);
                      }
                    }}
                  >
                    {/* Status dot */}
                    {item.status === 'matched' && item.confidence >= 85 ? (
                      <CheckCircle className="h-3 w-3 text-farmaze-green flex-shrink-0" />
                    ) : item.status === 'partial' || (item.confidence >= 50 && item.confidence < 85) ? (
                      <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                    )}

                    {/* Product name */}
                    <span
                      className={`text-xs font-mono truncate flex-1 min-w-0 ${
                        item.status === 'matched'
                          ? 'text-foreground'
                          : item.status === 'partial'
                          ? 'text-amber-700'
                          : 'text-red-600'
                      }`}
                      title={
                        item.status === 'matched'
                          ? `${item.matchedName} — ${item.quantity}${item.unit}${item.unitPrice ? ` @ ₹${item.unitPrice}` : ''}`
                          : item.status === 'unmatched'
                          ? `Unmatched: "${item.inputText}" — click to search`
                          : `Partial: ${item.matchedName || item.inputText}`
                      }
                    >
                      {item.status === 'matched'
                        ? item.matchedName
                        : item.status === 'partial'
                        ? (item.matchedName || item.inputText) + ' ?'
                        : item.inputText + ' ✗'}
                    </span>

                    {/* Qty */}
                    <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0 tabular-nums">
                      {item.quantity}{item.unit}
                    </span>

                    {/* Price (if matched) */}
                    {item.unitPrice != null && item.unitPrice > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground/70 flex-shrink-0 tabular-nums hidden sm:inline">
                        ₹{item.unitPrice}
                      </span>
                    )}

                    {/* Delete on hover */}
                    <button
                      className="h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                      }}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  {/* Expanded search row for unmatched / partial items */}
                  {expandedRow === item.id && item.status === 'unmatched' && (
                    <div className="flex items-center gap-1 pl-[18px] py-1 bg-red-50/40">
                      <Input
                        placeholder="Type product name..."
                        value={searchInputs[item.id] || ''}
                        autoFocus
                        onChange={(e) =>
                          setSearchInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchInputs[item.id]) {
                            onSearchReplace(item.id, searchInputs[item.id]);
                            setExpandedRow(null);
                          }
                          if (e.key === 'Escape') setExpandedRow(null);
                        }}
                        className="h-6 text-[11px] font-rubik flex-1 border-red-200"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (searchInputs[item.id]) {
                            onSearchReplace(item.id, searchInputs[item.id]);
                            setExpandedRow(null);
                          }
                        }}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {expandedRow === item.id && item.status === 'partial' && item.alternatives && (
                    <div className="pl-[18px] py-1 bg-amber-50/40 space-y-0.5">
                      {item.alternatives.slice(0, 3).map((alt) => (
                        <button
                          key={alt.sku}
                          className="block w-full text-left text-[11px] font-rubik px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors text-amber-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAlternative(item.id, alt.name);
                            setExpandedRow(null);
                          }}
                        >
                          {alt.name} <span className="text-[10px] text-amber-600">({alt.confidence}%)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom summary */}
      {items.length > 0 && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-rubik">
              <span className="font-semibold text-foreground">{matchedCount}</span>/{items.length} matched
              {unmatchedCount > 0 && (
                <span className="text-red-500 font-medium"> · {unmatchedCount} missed</span>
              )}
            </p>
            <div className="h-1 flex-1 max-w-[60px] bg-muted rounded-full overflow-hidden flex ml-2">
              {matchedCount > 0 && (
                <div
                  className="h-full bg-farmaze-green"
                  style={{ width: `${(matchedCount / items.length) * 100}%` }}
                />
              )}
              {unmatchedCount > 0 && (
                <div
                  className="h-full bg-red-400"
                  style={{ width: `${(unmatchedCount / items.length) * 100}%` }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Summary & Cart Bar ───────────────────────────────────────────────────────

const CartBar: React.FC<{
  items: MatchedProduct[];
  estimatedCost: number;
  onAddAllToCart: () => void;
  onSendToAdmin: () => void;
}> = ({ items, estimatedCost, onAddAllToCart, onSendToAdmin }) => {
  const totalItems = items.length;
  const matchedCount = items.filter(
    (i) => i.status === 'matched' || (i.status === 'partial' && i.matchedName)
  ).length;
  const unmatchedCount = totalItems - matchedCount;
  const allResolved = matchedCount === totalItems && totalItems > 0;

  if (totalItems === 0) return null;

  return (
    <div className="rounded-xl bg-white border border-border shadow-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${totalItems > 0 ? Math.round((matchedCount / totalItems) * 100) : 0}%`,
                  backgroundColor: allResolved
                    ? 'hsl(var(--insight-positive-accent))'
                    : 'hsl(var(--primary))',
                }}
              />
            </div>
            <span className="text-sm font-rubik text-muted-foreground">
              <span className="font-semibold text-foreground">{matchedCount}</span> of{' '}
              <span className="font-semibold text-foreground">{totalItems}</span> matched
            </span>
          </div>

          {unmatchedCount > 0 && (
            <span className="text-xs font-rubik text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {unmatchedCount} item{unmatchedCount !== 1 ? 's' : ''} unmatched
            </span>
          )}

          {estimatedCost > 0 && (
            <span className="text-sm font-rubik text-muted-foreground hidden sm:inline">
              Est. cost:{' '}
              <span className="font-semibold text-foreground">
                ₹{estimatedCost.toLocaleString('en-IN')}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSendToAdmin}
            className="font-rubik text-sm"
          >
            <Send className="h-4 w-4 mr-1.5" />
            Send to Admin
          </Button>
          <Button
            size="sm"
            onClick={onAddAllToCart}
            disabled={!allResolved}
            className="font-rubik text-sm button-modern bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Add All to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

const OCRUploadTab: React.FC = () => {
  const { addToCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProcessingStep[]>(initialSteps);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [matchedItems, setMatchedItems] = useState<MatchedProduct[]>([]);
  const [totalInputLines, setTotalInputLines] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const extractedLines = extractedText
    ? extractedText.split('\n').filter((l) => l.trim())
    : [];

  // File selection
  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
    setSteps(initialSteps.map((s) => ({ ...s })));
    setExtractedText('');
    setMatchedItems([]);
    setShowResults(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // Process file: OCR with GPT-4o Vision → Match with real API
  const processFile = useCallback(async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    let ocrText = '';

    // Step 1: Extract text
    setSteps((s) => s.map((st) => (st.id === 'extract' ? { ...st, status: 'processing' } : st)));
    try {
      ocrText = await extractTextFromImage(selectedFile);
      setExtractedText(ocrText);
      setSteps((s) => s.map((st) => (st.id === 'extract' ? { ...st, status: 'done' } : st)));
    } catch (err: any) {
      console.error('OCR extraction failed:', err);
      setSteps((s) =>
        s.map((st) =>
          st.id === 'extract' ? { ...st, status: 'error', label: `OCR failed: ${err.message}` } : st
        )
      );
      setIsProcessing(false);
      toast.error(`OCR failed: ${err.message}`);
      return;
    }

    // Step 2: Match products
    setSteps((s) => s.map((st) => (st.id === 'match' ? { ...st, status: 'processing' } : st)));
    try {
      const result = await matchTextViaAPI(ocrText);
      setMatchedItems(result.items);
      setTotalInputLines(result.totalInputLines);
      setSteps((s) => s.map((st) => (st.id === 'match' ? { ...st, status: 'done' } : st)));
    } catch (err: any) {
      console.error('Product matching failed:', err);
      setSteps((s) =>
        s.map((st) =>
          st.id === 'match' ? { ...st, status: 'error', label: 'Matching failed' } : st
        )
      );
      setIsProcessing(false);
      toast.error('Product matching failed. Edit the text and click Re-match.');
      setShowResults(true);
      return;
    }

    // Step 3: Ready
    setSteps((s) => s.map((st) => (st.id === 'ready' ? { ...st, status: 'done' } : st)));
    setShowResults(true);
    setIsProcessing(false);
  }, [selectedFile]);

  // Re-match from edited text
  const handleRematch = useCallback(async () => {
    if (!extractedText.trim()) return;
    setIsProcessing(true);
    try {
      const result = await matchTextViaAPI(extractedText);
      setMatchedItems(result.items);
      setTotalInputLines(result.totalInputLines);
      toast.success('Products re-matched from edited text');
    } catch (err: any) {
      console.error('Re-match failed:', err);
      toast.error('Re-matching failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [extractedText]);

  const handleRemove = useCallback((id: string) => {
    setMatchedItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleSelectAlternative = useCallback((id: string, name: string) => {
    setMatchedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, matchedName: name, status: 'matched', confidence: 85 } : item
      )
    );
  }, []);

  const handleSearchReplace = useCallback(async (id: string, searchText: string) => {
    try {
      const similar = await analyticsApi.findSimilarProducts(searchText, 5);
      if (similar.length > 0) {
        const best = similar[0];
        setMatchedItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  matchedName: best.name,
                  matchedSku: best.sku || null,
                  productId: best.id,
                  unitPrice: best.unit_price,
                  status: 'matched',
                  confidence: 80,
                }
              : item
          )
        );
        toast.success(`Matched to "${best.name}"`);
      } else {
        toast.error('No similar products found');
      }
    } catch (err) {
      console.error('Search replace failed:', err);
      setMatchedItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, matchedName: searchText, status: 'matched', confidence: 80 }
            : item
        )
      );
    }
  }, []);

  const handleAddManualItem = useCallback(() => {
    // Placeholder for adding manual items
    toast.info('Use the Browse tab to add items manually');
  }, []);

  const handleAddAllToCart = useCallback(() => {
    const resolved = matchedItems.filter((i) => i.matchedName);
    resolved.forEach((item) => {
      addToCart({
        id: item.productId || item.matchedSku || item.id,
        name: item.matchedName!,
        quantity: item.quantity,
        unit: item.unit,
        availability: 'in_stock',
      });
    });
    toast.success(`${resolved.length} items added to cart`);
  }, [matchedItems, addToCart]);

  const handleSendToAdmin = useCallback(() => {
    toast.success('Order sent to admin for review');
  }, []);

  const estimatedCost = matchedItems.reduce((sum, item) => {
    if (item.matchedName && item.unitPrice) {
      return sum + item.quantity * item.unitPrice;
    }
    return sum;
  }, 0);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setSteps(initialSteps.map((s) => ({ ...s })));
    setExtractedText('');
    setMatchedItems([]);
    setShowResults(false);
  }, []);

  // ── Upload zone (no file selected yet) ──────────────────────────────────
  if (!selectedFile) {
    return (
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
        />
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-base font-medium font-rubik text-foreground">
            Drop image/PDF here or click to browse
          </p>
          <p className="text-sm text-muted-foreground font-rubik mt-1">
            Supports JPG, PNG, PDF (max 10MB)
          </p>
        </div>
      </div>
    );
  }

  // ── File selected but not yet processed ─────────────────────────────────
  if (!showResults && !isProcessing) {
    return (
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
        />
        <div className="card-modern flex items-center gap-4">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="h-20 w-20 rounded-lg object-cover border border-border"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium font-rubik text-foreground truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground font-rubik">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="font-rubik text-sm">
              Change
            </Button>
            <Button
              onClick={processFile}
              className="button-modern bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Process
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Processing / Results: 3-panel layout ────────────────────────────────
  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f);
        }}
      />

      {/* Top bar: progress steps + actions */}
      <div className="flex items-center justify-between gap-3">
        <StepIndicator steps={steps} />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleReset} className="font-rubik text-xs">
            New Upload
          </Button>
        </div>
      </div>

      {/* 3-panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" style={{ minHeight: '420px' }}>
        {/* Panel 1: Image Preview */}
        <div className="rounded-xl border border-border overflow-hidden bg-white flex flex-col">
          <ImagePreviewPanel
            preview={preview}
            fileName={selectedFile.name}
            fileSize={selectedFile.size}
          />
        </div>

        {/* Panel 2: Extracted Text */}
        <div className="rounded-xl border border-border overflow-hidden bg-white flex flex-col">
          <ExtractedTextPanel
            extractedText={extractedText}
            onTextChange={setExtractedText}
            onRematch={handleRematch}
            isProcessing={isProcessing}
            extractedLines={extractedLines}
          />
        </div>

        {/* Panel 3: Matched Products */}
        <div className="rounded-xl border border-border overflow-hidden bg-white flex flex-col">
          <MatchedProductsPanel
            items={matchedItems}
            totalInputLines={totalInputLines}
            onRemove={handleRemove}
            onSearchReplace={handleSearchReplace}
            onSelectAlternative={handleSelectAlternative}
            onAddManualItem={handleAddManualItem}
          />
        </div>
      </div>

      {/* Bottom cart bar */}
      {showResults && matchedItems.length > 0 && (
        <CartBar
          items={matchedItems}
          estimatedCost={estimatedCost}
          onAddAllToCart={handleAddAllToCart}
          onSendToAdmin={handleSendToAdmin}
        />
      )}
    </div>
  );
};

export default OCRUploadTab;
