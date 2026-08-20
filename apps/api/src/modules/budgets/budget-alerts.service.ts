import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CategoriesService } from '../categories/categories.service';
import { ExpensesRepository } from '../expenses/expenses.repository';
import { MailService } from '../mail/mail.service';
import { UsersRepository } from '../users/users.repository';
import { BudgetsRepository } from './budgets.repository';
import { BudgetsService } from './budgets.service';

@Injectable()
export class BudgetAlertsService {
  private readonly logger = new Logger(BudgetAlertsService.name);

  constructor(
    @Inject(BudgetsService) private readonly budgetsService: BudgetsService,
    @Inject(BudgetsRepository) private readonly budgetsRepository: BudgetsRepository,
    @Inject(MailService) private readonly mailService: MailService,
    @Inject(CategoriesService) private readonly categoriesService: CategoriesService,
    @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
    @Inject(ExpensesRepository) private readonly expensesRepository: ExpensesRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkBudgetsAndAlert() {
    this.logger.log('Running daily budget alert checks...');
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Note: In production this should be batched/paginated
    try {
      const budgets = await this.budgetsRepository.findAllByMonth(month, year);

      for (const budget of budgets) {
        // Find total spent
        const totals = await this.expensesRepository.sumByCategoryForMonth(
          budget.userId,
          month,
          year,
        );
        const spent = totals.get(budget.categoryId) || 0;

        if (spent > budget.limitAmount) {
          // They are over budget
          const user = await this.usersRepository.findById(budget.userId);
          const category = await this.categoriesService
            .list(budget.userId)
            .then((cats) => cats.find((c) => c.id === budget.categoryId));

          if (user && category) {
            await this.mailService.sendOverspendingAlert({
              to: user.email,
              name: user.name,
              categoryName: category.name,
              amountOver: spent - budget.limitAmount,
              currency: user.currency || 'USD',
            });
            this.logger.log(
              `Sent overspending alert to ${user.email} for category ${category.name}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to run budget alerts', error);
    }
  }
}
