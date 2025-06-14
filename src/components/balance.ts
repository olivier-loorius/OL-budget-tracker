import type { Currency } from '../models/transaction';

import { createElement } from '../renderer/utils';
import { currencyFormatter } from '../utils';

interface BalanceProps {
	totalIncome: Record<Currency, number>;
	totalExpenses: Record<Currency, number>;
	totalBalance: Record<Currency, number>;
}

export function Balance(props: BalanceProps) {
	return createElement('div', { className: 'grid grid-cols-3 gap-4' }, {}, [
		BalanceItem({ label: 'Dépenses', values: props.totalExpenses, className: 'text-red-600' }),
		BalanceItem({ label: 'Revenus', values: props.totalIncome, className: 'text-green-600' }),
		BalanceItem({ label: 'Solde', values: props.totalBalance, className: 'text-blue-600' }),
	]);
}
interface BalanceItemProps {
	label: string;
	values: Record<Currency, number>;
	className?: string;
}

function BalanceItem(props: BalanceItemProps) {
	return createElement('div', { className: 'rounded bg-white p-4 shadow' }, {}, [
		createElement('h3', { className: 'text-lg font-semibold mb-2' }, {}, props.label),
		...Object.entries(props.values).map(([currency, value]) =>
			createElement('p', { className: `text-sm ${props.className}` }, {}, `${currency}: ${currencyFormatter[currency as Currency].format(value)}`)
		),
	]);
}