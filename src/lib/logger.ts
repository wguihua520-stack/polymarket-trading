import type { LogEntry, LogLevel } from '@/types/trading';
import { LOG_CONFIG } from '@/config/strategy';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 日志管理器
 * 负责将日志写入文件并管理日志轮转
 */
class Logger {
  private logFile: string;
  private currentSize = 0;
  
  constructor() {
    // 确保日志目录存在
    if (!fs.existsSync(LOG_CONFIG.LOG_DIR)) {
      fs.mkdirSync(LOG_CONFIG.LOG_DIR, { recursive: true });
    }
    
    this.logFile = path.join(LOG_CONFIG.LOG_DIR, LOG_CONFIG.LOG_FILE);
    this.initLogFile();
  }
  
  /**
   * 初始化日志文件
   */
  private initLogFile(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        this.currentSize = stats.size;
      } else {
        fs.writeFileSync(this.logFile, '');
        this.currentSize = 0;
      }
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }
  
  /**
   * 写入日志
   */
  log(entry: LogEntry): void {
    try {
      const logLine = this.formatLogEntry(entry);
      const logBuffer = Buffer.from(logLine + '\n');
      
      // 检查是否需要轮转
      if (this.currentSize + logBuffer.length > LOG_CONFIG.MAX_LOG_SIZE) {
        this.rotateLog();
      }
      
      // 写入日志
      fs.appendFileSync(this.logFile, logBuffer);
      this.currentSize += logBuffer.length;
      
      // 同时输出到控制台
      this.logToConsole(entry);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }
  
  /**
   * 格式化日志条目
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
    return `[${timestamp}] [${entry.level}] [${entry.category}] ${entry.message}${dataStr}`;
  }
  
  /**
   * 输出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const message = `[${entry.category}] ${entry.message}`;
    
    switch (entry.level) {
      case 'ERROR':
        console.error(message, entry.data || '');
        break;
      case 'WARN':
        console.warn(message, entry.data || '');
        break;
      case 'INFO':
        console.info(message, entry.data || '');
        break;
      case 'DEBUG':
        if (process.env.NODE_ENV === 'development') {
          console.debug(message, entry.data || '');
        }
        break;
    }
  }
  
  /**
   * 轮转日志文件
   */
  private rotateLog(): void {
    try {
      // 删除最旧的日志文件
      const oldestLog = `${this.logFile}.${LOG_CONFIG.MAX_LOG_FILES}`;
      if (fs.existsSync(oldestLog)) {
        fs.unlinkSync(oldestLog);
      }
      
      // 重命名现有日志文件
      for (let i = LOG_CONFIG.MAX_LOG_FILES - 1; i >= 1; i--) {
        const oldFile = `${this.logFile}.${i}`;
        const newFile = `${this.logFile}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile);
        }
      }
      
      // 将当前日志文件重命名为 .1
      fs.renameSync(this.logFile, `${this.logFile}.1`);
      
      // 创建新的日志文件
      fs.writeFileSync(this.logFile, '');
      this.currentSize = 0;
    } catch (error) {
      console.error('Failed to rotate log:', error);
    }
  }
  
  /**
   * 读取最近的日志
   */
  readRecentLogs(count: number = 100): LogEntry[] {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }
      
      const content = fs.readFileSync(this.logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      
      // 获取最近的N条日志
      const recentLines = lines.slice(-count);
      
      return recentLines.map(line => this.parseLogLine(line)).filter((log): log is LogEntry => log !== null);
    } catch (error) {
      console.error('Failed to read logs:', error);
      return [];
    }
  }
  
  /**
   * 解析日志行
   */
  private parseLogLine(line: string): LogEntry | null {
    try {
      // 匹配日志格式: [timestamp] [level] [category] message | data
      const match = line.match(/^\[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\] (.+?)(?: \| (.+))?$/);
      
      if (!match) {
        return null;
      }
      
      const [, timestamp, level, category, message, dataStr] = match;
      
      return {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(timestamp).getTime(),
        level: level as LogLevel,
        category,
        message,
        data: dataStr ? JSON.parse(dataStr) : undefined,
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 清空日志
   */
  clearLogs(): void {
    try {
      fs.writeFileSync(this.logFile, '');
      this.currentSize = 0;
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

// 导出单例
export const logger = new Logger();
