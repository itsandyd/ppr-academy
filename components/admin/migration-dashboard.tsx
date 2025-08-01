/**
 * Admin Dashboard for Migration Monitoring
 * Provides real-time monitoring, alerts, and rollback controls
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Database,
  Users,
  Package,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { getMigrationMonitor, MigrationMetrics, MigrationAlert } from '@/lib/monitoring/migration-monitor';
import { features } from '@/lib/features';

export function MigrationDashboard() {
  const [monitor] = useState(() => getMigrationMonitor());
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [metrics, setMetrics] = useState<MigrationMetrics[]>([]);
  const [alerts, setAlerts] = useState<MigrationAlert[]>([]);
  const [isExecutingRollback, setIsExecutingRollback] = useState(false);

  // Update dashboard data
  const updateDashboard = React.useCallback(() => {
    setSystemStatus(monitor.getSystemStatus());
    setMetrics(monitor.getMetrics(50));
    setAlerts(monitor.getAlerts());
  }, [monitor]);

  // Set up real-time updates
  useEffect(() => {
    updateDashboard();
    const interval = setInterval(updateDashboard, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateDashboard]);

  // Start/stop monitoring
  const toggleMonitoring = () => {
    if (systemStatus?.isMonitoring) {
      monitor.stopMonitoring();
    } else {
      monitor.startMonitoring();
    }
    updateDashboard();
  };

  // Execute rollback
  const executeRollback = async (planId: string) => {
    if (!confirm(`Are you sure you want to execute rollback: ${planId}?`)) {
      return;
    }

    setIsExecutingRollback(true);
    try {
      const result = await monitor.executeRollback(planId);
      if (result.success) {
        alert('Rollback completed successfully');
      } else {
        alert(`Rollback failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      alert(`Rollback error: ${error}`);
    } finally {
      setIsExecutingRollback(false);
      updateDashboard();
    }
  };

  // Get health status color
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const latestMetrics = metrics[metrics.length - 1];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Migration Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Monitor the marketplace migration in real-time
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={updateDashboard}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button
                onClick={toggleMonitoring}
                variant={systemStatus?.isMonitoring ? "destructive" : "default"}
                size="sm"
              >
                {systemStatus?.isMonitoring ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Monitoring
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <div className="flex items-center mt-2">
                    <Badge className={`${getHealthColor(systemStatus?.systemHealth || 'unknown')} border-0`}>
                      {systemStatus?.systemHealth || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <div className="flex items-center mt-2">
                    <span className="text-2xl font-bold">{systemStatus?.activeAlerts || 0}</span>
                    {systemStatus?.criticalAlerts > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {systemStatus.criticalAlerts} Critical
                      </Badge>
                    )}
                  </div>
                </div>
                <AlertTriangle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Migration Progress</p>
                  <div className="mt-2">
                    {latestMetrics && (
                      <>
                        <div className="text-2xl font-bold">
                          {((latestMetrics.migratedUsers / latestMetrics.totalUsers) * 100).toFixed(1)}%
                        </div>
                        <Progress 
                          value={(latestMetrics.migratedUsers / latestMetrics.totalUsers) * 100} 
                          className="mt-2"
                        />
                      </>
                    )}
                  </div>
                </div>
                <Database className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <div className="flex items-center mt-2">
                    <span className="text-2xl font-bold">
                      {latestMetrics?.avgResponseTime || 0}ms
                    </span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Flags Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Feature Flags Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(features).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">{key}</span>
                  <Badge variant={value ? "default" : "outline"}>
                    {value ? "ON" : "OFF"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="rollback">Rollback</TabsTrigger>
          </TabsList>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>User Migration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latestMetrics && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="font-bold">{latestMetrics.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Migrated:</span>
                        <span className="font-bold text-green-600">{latestMetrics.migratedUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className="font-bold text-orange-600">
                          {latestMetrics.totalUsers - latestMetrics.migratedUsers}
                        </span>
                      </div>
                      <Progress 
                        value={(latestMetrics.migratedUsers / latestMetrics.totalUsers) * 100}
                        className="mt-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Product Migration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latestMetrics && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Courses:</span>
                        <span className="font-bold">{latestMetrics.totalCourses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Migrated Products:</span>
                        <span className="font-bold text-green-600">{latestMetrics.migratedProducts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className="font-bold text-orange-600">
                          {latestMetrics.totalCourses - latestMetrics.migratedProducts}
                        </span>
                      </div>
                      <Progress 
                        value={(latestMetrics.migratedProducts / latestMetrics.totalCourses) * 100}
                        className="mt-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>System Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latestMetrics && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Avg Response:</span>
                        <span className="font-bold">{latestMetrics.avgResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Count:</span>
                        <span className={`font-bold ${
                          latestMetrics.errorCount > 5 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {latestMetrics.errorCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span className="text-sm text-gray-600">
                          {new Date(latestMetrics.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Metrics Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Migration Progress Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Chart visualization would go here</p>
                    <p className="text-sm">Showing migration progress, response times, and error rates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                  <p className="text-gray-600">System is running smoothly</p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Alert key={alert.id} className={
                  alert.type === 'error' ? 'border-red-200 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertTitle className="mb-1">
                        {alert.type.toUpperCase()} - {alert.message}
                      </AlertTitle>
                      <AlertDescription>
                        <div className="text-sm text-gray-600 mb-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                        {alert.metadata && (
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(alert.metadata, null, 2)}
                          </pre>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </TabsContent>

          {/* Rollback Tab */}
          <TabsContent value="rollback" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Rollback Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-700">
                    <Pause className="w-5 h-5" />
                    <span>Pause Migration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Pause ongoing data migration while keeping systems running.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>• Low risk operation</div>
                    <div>• ~2 minutes duration</div>
                    <div>• No data loss</div>
                  </div>
                  <Button
                    onClick={() => executeRollback('pause-migration')}
                    disabled={isExecutingRollback}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Migration
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-700">
                    <RotateCcw className="w-5 h-5" />
                    <span>Disable Marketplace</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Disable new marketplace features and revert to legacy system.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>• Low risk operation</div>
                    <div>• ~5 minutes duration</div>
                    <div>• Reverts to legacy UI</div>
                  </div>
                  <Button
                    onClick={() => executeRollback('disable-marketplace')}
                    disabled={isExecutingRollback}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Disable Marketplace
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <span>Full Rollback</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete rollback to pre-migration state. Use only in emergencies.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>• High risk operation</div>
                    <div>• ~30 minutes duration</div>
                    <div>• May cause data loss</div>
                  </div>
                  <Button
                    onClick={() => executeRollback('full-rollback')}
                    disabled={isExecutingRollback}
                    variant="destructive"
                    className="w-full mt-4"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Full Rollback
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Technical Lead</h4>
                    <p className="text-sm text-gray-600">John Doe - Engineering</p>
                    <p className="text-sm">📧 john.doe@company.com</p>
                    <p className="text-sm">📱 +1 (555) 123-4567</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">DevOps Lead</h4>
                    <p className="text-sm text-gray-600">Jane Smith - Infrastructure</p>
                    <p className="text-sm">📧 jane.smith@company.com</p>
                    <p className="text-sm">📱 +1 (555) 765-4321</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}