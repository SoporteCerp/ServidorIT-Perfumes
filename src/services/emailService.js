import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_6kdst2n';
const TEMPLATE_ID = 'template_5ecnzjz';
const PUBLIC_KEY = 'M35w-x23EKr9q0yzg';

export const sendInvoice = async (orderData) => {
  const itemsText = orderData.items
    .map(item => `- ${item.name} (${item.brand}) x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const templateParams = {
    customer_name: orderData.customerName,
    customer_email: orderData.customerEmail,
    order_id: orderData.orderId,
    items: itemsText,
    total: `$${orderData.total.toFixed(2)}`,
    date: new Date().toLocaleDateString('es-ES'),
  };

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );
    console.log('Email enviado:', response);
    return true;
  } catch (error) {
    console.error('Error al enviar email:', error);
    return false;
  }
};
