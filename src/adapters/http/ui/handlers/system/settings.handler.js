import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { SettingsPage } from '../../pages/ims/settings-page.jsx';

export const settingsHandler = async (c) => {
  const user = c.get('user');
  const configService = c.ctx.get('config');

  const config = configService ? configService.getAll() : {};

  const safeConfig = {};
  const sensitiveKeys = ['secret', 'key', 'password', 'token', 'credential'];

  for (const [key, value] of Object.entries(config)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          safeConfig[key] = '********';
      } else {
          safeConfig[key] = value;
      }
  }

  const html = await renderPage(SettingsPage, {
      user,
      config: safeConfig,
      activePage: 'settings',
      layout: AdminLayout,
      title: 'Settings - IMS Admin'
  });
  return c.html(html);
};
