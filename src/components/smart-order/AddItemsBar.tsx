import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Camera,
  Search,
  Loader2,
  Wand2,
  Upload,
  ShoppingCart,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { extractTextFromImage } from '@/utils/ocrUtils';
import { matchTextViaAPI } from './matchingUtils';
import type { MatchedProduct } from './types';

export type AddMode = 'ai' | 'text' | 'image' | 'browse';

interface AddItemsBarProps {
  onItemsMatched: (items: MatchedProduct[], source: 'text-match' | 'ocr-match') => void;
  onAddToCartDirect: (items: MatchedProduct[]) => void;
  activeMode: AddMode;
  onActiveModeChange: (mode: AddMode) => void;
  // AI tab props
  tomorrowDay: string;
  tomorrowDate: string;
  predictionCount: number;
  isLoadingPredictions: boolean;
  onRefreshPredictions: () => void;
}

const AddItemsBar: React.FC<AddItemsBarProps> = ({
  onItemsMatched,
  onAddToCartDirect,
  activeMode,
  onActiveModeChange,
  tomorrowDay,
  tomorrowDate,
  predictionCount,
  isLoadingPredictions,
  onRefreshPredictions,
}) => {
  const [rawText, setRawText] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [textMatchResults, setTextMatchResults] = useState<MatchedProduct[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrMatchResults, setOcrMatchResults] = useState<MatchedProduct[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextMatch = useCallback(async () => {
    if (!rawText.trim()) return;
    setIsMatching(true);
    try {
      const { items } = await matchTextViaAPI(rawText, 'text');
      setTextMatchResults(items);
      const matched = items.filter((i) => i.status === 'matched').length;
      toast.success(`Matched ${matched}/${items.length} items`);
    } catch {
      toast.error('Matching failed. Please try again.');
    } finally {
      setIsMatching(false);
    }
  }, [rawText]);

  const handleAddTextMatched = useCallback(() => {
    if (textMatchResults.length === 0) return;
    onAddToCartDirect(textMatchResults);
    setRawText('');
    setTextMatchResults([]);
  }, [textMatchResults, onAddToCartDirect]);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum 10MB.');
        return;
      }
      setIsProcessingOCR(true);
      setOcrStatus('Extracting text...');
      try {
        const ocrText = await extractTextFromImage(file);
        setOcrStatus('Matching products...');
        const { items } = await matchTextViaAPI(ocrText, 'ocr');
        setOcrMatchResults(items);
        const matched = items.filter(i => i.status === 'matched').length;
        toast.success(`Matched ${matched}/${items.length} items from image`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`OCR failed: ${message}`);
      } finally {
        setIsProcessingOCR(false);
        setOcrStatus('');
      }
    },
    []
  );

  const tabs: { key: AddMode; label: string; icon: React.ElementType }[] = [
    { key: 'ai', label: 'AI', icon: Sparkles },
    { key: 'text', label: 'Text', icon: FileText },
    { key: 'image', label: 'Image', icon: Camera },
    { key: 'browse', label: 'Browse', icon: Search },
  ];

  // For text/image, the bar expands; for ai/browse it's compact (content is below)
  const isExpandedTab = activeMode === 'text' || activeMode === 'image';

  const handleAddOcrMatched = useCallback(() => {
    if (ocrMatchResults.length === 0) return;
    onAddToCartDirect(ocrMatchResults);
    setOcrMatchResults([]);
  }, [ocrMatchResults, onAddToCartDirect]);

  return (
    <div className={`border border-border rounded-xl overflow-hidden bg-card ${isExpandedTab ? 'flex flex-col flex-1 min-h-0' : ''}`}>
      {/* Tab bar */}
      <div className="flex items-center border-b border-border shrink-0">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onActiveModeChange(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-rubik font-medium transition-all duration-200 border-b-2 -mb-px ${
              activeMode === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeMode !== 'browse' && (
        <div className={`p-3.5 ${isExpandedTab ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
          {/* ── AI TAB ── */}
          {activeMode === 'ai' && (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-rubik font-medium text-foreground">
                  AI-predicted order for {tomorrowDay}, {tomorrowDate}
                </p>
                <p className="text-xs text-muted-foreground font-rubik mt-0.5">
                  {isLoadingPredictions
                    ? 'Loading predictions...'
                    : `${predictionCount} items based on your ordering patterns`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshPredictions}
                disabled={isLoadingPredictions}
                className="h-8 text-xs font-rubik gap-1.5 rounded-lg border-border shrink-0"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingPredictions ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          )}

          {/* ── TEXT MODE ── */}
          {activeMode === 'text' && (
            <div className="space-y-2.5 flex-1 min-h-0 flex flex-col">
              <div className={`grid gap-3 flex-1 min-h-0 ${textMatchResults.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div className="space-y-2 flex flex-col min-h-0">
                  <Textarea
                    value={rawText}
                    onChange={(e) => { setRawText(e.target.value); setTextMatchResults([]); }}
                    placeholder={`Paste your order list here...\n\nExample:\nTomato 5kg\nOnion 2bag\nPaneer 2kg`}
                    className="font-mono text-xs leading-relaxed resize-none rounded-xl border-border focus:border-primary/30 focus:ring-primary/10 transition-all duration-200 flex-1 min-h-0"
                    disabled={isMatching}
                  />
                  <Button
                    onClick={handleTextMatch}
                    disabled={!rawText.trim() || isMatching}
                    size="sm"
                    className="h-8 text-xs font-rubik gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full"
                  >
                    {isMatching ? (
                      <><Loader2 className="h-3 w-3 animate-spin" />Matching...</>
                    ) : (
                      <><Wand2 className="h-3 w-3" />Match Products</>
                    )}
                  </Button>
                </div>

                {textMatchResults.length > 0 && (
                  <div className="flex flex-col min-h-0">
                    <div className="border border-border rounded-xl overflow-hidden flex flex-col min-h-0 flex-1">
                      <div className="px-3 py-2 bg-muted/30 border-b border-border shrink-0">
                        <p className="text-[11px] font-rubik font-medium text-muted-foreground">
                          {textMatchResults.filter(i => i.status === 'matched').length} matched · {textMatchResults.filter(i => i.status !== 'matched').length} unmatched
                        </p>
                      </div>
                      <div className="overflow-auto flex-1 min-h-0">
                        {textMatchResults.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-rubik border-b border-border last:border-b-0 ${
                              item.status === 'matched' ? 'bg-primary/[0.04]' : 'bg-accent/10'
                            }`}
                          >
                            <span className="text-muted-foreground truncate min-w-0 flex-1">{item.inputText}</span>
                            <span className="text-muted-foreground/40 shrink-0">→</span>
                            {item.status === 'matched' ? (
                              <span className="font-medium text-foreground truncate min-w-0 flex-1 text-right">
                                {item.matchedName} · {item.quantity}{item.unit}
                              </span>
                            ) : (
                              <span className="text-amber-600 italic truncate min-w-0 flex-1 text-right">No match</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleAddTextMatched}
                      size="sm"
                      className="h-8 text-xs font-rubik gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full mt-2 shrink-0"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Add {textMatchResults.filter(i => i.status === 'matched').length} Items to Cart
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-rubik shrink-0">
                One item per line. Quantity and unit optional.
              </p>
            </div>
          )}

          {/* ── IMAGE MODE ── */}
          {activeMode === 'image' && (
            <div className="space-y-2.5 flex-1 min-h-0 flex flex-col">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelected(f);
                }}
              />

              {ocrMatchResults.length > 0 ? (
                /* ── OCR Preview ── */
                <div className="flex flex-col min-h-0 flex-1">
                  <div className="border border-border rounded-xl overflow-hidden flex flex-col min-h-0 flex-1">
                    <div className="px-3 py-2 bg-muted/30 border-b border-border shrink-0 flex items-center justify-between">
                      <p className="text-[11px] font-rubik font-medium text-muted-foreground">
                        {ocrMatchResults.filter(i => i.status === 'matched').length} matched · {ocrMatchResults.filter(i => i.status !== 'matched').length} unmatched
                      </p>
                      <button
                        onClick={() => { setOcrMatchResults([]); }}
                        className="text-[11px] font-rubik text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Re-upload
                      </button>
                    </div>
                    <div className="overflow-auto flex-1 min-h-0">
                      {ocrMatchResults.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-rubik border-b border-border last:border-b-0 ${
                            item.status === 'matched' ? 'bg-primary/[0.04]' : 'bg-accent/10'
                          }`}
                        >
                          <span className="text-muted-foreground truncate min-w-0 flex-1">{item.inputText}</span>
                          <span className="text-muted-foreground/40 shrink-0">→</span>
                          {item.status === 'matched' ? (
                            <span className="font-medium text-foreground truncate min-w-0 flex-1 text-right">
                              {item.matchedName} · {item.quantity}{item.unit}
                            </span>
                          ) : (
                            <span className="text-amber-600 italic truncate min-w-0 flex-1 text-right">No match</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleAddOcrMatched}
                    size="sm"
                    className="h-8 text-xs font-rubik gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full mt-2 shrink-0"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Add {ocrMatchResults.filter(i => i.status === 'matched').length} Items to Cart
                  </Button>
                </div>
              ) : isProcessingOCR ? (
                <div className="flex items-center gap-2.5 py-6 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-rubik text-muted-foreground">{ocrStatus}</span>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-2xl p-7 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-3 bg-muted/50 rounded-2xl w-fit mx-auto mb-3">
                    <Upload className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-rubik text-foreground/80">Click to upload image/PDF</p>
                  <p className="text-[11px] text-muted-foreground font-rubik mt-1">JPG, PNG, PDF (max 10MB)</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddItemsBar;
