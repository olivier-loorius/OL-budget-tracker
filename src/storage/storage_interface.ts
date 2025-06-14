import type { Category } from '../models/category';
import type { Transaction, TransactionOmitted } from '../models/transaction';

export interface StorageInterface {
	hydrate(): void;

	listTransactions(): Array<Transaction>;

	getTransaction(transactionId: Transaction['id']): Transaction | undefined;

	createTransaction(payload: TransactionOmitted | Transaction): Transaction;

	updateTransaction(
		transactionId: Transaction['id'],
		payload: Partial<TransactionOmitted>,
	): Transaction | undefined;

	deleteTransaction(transactionId: Transaction['id']): void;

	mapTransactions(callback: (transaction: Transaction) => Transaction): void;

	filterTransactionsByMonth(year: number, month: number): Array<Transaction>;

	transactionsCount(): number;

	setSalary(salary: number): void;

	getSalary(): number;

	listCategories(): Array<Category>;

	getCategory(categoryId: Category['id']): Category | undefined;

	createCategory(name: string): Category;

	deleteCategory(categoryId: Category['id']): void;

	getThreshold(): number;

	setThreshold(value: number): void;
}
