import { h } from 'preact';

export const NotificationToast = ({ message, type = 'info', onClose }) => {
  return (
    <div class={`toast toast-${type}`}>
      <span class="message">{message}</span>
      <button class="close-btn" onClick={onClose}>&times;</button>
    </div>
  );
};
