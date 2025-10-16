"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Bell,
  BellOff,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type AlertType = "error" | "warning" | "success" | "info";
export type AlertSeverity = "critical" | "high" | "medium" | "low";

export interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  source?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface RealTimeAlertsProps {
  alerts?: SystemAlert[];
  maxVisible?: number;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  className?: string;
}

export function RealTimeAlerts({
  alerts: initialAlerts = [],
  maxVisible = 3,
  position = "top-right",
  className
}: RealTimeAlertsProps) {
  const [alerts, setAlerts] = useState<SystemAlert[]>(initialAlerts);
  const [muted, setMuted] = useState(false);

  // TODO: Connect to real Convex subscriptions for live alerts
  // Example: Subscribe to new enrollments, purchases, errors, etc.
  // useEffect(() => {
  //   const subscription = subscribeToSystemEvents((event) => {
  //     const alert: SystemAlert = {
  //       id: event.id,
  //       type: event.type,
  //       severity: event.severity,
  //       title: event.title,
  //       message: event.message,
  //       timestamp: new Date(event.timestamp),
  //       source: event.source
  //     };
  //     setAlerts(prev => [alert, ...prev].slice(0, 10));
  //   });
  //   return () => subscription.unsubscribe();
  // }, []);

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const clearAll = () => {
    setAlerts([]);
  };

  const visibleAlerts = alerts.slice(0, maxVisible);

  const positionClasses = {
    "top-right": "top-4 right-4",
    "bottom-right": "bottom-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-left": "bottom-4 left-4"
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "error": return AlertCircle;
      case "warning": return AlertTriangle;
      case "success": return CheckCircle2;
      case "info": return Info;
    }
  };

  const getAlertStyles = (type: AlertType, severity: AlertSeverity) => {
    const base = "border-l-4";
    
    if (severity === "critical") {
      return cn(base, "bg-red-50 dark:bg-red-900/10 border-red-600 dark:border-red-500");
    }

    switch (type) {
      case "error":
        return cn(base, "bg-red-50 dark:bg-red-900/10 border-red-500");
      case "warning":
        return cn(base, "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500");
      case "success":
        return cn(base, "bg-green-50 dark:bg-green-900/10 border-green-500");
      case "info":
        return cn(base, "bg-blue-50 dark:bg-blue-900/10 border-blue-500");
    }
  };

  const getIconColor = (type: AlertType) => {
    switch (type) {
      case "error": return "text-red-600";
      case "warning": return "text-yellow-600";
      case "success": return "text-green-600";
      case "info": return "text-blue-600";
    }
  };

  return (
    <div className={cn("fixed z-50 w-96 space-y-3", positionClasses[position], className)}>
      {/* Header */}
      {alerts.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="gap-1">
            <Activity className="w-3 h-3 animate-pulse" />
            {alerts.length} active alerts
          </Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMuted(!muted)}
              className="h-7 px-2"
            >
              {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 px-2 text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Alerts */}
      <AnimatePresence>
        {visibleAlerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn("shadow-lg", getAlertStyles(alert.type, alert.severity))}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", getIconColor(alert.type))} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-transparent"
                          onClick={() => removeAlert(alert.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                        
                        {alert.action && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={alert.action.onClick}
                          >
                            {alert.action.label} →
                          </Button>
                        )}
                      </div>

                      {alert.source && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {alert.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Show More Indicator */}
      {alerts.length > maxVisible && (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            +{alerts.length - maxVisible} more alerts
          </Badge>
        </div>
      )}
    </div>
  );
}

// Mock alert generator for testing (DISABLED - showing empty by default)
export function useMockAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // Disabled mock alerts - uncomment to see demo alerts
  // useEffect(() => {
  //   setAlerts([
  //     {
  //       id: "1",
  //       type: "info",
  //       severity: "low",
  //       title: "Demo Alert",
  //       message: "This is a demo alert. Connect to Convex for real alerts.",
  //       timestamp: new Date(),
  //       source: "Demo System"
  //     }
  //   ]);
  // }, []);

  return alerts;
}

// Real alert generator (connect to Convex)
export function useRealTimeAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // TODO: Replace with Convex subscription
  // Example:
  // const newEnrollments = useQuery(api.enrollments.getRecentEnrollments, { limit: 5 });
  // const newPurchases = useQuery(api.purchases.getRecentPurchases, { limit: 5 });
  // 
  // useEffect(() => {
  //   if (newEnrollments) {
  //     const enrollmentAlerts = newEnrollments.map(e => ({
  //       id: e._id,
  //       type: "success" as const,
  //       severity: "low" as const,
  //       title: "New Enrollment",
  //       message: `${e.studentName} enrolled in ${e.courseName}`,
  //       timestamp: new Date(e._creationTime),
  //       source: "Enrollments"
  //     }));
  //     setAlerts(prev => [...enrollmentAlerts, ...prev].slice(0, 10));
  //   }
  // }, [newEnrollments]);

  return alerts;
}

