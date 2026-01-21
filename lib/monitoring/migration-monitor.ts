/**
 * Migration Monitoring and Rollback System
 * Provides comprehensive monitoring, alerting, and rollback capabilities
 * for the marketplace migration process
 */

import { ConvexHttpClient } from "convex/browser";
import { features } from "@/lib/features";

interface MigrationMetrics {
  timestamp: number;
  totalUsers: number;
  migratedUsers: number;
  totalCourses: number;
  migratedProducts: number;
  errorCount: number;
  avgResponseTime: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  featureFlags: Record<string, boolean>;
}

interface MigrationAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  metadata?: any;
  resolved: boolean;
}

interface RollbackPlan {
  id: string;
  name: string;
  description: string;
  steps: RollbackStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface RollbackStep {
  id: string;
  description: string;
  action: () => Promise<void>;
  rollbackAction?: () => Promise<void>;
  validation: () => Promise<boolean>;
  critical: boolean;
}

class MigrationMonitor {
  private convex: ConvexHttpClient;
  private metrics: MigrationMetrics[] = [];
  private alerts: MigrationAlert[] = [];
  private rollbackPlans: Map<string, RollbackPlan> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  constructor(convexUrl: string) {
    this.convex = new ConvexHttpClient(convexUrl);
    this.initializeRollbackPlans();
  }

  // Start monitoring the migration
  startMonitoring(intervalMs = 30000) {
    if (this.isMonitoring) return;

    // console.log(...);
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkHealthThresholds();
        await this.validateSystemIntegrity();
      } catch (error) {
        console.error('Monitoring error:', error);
        this.createAlert('error', 'Monitoring system error', error);
      }
    }, intervalMs);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    // console.log(...);
  }

  // Collect system metrics
  private async collectMetrics(): Promise<MigrationMetrics> {
    const startTime = Date.now();

    try {
      // Collect data from both systems
      const [legacyUsers, legacyStats, newStats] = await Promise.all([
        this.getLegacyUserCount(),
        this.getLegacySystemStats(),
        this.getNewSystemStats(),
      ]);

      const responseTime = Date.now() - startTime;

      const metrics: MigrationMetrics = {
        timestamp: Date.now(),
        totalUsers: legacyUsers,
        migratedUsers: newStats.users,
        totalCourses: legacyStats.courses,
        migratedProducts: newStats.products,
        errorCount: this.getRecentErrorCount(),
        avgResponseTime: responseTime,
        systemHealth: this.calculateSystemHealth(responseTime),
        featureFlags: {
          useNewMarketplace: features.useNewMarketplace,
          useSimplifiedSchema: features.useSimplifiedSchema,
          parallelSystemRun: features.parallelSystemRun,
          enableDataMigration: features.enableDataMigration,
        },
      };

      this.metrics.push(metrics);
      
      // Keep only last 1000 metrics to prevent memory issues
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      return metrics;

    } catch (error) {
      console.error('Failed to collect metrics:', error);
      throw error;
    }
  }

  // Check if metrics exceed warning thresholds
  private async checkHealthThresholds() {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) return;

    // Response time threshold
    if (latest.avgResponseTime > 5000) {
      this.createAlert('warning', `High response time: ${latest.avgResponseTime}ms`);
    }

    // Error rate threshold
    if (latest.errorCount > 10) {
      this.createAlert('error', `High error count: ${latest.errorCount} errors in last 5 minutes`);
    }

    // Migration progress validation
    if (features.enableDataMigration) {
      const migrationRate = latest.migratedUsers / latest.totalUsers;
      if (migrationRate < 0.5 && Date.now() > Date.now() + 60 * 60 * 1000) { // After 1 hour
        this.createAlert('warning', `Migration progress slow: ${(migrationRate * 100).toFixed(1)}% completed`);
      }
    }

    // System health degradation
    if (latest.systemHealth === 'critical') {
      this.createAlert('error', 'System health critical - consider rollback');
    } else if (latest.systemHealth === 'degraded') {
      this.createAlert('warning', 'System health degraded');
    }
  }

  // Validate system integrity
  private async validateSystemIntegrity() {
    const validations = [
      this.validateDataConsistency(),
      this.validateFeatureFlagStates(),
      this.validateApiEndpoints(),
      this.validateDatabaseConnections(),
    ];

    const results = await Promise.allSettled(validations);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const validationNames = [
          'Data Consistency',
          'Feature Flags',
          'API Endpoints',
          'Database Connections'
        ];
        
        this.createAlert('error', `${validationNames[index]} validation failed`, result.reason);
      }
    });
  }

  // Create and manage alerts
  private createAlert(type: MigrationAlert['type'], message: string, metadata?: any) {
    const alert: MigrationAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      metadata,
      resolved: false,
    };

    this.alerts.push(alert);
    
    // Log to console based on severity
    if (type === 'error') {
      console.error('🚨 MIGRATION ALERT:', message, metadata);
    } else if (type === 'warning') {
      console.warn('⚠️ MIGRATION WARNING:', message, metadata);
    } else {
      console.info('ℹ️ MIGRATION INFO:', message, metadata);
    }

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Auto-resolve info alerts after 5 minutes
    if (type === 'info') {
      setTimeout(() => {
        const alertIndex = this.alerts.findIndex(a => a.id === alert.id);
        if (alertIndex !== -1) {
          this.alerts[alertIndex].resolved = true;
        }
      }, 5 * 60 * 1000);
    }
  }

  // Initialize rollback plans
  private initializeRollbackPlans() {
    // Rollback Plan 1: Disable new marketplace features
    this.rollbackPlans.set('disable-marketplace', {
      id: 'disable-marketplace',
      name: 'Disable New Marketplace',
      description: 'Disable new marketplace features and revert to legacy system',
      estimatedDuration: 5 * 60 * 1000, // 5 minutes
      riskLevel: 'low',
      steps: [
        {
          id: 'disable-feature-flags',
          description: 'Disable marketplace feature flags',
          action: async () => {
            // In production, this would update environment variables or database
            // console.log(...);
          },
          validation: async () => {
            return !features.useNewMarketplace;
          },
          critical: true,
        },
        {
          id: 'clear-cache',
          description: 'Clear application cache',
          action: async () => {
            // Clear Redis cache, CDN cache, etc.
            // console.log(...);
          },
          validation: async () => true,
          critical: false,
        },
        {
          id: 'verify-legacy-system',
          description: 'Verify legacy system is operational',
          action: async () => {
            await this.validateLegacySystem();
          },
          validation: async () => {
            return await this.validateLegacySystem();
          },
          critical: true,
        },
      ],
    });

    // Rollback Plan 2: Pause data migration
    this.rollbackPlans.set('pause-migration', {
      id: 'pause-migration',
      name: 'Pause Data Migration',
      description: 'Pause ongoing data migration while keeping systems running',
      estimatedDuration: 2 * 60 * 1000, // 2 minutes
      riskLevel: 'low',
      steps: [
        {
          id: 'pause-migration-jobs',
          description: 'Pause migration background jobs',
          action: async () => {
            // console.log(...);
          },
          validation: async () => true,
          critical: true,
        },
        {
          id: 'notify-admins',
          description: 'Notify administrators of pause',
          action: async () => {
            // console.log(...);
          },
          validation: async () => true,
          critical: false,
        },
      ],
    });

    // Rollback Plan 3: Full system rollback
    this.rollbackPlans.set('full-rollback', {
      id: 'full-rollback',
      name: 'Full System Rollback',
      description: 'Complete rollback to pre-migration state',
      estimatedDuration: 30 * 60 * 1000, // 30 minutes
      riskLevel: 'high',
      steps: [
        {
          id: 'backup-current-state',
          description: 'Create backup of current state',
          action: async () => {
            // console.log(...);
          },
          validation: async () => true,
          critical: true,
        },
        {
          id: 'disable-all-new-features',
          description: 'Disable all new marketplace features',
          action: async () => {
            // console.log(...);
          },
          validation: async () => true,
          critical: true,
        },
        {
          id: 'restore-database',
          description: 'Restore database to pre-migration state',
          action: async () => {
            // console.log(...);
          },
          rollbackAction: async () => {
            // console.log(...);
          },
          validation: async () => true,
          critical: true,
        },
        {
          id: 'clear-all-caches',
          description: 'Clear all application caches',
          action: async () => {
            // console.log(...);
          },
          validation: async () => true,
          critical: false,
        },
        {
          id: 'verify-system-health',
          description: 'Verify system is healthy after rollback',
          action: async () => {
            await this.validateLegacySystem();
          },
          validation: async () => {
            return await this.validateLegacySystem();
          },
          critical: true,
        },
      ],
    });
  }

  // Execute a rollback plan
  async executeRollback(planId: string): Promise<{ success: boolean; errors: string[] }> {
    const plan = this.rollbackPlans.get(planId);
    if (!plan) {
      throw new Error(`Rollback plan '${planId}' not found`);
    }

    this.createAlert('info', `Starting rollback: ${plan.name}`);

    const errors: string[] = [];
    const executedSteps: string[] = [];

    try {
      for (const step of plan.steps) {
        try {
          await step.action();
          executedSteps.push(step.id);
          
          // Validate step completion
          const isValid = await step.validation();
          if (!isValid && step.critical) {
            throw new Error(`Critical step validation failed: ${step.description}`);
          }
          
        } catch (error) {
          const errorMsg = `Step '${step.description}' failed: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
          
          if (step.critical) {
            // Attempt to rollback executed steps
            await this.rollbackExecutedSteps(plan.steps, executedSteps);
            throw new Error(`Critical step failed, rollback aborted: ${errorMsg}`);
          }
        }
      }

      this.createAlert('info', `Rollback completed: ${plan.name}`);
      return { success: true, errors };

    } catch (error) {
      this.createAlert('error', `Rollback failed: ${plan.name}`, error);
      return { success: false, errors: [...errors, String(error)] };
    }
  }

  // Rollback executed steps if critical step fails
  private async rollbackExecutedSteps(steps: RollbackStep[], executedStepIds: string[]) {
    // console.log(...);
    
    for (const stepId of executedStepIds.reverse()) {
      const step = steps.find(s => s.id === stepId);
      if (step?.rollbackAction) {
        try {
          await step.rollbackAction();
        } catch (error) {
          console.error(`Failed to rollback step ${stepId}:`, error);
        }
      }
    }
  }

  // Get current system status
  getSystemStatus() {
    const latest = this.metrics[this.metrics.length - 1];
    const activeAlerts = this.alerts.filter(a => !a.resolved);
    
    return {
      isMonitoring: this.isMonitoring,
      currentMetrics: latest,
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(a => a.type === 'error').length,
      availableRollbacks: Array.from(this.rollbackPlans.keys()),
      systemHealth: latest?.systemHealth || 'unknown',
    };
  }

  // Get detailed metrics history
  getMetrics(limit = 100) {
    return this.metrics.slice(-limit);
  }

  // Get alerts
  getAlerts(includeResolved = false) {
    return includeResolved 
      ? this.alerts 
      : this.alerts.filter(a => !a.resolved);
  }

  // Helper methods for data collection
  private async getLegacyUserCount(): Promise<number> {
    // In real implementation, query legacy database
    return 1000; // Mock data
  }

  private async getLegacySystemStats(): Promise<{ courses: number; users: number }> {
    // In real implementation, query legacy system
    return { courses: 150, users: 1000 }; // Mock data
  }

  private async getNewSystemStats(): Promise<{ products: number; users: number }> {
    // In real implementation, query new system
    return { products: 75, users: 500 }; // Mock data
  }

  private getRecentErrorCount(): number {
    // In real implementation, check error logs from last 5 minutes
    return Math.floor(Math.random() * 5); // Mock data
  }

  private calculateSystemHealth(responseTime: number): MigrationMetrics['systemHealth'] {
    if (responseTime > 10000) return 'critical';
    if (responseTime > 5000) return 'degraded';
    return 'healthy';
  }

  private async validateDataConsistency(): Promise<boolean> {
    // In real implementation, check data consistency between systems
    return true;
  }

  private async validateFeatureFlagStates(): Promise<boolean> {
    // Validate feature flags are in expected states
    return typeof features.useNewMarketplace === 'boolean';
  }

  private async validateApiEndpoints(): Promise<boolean> {
    // In real implementation, check API endpoint health
    return true;
  }

  private async validateDatabaseConnections(): Promise<boolean> {
    // In real implementation, check database connectivity
    return true;
  }

  private async validateLegacySystem(): Promise<boolean> {
    // In real implementation, validate legacy system is operational
    return true;
  }
}

// Singleton instance
let monitorInstance: MigrationMonitor | null = null;

export function getMigrationMonitor(): MigrationMonitor {
  if (!monitorInstance) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL is not set');
    }
    monitorInstance = new MigrationMonitor(convexUrl);
  }
  return monitorInstance;
}

// Export types for use in other files
export type { MigrationMetrics, MigrationAlert, RollbackPlan };