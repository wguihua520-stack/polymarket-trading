'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { LogEntry } from '@/types/trading';
import { FileText, AlertCircle, AlertTriangle, Info, Bug } from 'lucide-react';

interface LogPanelProps {
  logs: LogEntry[];
}

const levelConfig = {
  INFO: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  WARN: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  ERROR: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  DEBUG: { icon: Bug, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900/20' },
};

export function LogPanel({ logs }: LogPanelProps) {
  return (
    <Card className="h-[calc(100vh-300px)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          实时日志
        </CardTitle>
        <CardDescription>
          共 {logs.length} 条日志
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-450px)]">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              暂无日志
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const config = levelConfig[log.level];
                const Icon = config.icon;
                
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg ${config.bgColor} border`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {log.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.data && (
                          <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
