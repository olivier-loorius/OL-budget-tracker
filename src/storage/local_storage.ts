import type { ChangeRateConverter } from '../compute/change_rate_converter';

import { Category, type CategoryOmitted } from '../models/category';
import { Transaction, type TransactionOmitted } from '../models/transaction';
import { type StorageInterface } from './storage_interface';

export class LocalStorage implements StorageInterface {
	readonly #changeRateConverter: ChangeRateConverter;

	#storageKey = 'budget_tracker';
	#transactions: Array<Transaction> = [];
	#categories: Array<Category> = [];
	#salary: number = 0;

	constructor(changeRateConverter: ChangeRateConverter) {
		this.#changeRateConverter = changeRateConverter;
	}

	#save() {
		window.localStorage.setItem(
			this.#storageKey,
			JSON.stringify({
				salary: this.#salary,
				transactions: this.#transactions.map((transaction) => transaction.serialize()),
				categories: this.#categories.map((category) => category.serialize()),
			}),
		);
	}

	hydrate(): void {
		const encoded = window.localStorage.getItem(this.#storageKey);

		if (!encoded) {
			return;
		}

		const decoded = JSON.parse(encoded);

		if ('salary' in decoded) {
			this.#salary = decoded.salary;
		}

		if ('categories' in decoded) {
			this.#categories = decoded.categories.map((item: CategoryOmitted) => new Category(item));
		}

		if ('transactions' in decoded) {
			this.#transactions = decoded.transactions.map(
				(item: TransactionOmitted) =>
					new Transaction(this.#categories, this.#changeRateConverter, item),
			);
		}
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

		const transactionExists = this.#transactions.some((t) => t.id === transaction.id);

		if (!transactionExists) {
			this.#transactions.push(transaction);
			this.#save();
		}

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

			const updatedTransaction = transaction.update(payload, this.#categories);
			this.#save();

			return updatedTransaction;
		});

		return this.getTransaction(transactionId);
	}

	deleteTransaction(transactionId: string): void {
		this.#transactions = this.#transactions.filter((t) => t.id !== transactionId);
		this.#save();
	}

	transactionsCount(): number {
		return this.#transactions.length;
	}

	mapTransactions(callback: (transaction: Transaction) => Transaction): void {
		this.#transactions = this.#transactions.map((t) => callback(t));
		this.#save();
	}

	// filtrage des transactions par mois
	filterTransactionsByMonth(year: number, month: number): Array<Transaction> {
		// uniquement les transactions
		return this.#transactions.filter((transaction) => {
			const date = transaction.operatedAt;
			return date.getFullYear() === year && date.getMonth() === month;
		});
	}

	setSalary(salary: number): void {
		this.#salary = salary;
		this.#save();
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

		this.#save();
		return category;
	}

	deleteCategory(categoryId: Category['id']) {
		this.#categories = this.#categories.filter((category) => categoryId !== category.id);
		this.#save();
	}
}
