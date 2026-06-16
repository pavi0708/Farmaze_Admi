/**
 * Insights API Client (Phase G rewrite).
 *
 * Replaces the MCP WebSocket architecture with direct HTTP calls
 * to farmaze-agent /insights/generate endpoint.
 *
 * Keeps the same class + export shape so Dashboard.tsx and
 * SpendInsightsCard.tsx continue to work without changes.
 */

import { agentGenerateInsights, type SmartInsight } from '@/api/agentApi';

interface InsightsRequest {
  tabType: 'overview' | 'spend' | 'volume';
  clientId: string;
  timePeriod: string;
  analyticsData: Record<string, unknown>;
  filters?: Record<string, unknown>;
}

class MCPInsightsApi {
  /** Read client_id from localStorage (UUID from JWT) */
  private getClientId(): string {
    try {
      const userJson = localStorage.getItem('farmaze_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user?.client_id) return String(user.client_id);
      }
    } catch (e) {
      console.error('Failed to get client ID from auth:', e);
    }
    return '';
  }

  private getClientName(): string {
    try {
      const userJson = localStorage.getItem('farmaze_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        return user?.name || user?.business_name || user?.username || 'Client';
      }
    } catch (e) {
      console.error('Failed to get client name from auth:', e);
    }
    return 'Client';
  }

  // ── Per-tab generators (keep same signatures for consumers) ───

  async generateOverviewInsights(data: Record<string, unknown>): Promise<SmartInsight[]> {
    try {
      const res = await agentGenerateInsights({
        client_id: this.getClientId(),
        client_name: this.getClientName(),
        tab_type: 'overview',
        time_period: (data.timePeriod as string) || '30d',
        analytics_data: {
          overview: data.overview ?? data,
          filters: data.filters,
        },
      });
      return res.data.insights ?? [];
    } catch (error) {
      console.error('Failed to generate overview insights:', error);

      // Graceful fallback — same pattern as before
      const overviewData = (data.overview ?? data) as Record<string, Record<string, number>>;
      const currentPeriod = overviewData?.current_period ?? {};
      return [
        {
          type: 'positive',
          title: 'Current Operations Overview',
          description: `Your ingredient spend this period is ₹${(currentPeriod.total_spend ?? 0).toLocaleString('en-IN')}. Regular ordering from Farmaze ensures consistent menu availability.`,
          metric: `₹${(currentPeriod.total_spend ?? 0).toLocaleString('en-IN')} total spend`,
          impact: 'MEDIUM',
          confidence: 0.8,
        },
      ];
    }
  }

  async generateSpendInsights(data: Record<string, unknown>): Promise<SmartInsight[]> {
    try {
      const res = await agentGenerateInsights({
        client_id: this.getClientId(),
        client_name: this.getClientName(),
        tab_type: 'spend',
        time_period: (data.timePeriod as string) || '30d',
        analytics_data: {
          current_period: data.current_period,
          changes: data.changes,
          spend_trends: data.spendTrends ?? data.spend_trends ?? [],
          top_products: data.topProducts ?? data.top_products ?? [],
          category_breakdown: data.categoryBreakdown ?? data.category_breakdown ?? [],
          weekday_patterns: data.weekdayPatterns ?? data.weekday_patterns ?? [],
          granularity: data.granularity ?? 'total',
          filters: data.filters,
        },
      });
      return res.data.insights ?? [];
    } catch (error) {
      console.error('Failed to generate spend insights:', error);

      const topProduct = (data.topProducts as Array<Record<string, unknown>>)?.[0];
      return [
        {
          type: 'positive',
          title: 'Menu Staple Identified',
          description: `${(topProduct?.product_name as string) || 'Your top ingredient'} represents a significant portion of your spend, indicating it's a key menu component.`,
          metric: `₹${((topProduct?.product_spend as number) ?? 0).toLocaleString('en-IN')} spent`,
          impact: 'MEDIUM',
          confidence: 0.8,
        },
      ];
    }
  }

  async generateVolumeInsights(data: Record<string, unknown>): Promise<SmartInsight[]> {
    try {
      const res = await agentGenerateInsights({
        client_id: this.getClientId(),
        client_name: this.getClientName(),
        tab_type: 'volume',
        time_period: (data.timePeriod as string) || '30d',
        analytics_data: {
          volume_trends: data.volumeTrends ?? data.volume_trends ?? [],
          category_volumes: data.categoryVolumes ?? data.category_volumes ?? [],
          top_volume_products: data.topVolumeProducts ?? data.top_volume_products ?? [],
          seasonal_patterns: data.seasonalPatterns ?? data.seasonal_patterns ?? [],
          filters: data.filters,
        },
      });
      return res.data.insights ?? [];
    } catch (error) {
      console.error('Failed to generate volume insights:', error);
      return [
        {
          type: 'positive',
          title: 'Volume Analysis',
          description: 'Your volume patterns indicate consistent ingredient usage supporting stable kitchen operations.',
          metric: 'Operational consistency maintained',
          impact: 'MEDIUM',
          confidence: 0.8,
        },
      ];
    }
  }

  /** Generic entry kept for interface compatibility */
  async generateInsights(request: InsightsRequest): Promise<SmartInsight[]> {
    switch (request.tabType) {
      case 'overview':
        return this.generateOverviewInsights(request.analyticsData);
      case 'spend':
        return this.generateSpendInsights(request.analyticsData);
      case 'volume':
        return this.generateVolumeInsights(request.analyticsData);
      default:
        return [];
    }
  }
}

export const mcpInsightsApi = new MCPInsightsApi();
export default mcpInsightsApi;
