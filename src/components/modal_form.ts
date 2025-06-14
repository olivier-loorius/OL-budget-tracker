import { type Currency, Transaction, type TransactionType } from '../models/transaction';
import { createElement } from '../renderer/utils';
import { formatDateToInput } from '../utils';
import { ModalField, ModalSelect } from './modal_input';

interface Props {
	transaction?: Transaction | undefined;
	categories: Array<[string, string]>;
	onSubmit(values: FormData): void;
}

export function ModalForm(props: Props) {
	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (event.currentTarget instanceof HTMLFormElement) {
			const formData = new FormData(event.currentTarget);

			if (props.transaction) {
				formData.set('operation-id', props.transaction.id);
			}

			props.onSubmit(formData);
			event.currentTarget.reset();
		}
	}

	return createElement(
		'form',
		{
			className: 'grid gap-4 p-4',
		},
		{
			submit: handleSubmit,
		},
		[
			createElement('div', { className: 'grid gap-4' }, {}, [
				ModalField({
					inputType: 'date',
					name: 'operation-date',
					label: "Date de l'opération",
					required: true,
					value: props.transaction ? formatDateToInput(props.transaction?.operatedAt) : formatDateToInput(new Date()),
				}),
				ModalField({
					inputType: 'text',
					name: 'operation-description',
					label: 'Description',
					required: true,
					value: props.transaction?.label,
				}),
				ModalField({
					inputType: 'number',
					name: 'operation-amount',
					label: 'Montant',
					required: true,
					value: props.transaction?.amount.toString()
				}),
				ModalSelect({
					name: 'operation-type',
					label: 'Type',
					required: true,
					options: ['income', 'expense'] satisfies Array<TransactionType>,
					value: props.transaction?.type,
				}),
				ModalSelect({
					name: 'operation-currency',
					label: 'Devise',
					required: true,
					options: ['USD', 'EUR'] satisfies Array<Currency>,
					value: props.transaction?.currency,
				}),
				ModalSelect({
					name: 'operation-category',
					label: 'Catégorie',
					required: true,
					options: ['', ...props.categories],
					value: props.transaction?.category?.id,
				}),
				createElement(
					'button',
					{
						type: 'submit',
						className:
							'p-3 rounded bg-emerald-700 text-emerald-50 text-center transition-colors hover:bg-emerald-800',
					},
					{},
					props.transaction ? 'Sauvegarder les modifications' : 'Ajouter',
				),
			]),
		],
	);
}
