import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { Subject, from, Subscription } from 'rxjs';
import { finalize, mergeMap } from 'rxjs/operators';

interface QueueItem {
  chatId: string | number;
  message: string;
  extra?: ExtraReplyMessage;
}

@Injectable()
export class MessageQueueService {
  private readonly logger = new Logger(MessageQueueService.name);
  private bot: Telegraf<Context>;
  private queue: QueueItem[] = [];
  private queueSubject = new Subject<QueueItem>();
  private processing = false;
  private readonly batchSize = 30;
  private readonly delayBetweenBatches = 1000; // 1 second
  private subscription: Subscription;

  constructor() {
    this.initializeQueueProcessing();
  }

  registerBot(bot: Telegraf<Context>) {
    this.bot = bot;
    this.logger.log('Bot instance registered in MessageQueueService');
  }

  addMessage(
    chatId: string | number,
    message: string,
    extra?: ExtraReplyMessage,
  ) {
    if (!this.bot) {
      this.logger.warn(
        'Bot instance not registered yet. Message queued but might not send until registration.',
      );
    }
    const item: QueueItem = { chatId, message, extra };
    this.queue.push(item);
    this.triggerProcessing();
  }

  private triggerProcessing() {
    if (!this.processing) {
      this.processing = true;
      // Use setTimeout instead of setImmediate for better compatibility/standard event loop behavior
      setTimeout(() => this.processNextBatch(0), 0);
    }
  }

  private initializeQueueProcessing() {
    this.subscription = this.queueSubject
      .pipe(
        mergeMap(
          (item) => {
            const startTime = Date.now();
            return from(
              this.sendMessage(item.chatId, item.message, item.extra),
            ).pipe(
              finalize(() => {
                const endTime = Date.now();
                const elapsedTime = endTime - startTime;
                const remainingTime = Math.max(
                  0,
                  this.delayBetweenBatches - elapsedTime,
                );
                // Trigger next batch after delay
                setTimeout(() => this.processNextBatch(remainingTime), 0);
              }),
            );
          },
          this.batchSize, // Concurrency limit
        ),
      )
      .subscribe({
        error: (err) => this.logger.error('Error in message queue stream', err),
      });
  }

  private processNextBatch(delay: number) {
    setTimeout(() => {
      if (this.queue.length > 0) {
        // Take a batch of items
        const batch = this.queue.splice(0, this.batchSize);
        // Push them into the stream
        batch.forEach((item) => this.queueSubject.next(item));
      } else {
        this.processing = false;
      }
    }, delay);
  }

  private async sendMessage(
    chatId: string | number,
    text: string,
    extra?: ExtraReplyMessage,
  ) {
    if (!this.bot) {
      this.logger.error('Cannot send message: Bot instance not registered');
      return;
    }

    try {
      await this.bot.telegram.sendMessage(chatId, text, extra);
    } catch (err) {
      const error = err as {
        response?: {
          error_code?: number;
          parameters?: { retry_after?: number };
        };
      };
      // Handle specific Telegram errors if needed, e.g. 429
      if (error.response && error.response.error_code === 429) {
        this.logger.error(
          `Rate limit hit for chatId ${chatId}: retry_after ${error.response.parameters?.retry_after}`,
        );
        // Re-queueing logic could go here, but for now we just log
        // Ideally we should pause the queue
      } else {
        this.logger.error(`Error sending message to chatId ${chatId}:`, error);
      }
    }
  }

  onModuleDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
