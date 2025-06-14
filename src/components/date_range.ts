import { createElement } from '../renderer/utils';

const MONTHS = [
	'Janvier',
	'Février',
	'Mars',
	'Avril',
	'Mai',
	'Juin',
	'Juillet',
	'Août',
	'Septembre',
	'Octobre',
	'Novembre',
	'Décembre',
];

interface DateRangeProps {
	selectedMonth: { year: number; month: number };
	onPeriodChange: (year: number, month: number) => void;
	// Ajout pour le filtre catégorie
	categories: Array<{ id: string; name: string }>;
	selectedCategoryId: string;
	onCategoryFilterChange: (categoryId: string) => void;
}

export function DateRange(props: DateRangeProps) {
	const { year, month } = props.selectedMonth;
	function goToPreviousMonth() {
		let newMonth = month - 1;
		let newYear = year;
		if (newMonth < 0) {
			newMonth = 11;
			newYear--;
		}
		props.onPeriodChange(newYear, newMonth);
	}
	function goToNextMonth() {
		let newMonth = month + 1;
		let newYear = year;
		if (newMonth > 11) {
			newMonth = 0;
			newYear++;
		}
		props.onPeriodChange(newYear, newMonth);
	}
	// Affichage de la date du jour dans la barre de navigation du mois (challenge bonus)
	const today = new Date();
	const todayString = today.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
	const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
	return createElement(
		'div',
		{ className: 'flex flex-col items-center justify-center gap-2 p-4 bg-rose-200 text-rose-700 rounded text-xl font-bold' },
		{},
		[
			createElement('div', { className: 'flex items-center justify-center gap-4' }, {}, [
				createElement('button', { className: 'rounded bg-rose-300 px-2 py-1', type: 'button' }, { click: goToPreviousMonth }, '<'),
				createElement('span', {}, {}, `${MONTHS[month]} ${year}`),
				createElement('button', { className: 'rounded bg-rose-300 px-2 py-1', type: 'button' }, { click: goToNextMonth }, '>'),
			]),
			isCurrentMonth ? createElement('div', { className: 'text-base font-normal text-rose-800' }, {}, todayString) : null,
			// Ajout du filtre catégorie sous la date
			createElement('div', { className: 'w-full flex justify-center mt-2' }, {}, [
				createElement(
					'select',
					{
						className: 'rounded border px-2 py-1 text-base text-rose-700',
						value: props.selectedCategoryId,
						name: 'category-filter',
					},
					{
						change: (e: Event) => {
							const target = e.target as HTMLSelectElement;
							props.onCategoryFilterChange(target.value);
						},
					},
					[
						createElement('option', { value: '' }, {}, 'Toutes les catégories'),
						...props.categories.map((cat) =>
							createElement('option', { value: cat.id }, {}, cat.name)
						),
					]
				),
			]),
		],
	);
}
