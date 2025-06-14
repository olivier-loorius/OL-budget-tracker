// Modal animé ajout opération
import { createElement } from '../renderer/utils';

export function ModalFun() {
  const dialog = createElement(
    'dialog',
    {
      id: 'modal-fun',
      className:
        'w-full max-w-xs rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 bg-rose-50 border-4 border-rose-300',
      style: 'border: none; outline: none; background: rgba(255, 228, 235, 0.98);',
    },
    {},
    [
      createElement(
        'div',
        { className: 'animate-bounce text-7xl mb-3 drop-shadow-lg' },
        {},
        '🎉'
      ),
      createElement(
        'div',
        { className: 'text-2xl font-extrabold text-rose-700 mb-2 tracking-wide' },
        {},
        'Bravo !'
      ),
      createElement(
        'div',
        { className: 'text-base text-rose-600 mb-6 text-center' },
        {},
        'Opération ajoutée avec succès.'
      ),
      createElement(
        'button',
        {
          type: 'button',
          className:
            'mt-2 px-6 py-2 rounded-full bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition-colors text-lg',
        },
        {
          click: () => {
            dialog.close();
          },
        },
        'Fermer'
      ),
    ]
  );

  dialog.addEventListener('close', () => {
    dialog.remove();
  });

  return dialog;
}
