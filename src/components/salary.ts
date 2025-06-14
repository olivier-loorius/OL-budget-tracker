import { createElement } from '../renderer/utils';
import { Button } from './button';
import { ModalField } from './modal_input';

interface SalaryFormProps {
	value?: number | undefined;
	onUpdate(salary: number): void;
}

export function SalaryForm(props: SalaryFormProps) {
	function handleBlur(event: FocusEvent) {
		if (!(event.currentTarget instanceof HTMLInputElement)) {
			return;
		}
		props.onUpdate(event.currentTarget.valueAsNumber);
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!(event.currentTarget instanceof HTMLFormElement)) {
			return;
		}
		props.onUpdate(event.currentTarget['amount'].valueAsNumber);
	}

	function handleClear(event: MouseEvent) {
		props.onUpdate(0);
		if (!(event.currentTarget instanceof HTMLButtonElement)) {
			return;
		}
		event.currentTarget.closest('form')?.reset();
	}

	return createElement('form', { className: 'flex items-end gap-2' }, { submit: handleSubmit }, [
		ModalField({
			inputType: 'number',
			name: 'amount',
			label: 'Salaire',
			required: true,
			value: props.value?.toString(),
			className: 'grow',
			events: { blur: handleBlur }
		}),
		Button({
			variant: 'square',
			action: 'secondary',
			icon: 'x',
			size: 'lg',
			className: 'shrink-0',
			events: { click: handleClear }
		})
	]);
}