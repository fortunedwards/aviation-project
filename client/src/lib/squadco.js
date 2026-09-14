const SQUAD_SCRIPT_URL = 'https://checkout.squadco.com/widget/squad.min.js';

let scriptPromise;

const loadSquadScript = () => {
  if (window.squad) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SQUAD_SCRIPT_URL;
    script.async = true;
    script.onload = () => window.squad ? resolve() : reject(new Error('Squad payment modal did not load.'));
    script.onerror = () => reject(new Error('Could not load the Squad payment modal.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
};

export const openSquadPaymentModal = async ({ email, amount, reference, customerName, onSuccess, onClose }) => {
  const key = import.meta.env.VITE_SQUAD_PUBLIC_KEY;
  if (!key) throw new Error('Squad payment is not configured.');
  await loadSquadScript();
  const checkout = new window.squad({
    key,
    email,
    amount: Math.round(Number(amount) * 100),
    currency_code: 'NGN',
    transaction_ref: reference,
    customer_name: customerName || undefined,
    onSuccess,
    onClose,
  });
  checkout.setup();
  checkout.open();
};
