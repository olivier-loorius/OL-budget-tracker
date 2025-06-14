import type { ChangeRateConverter } from '../compute/change_rate_converter';
import type { StorageInterface } from './storage_interface';

import { Category } from '../models/category';
import { Transaction, type TransactionOmitted } from '../models/transaction';

export class InMemoryStorage implements StorageInterface {
	readonly #changeRateConverter: ChangeRateConverter;

	#transactions: Array<Transaction> = [];
	#categories: Array<Category> = [];
	#salary: number = 0;

	constructor(changeRateConverter: ChangeRateConverter) {
		this.#changeRateConverter = changeRateConverter;
	}

	hydrate(): void {
		// No-op for in-memory storage
	}

	listTransactions(): Array<Transaction> {
		return this.#transactions;
	}

	getTransaction(transactionId: string): Transaction | undefined {
		return this.#transactions.find((transaction) => transaction.id === transactionId);
	}

	createTransaction(payload: TransactionOmitted | Transaction): Transaction {
		const transaction =
			payload instanceof Transaction
				? payload
				: new Transaction(this.#categories, this.#changeRateConverter, payload);

		this.#transactions.push(transaction);

		return transaction;
	}

	updateTransaction(
		transactionId: Transaction['id'],
		payload: Partial<TransactionOmitted>,
	): Transaction | undefined {
		this.#transactions = this.#transactions.map((transaction) => {
			if (transactionId !== transaction.id) {
				return transaction;
			}

			return transaction.update(payload, this.#categories);
		});

		return this.getTransaction(transactionId);
	}

	deleteTransaction(transactionId: Transaction['id']): void {
		this.#transactions = this.#transactions.filter(
			(transaction) => transactionId !== transaction.id,
		);
	}

	transactionsCount(): number {
		return this.#transactions.length;
	}

	mapTransactions(callback: (transaction: Transaction) => Transaction): void {
		this.#transactions = this.#transactions.map((t) => callback(t));
	}

	// filtrage des transactions
	filterTransactionsByMonth(year: number, month: number): Array<Transaction> {
		// uniquement les transactions du mois/année
		return this.#transactions.filter((transaction) => {
			const date = transaction.operatedAt;
			return date.getFullYear() === year && date.getMonth() === month;
		});
	}

	setSalary(salary: number) {
		this.#salary = salary;
	}

	getSalary(): number {
		return this.#salary;
	}

	setThreshold(value: number) {}
	getThreshold(): number {
		return 0;
	}

	listCategories(): Array<Category> {
		return this.#categories;
	}

	getCategory(categoryId: Category['id']): Category | undefined {
		return this.#categories.find((category) => category.id === categoryId);
	}

	createCategory(name: string): Category {
		const category = new Category({ name });
		this.#categories.push(category);

		return category;
	}

	deleteCategory(categoryId: Category['id']) {
		this.#categories = this.#categories.filter((category) => categoryId !== category.id);
	}
}
