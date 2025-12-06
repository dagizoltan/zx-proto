import { h } from 'preact';

export const SettingsPage = ({ user, config }) => {
  return (
    <div class="settings-page">
      <div class="page-header">
        <h1>System Settings</h1>
      </div>

      <div class="card mb-6">
        <h3>Environment Configuration</h3>
        <div class="table-container">
            <table class="table-simple">
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(config).map(([key, value]) => (
                        <tr>
                            <td class="font-mono text-sm font-bold">{key}</td>
                            <td class="font-mono text-sm">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <div class="alert alert-info">
        Settings are currently read-only and managed via environment variables.
      </div>
    </div>
  );
};
