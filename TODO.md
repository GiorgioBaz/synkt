# General Synkt TODOs

## Optimization & Refinement
- [ ] **Dark Mode / Light Mode Audit**: Review all components (especially the Calendar Integration screen) to ensure they look premium in both modes. Dark mode is currently prioritized, but light mode accessibility needs a pass.
- [ ] **Infrastructure / Testing**: Remember to update the Google OAuth Redirect URL and Backend `.env` whenever ngrok is restarted, as the tunnel URL changes.
- [ ] **Multiple Calendars**: Allow users to select specific sub-calendars to sync (currently defaults to 'primary').
- [ ] **Real-time Sync**: Implement Google Push Notifications (Webhooks) for background updates.

## Performance
- [ ] Cache calendar sync results in local SQLite for faster initial app load.
- [ ] Optimize availability calculation algorithm for larger group sizes.
