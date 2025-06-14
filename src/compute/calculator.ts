import type { Category } from '../models/category';
import type { StorageInterface } from '../storage/storage_interface';
import type { ChangeRateConverter } from './change_rate_converter';

import { Balance } from '../components/balance';
import { Button } from '../components/button';
import { Categories } from '../components/categories';
import { DateRange } from '../components/date_range';
import { Modal } from '../components/modal';
import { SalaryForm } from '../components/salary';
import { OperationsTable } from '../components/table';
import {
	type Currency,
	Transaction,
	type TransactionOmitted,
	type TransactionType,
} from '../models/transaction';
import { inverseCurrency } from '../utils';

interface CalculatorProps {
	storage: StorageInterface;
	changeRateConverter: ChangeRateConverter;
	dom: {
		actions: HTMLElement;
		history: HTMLElement;
		balance: HTMLElement;
		salary: HTMLElement;
		categories: HTMLElement;
		dateRange: HTMLInputElement;
	};
}

export class Calculator {
	readonly #storage: StorageInterface;
	readonly #changeRateConverter: ChangeRateConverter;
	readonly #actionsContainer: HTMLElement;
	readonly #historyContainer: HTMLElement;
	readonly #balanceContainer: HTMLElement;
	readonly #salaryContainer: HTMLElement;
	readonly #dateRangeContainer: HTMLInputElement;
	readonly #categoriesContainer: HTMLElement;

	#selectedMonth: { year: number; month: number };

	constructor(props: CalculatorProps) {
		this.#storage = props.storage;
		this.#changeRateConverter = props.changeRateConverter;
		this.#actionsContainer = props.dom.actions;
		this.#historyContainer = props.dom.history;
		this.#balanceContainer = props.dom.balance;
		this.#salaryContainer = props.dom.salary;
		this.#categoriesContainer = props.dom.categories;
		this.#dateRangeContainer = props.dom.dateRange;
		this.#selectedMonth = { year: new Date().getFullYear(), month: new Date().getMonth() };
	}

	get storage(): StorageInterface {
		return this.#storage;
	}

	get changeRateConverter(): ChangeRateConverter {
		return this.#changeRateConverter;
	}

	get selectedMonth() {
		return this.#selectedMonth;
	}

	set selectedMonth(value: { year: number; month: number }) {
		this.#selectedMonth = value;
		// maybe we should trigger a re-render here?
	}

	compute(transactions: Array<Transaction>) {
		const output: {
			expense: Record<Currency, number>;
			income: Record<Currency, number>;
			balance: Record<Currency, number>;
		} = {
			expense: { EUR: 0, USD: 0 },
			income: { EUR: 0, USD: 0 },
			balance: { EUR: 0, USD: 0 },
		};

		output.balance.EUR = this.#storage.getSalary();
		output.balance.USD = this.#changeRateConverter.convert(this.#storage.getSalary(), 'EUR');

		for (const transaction of transactions) {
			output[transaction.type][transaction.currency] =
				output[transaction.type][transaction.currency] + transaction.amount;

			const otherCurrency = transaction.currency === 'EUR' ? 'USD' : 'EUR';
			const convertedAmount = this.#changeRateConverter.convert(
				transaction.amount,
				transaction.currency,
			);
			output[transaction.type][otherCurrency] =
				output[transaction.type][otherCurrency] + convertedAmount;

			output.balance[transaction.currency] =
				transaction.type === 'expense'
					? output.balance[transaction.currency] - transaction.amount
					: output.balance[transaction.currency] + transaction.amount;

			output.balance[otherCurrency] =
				transaction.type === 'expense'
					? output.balance[otherCurrency] - convertedAmount
					: output.balance[otherCurrency] + convertedAmount;
		}

		return output;
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	handleCreateTransaction(values: FormData) {
		const transaction = new Transaction(this.#storage.listCategories(), this.#changeRateConverter);

		for (const [name, value] of values) {
			if (name === 'operation-date') {
				transaction.operatedAt = new Date(value as string);
			}

			if (name === 'operation-description') {
				transaction.label = value as string;
			}

			if (name === 'operation-amount') {
				transaction.amount = Number(value as string);
				transaction.convertedAmount = this.#changeRateConverter.convert(
					transaction.amount,
					transaction.currency,
				);
			}

			if (name === 'operation-type') {
				transaction.type = value as TransactionType;
			}

			if (name === 'operation-currency') {
				transaction.currency = value as Currency;
				transaction.convertedCurrency = inverseCurrency(transaction.currency);
			}

			if (name === 'operation-category') {
				const categoryId = value as string;

				if (categoryId === '') {
					continue;
				}

				transaction.category = this.#storage.getCategory(categoryId);
			}
		}

		this.#storage.createTransaction(transaction);
		this.renderOperationsTable();
		this.renderBalance();
	}

	handleTransactionUpdate(values: FormData) {
		const payload = {
			label: values.get('operation-description') as string,
			type: values.get('operation-type') as TransactionType,
			amount: Number(values.get('operation-amount') as string),
			currency: values.get('operation-currency') as Currency,
			operatedAt: new Date(values.get('operation-date') as string),
			categoryId: values.get('operation-category') as string,
		} satisfies Partial<TransactionOmitted>;

		this.#storage.updateTransaction(values.get('operation-id') as string, payload);
		this.renderOperationsTable();
		this.renderBalance();
	}

	handleTransactionDelete(transactionId: string): void {
		if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
			this.#storage.deleteTransaction(transactionId);
			this.renderOperationsTable();
			this.renderBalance();
		}
	}

	handleSalaryUpdate(salary: number): void {
		this.#storage.setSalary(salary);
		this.renderBalance();
	}

	handleThresholdUpdate(value: number): void {
		this.#storage.setThreshold(value);
		this.renderBalance();
	}

	handleCategoryCreate(name: Category['name']): void {
		this.#storage.createCategory(name);
		this.renderActions();
		this.renderCategories();
		this.renderOperationsTable();
	}

	handleCategoryDelete(id: Category['id']): void {
		if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
			this.#storage.deleteCategory(id);

			let isDirty = false;
			this.#storage.mapTransactions((transaction) => {
				if (transaction.category?.id === id) {
					isDirty = true;
					transaction.category = undefined;
				}

				return transaction;
			});

			if (isDirty) {
				this.renderOperationsTable();
			}

			this.renderCategories();
		}
	}

	renderOperationsTable(filters?: { year: number; month: number }): void {
		// Filtrage des opérations par mois
		this.#historyContainer.replaceChildren(
			OperationsTable({
				transactions: filters
					? this.#storage.filterTransactionsByMonth(filters.year, filters.month)
					: this.#storage.listTransactions(),
				onTransactionUpdate: this.handleTransactionUpdate.bind(this),
				onTransactionDelete: this.handleTransactionDelete.bind(this),
				categories: this.#storage.listCategories().map((category) => [category.id, category.name]),
			}),
		);
	}

	renderActions(): void {
		this.#actionsContainer.replaceChildren(
			Modal({
				id: 'add-transaction-modal',
				modalTitle: 'Ajouter une opération',
				onFormSubmit: this.handleCreateTransaction.bind(this),
				trigger: Button({
					variant: 'normal',
					action: 'primary',
					content: 'Ajouter une opération',
					className: 'w-full',
				}),
				categories: this.#storage.listCategories().map((category) => [category.id, category.name]),
			}),
		);
	}

	renderDateRange() {
		this.#dateRangeContainer.replaceChildren(
			DateRange({
				selectedMonth: this.#selectedMonth,
				onPeriodChange: (year, month) => {
					this.selectedMonth = { year, month };
					this.render({ year, month });
				},
			}),
		);
	}

	renderBalance(filters?: { year: number; month: number }): void {
		const balance = this.compute(
			filters
				? this.#storage.filterTransactionsByMonth(filters.year, filters.month)
				: this.#storage.listTransactions(),
		);
		this.#balanceContainer.replaceChildren(
			Balance({
				totalBalance: balance.balance,
				totalExpenses: balance.expense,
				totalIncome: balance.income,
			}),
		);
	}

	renderSalary(): void {
		this.#salaryContainer.replaceChildren(
			SalaryForm({
				value: this.#storage.getSalary(),
				threshold: this.#storage.getThreshold(),
				onUpdate: this.handleSalaryUpdate.bind(this),
				onThresholdUpdate: this.handleThresholdUpdate.bind(this),
			}),
		);
	}

	renderCategories(): void {
		this.#categoriesContainer.replaceChildren(
			Categories({
				categories: this.#storage.listCategories(),
				onCategoryCreate: this.handleCategoryCreate.bind(this),
				onCategoryDelete: this.handleCategoryDelete.bind(this),
			}),
		);
	}

	render(filters?: { year: number; month: number }): void {
		this.renderActions();
		this.renderSalary();
		this.renderOperationsTable(filters);
		this.renderBalance(filters);
		this.renderCategories();
		this.renderDateRange();
	}
}
