# SpendWise UI/UX Architecture

## Product Direction

SpendWise should feel like a premium fintech workspace: calm, intelligent, trustworthy, and highly scannable. The experience is desktop-first with a left navigation rail, a utility-heavy top bar, rounded cards, soft mint-to-cream gradients, subtle shadows, and AI interactions that always explain themselves.

## 1. Screen And Page Inventory

| Module             | Routes / screens                                                                                                   | Key states                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Marketing          | `/`                                                                                                                | module preview, CTA states                                            |
| Authentication     | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`                                      | loading, inline validation, success, recovery                         |
| Onboarding         | `/onboarding/welcome`, `/onboarding/setup`, `/onboarding/preferences`, `/onboarding/goals`, `/onboarding/complete` | progress, optional skip, completion                                   |
| Dashboard          | `/dashboard`                                                                                                       | loading, alert, AI summary, empty cards when data is sparse           |
| Transactions       | `/transactions`                                                                                                    | add form, list, detail, empty review bucket, destructive confirmation |
| Categories         | `/categories`                                                                                                      | default categories, custom category form, empty custom state          |
| Budgets            | `/budgets`                                                                                                         | safe, warning, exceeded, create/edit states                           |
| AI Insights        | `/insights`                                                                                                        | insight cards, evidence, recommendation, transparency pattern         |
| Anomaly Detection  | `/anomalies`                                                                                                       | alert list, alert detail, confirm or dismiss                          |
| Forecasting        | `/forecasts`                                                                                                       | chart, category forecast, confidence, risk states                     |
| Reports            | `/reports`                                                                                                         | filters, comparison charts, export, print layout                      |
| Recurring Expenses | `/recurring`                                                                                                       | recurring list, upcoming charges, status states                       |
| Goals              | `/goals`                                                                                                           | goal cards, goal creation, opportunity suggestions                    |
| Notifications      | `/notifications`                                                                                                   | grouped inbox, read or unread, preference toggles                     |
| Profile            | `/profile`                                                                                                         | profile header, personal details, avatar change                       |
| Settings           | `/settings`                                                                                                        | grouped cards, security actions, export and delete placeholders       |
| Help / Support     | `/help`                                                                                                            | FAQs, support entry, contextual guidance                              |

## 2. Information Architecture

### Global navigation

- Primary desktop sidebar: Dashboard, Transactions, Budgets, Insights, Forecasts, Reports, Recurring, Goals
- Secondary workspace links: Alerts, Notifications, Categories, Profile, Settings, Help
- Top bar: search, export, add expense, notifications, help, profile switcher
- Mobile bottom nav: Dashboard, Transactions, Budgets, Insights, Notifications
- Mobile floating action button: Add expense

### Content hierarchy

- Level 1: financial health and urgent actions
- Level 2: analysis, explanation, and category context
- Level 3: preferences, profile, support, and system controls

## 3. Major User Flows

1. Authentication: Landing -> Register -> Verify email -> Onboarding welcome -> Dashboard
2. Returning sign-in: Login -> Dashboard -> Review alerts or recent activity
3. Expense capture: Dashboard quick action -> Transactions -> Add expense -> Save -> Inline success -> Updated list
4. Budget review: Dashboard budget card -> Budgets -> Inspect near-limit category -> Edit or create budget
5. Insight review: Dashboard AI card -> Insights -> Read summary -> Open "Why am I seeing this?" -> Save recommendation
6. Alert triage: Dashboard or Notifications -> Alerts -> Review reason -> Mark normal, important, or dismiss
7. Forecast planning: Dashboard forecast preview -> Forecasts -> Review category risk -> Adjust plans -> Save
8. Monthly review: Reports -> Set date range -> Compare periods -> Export PDF or CSV -> Print summary
9. Recurring management: Recurring -> Review upcoming charges -> Mark transaction recurring -> Reclassify fixed costs
10. Goal loop: Goals -> Create target -> Review suggested savings opportunities -> Track milestones over time

## 4. Layout Recommendations By Screen

| Area          | Layout recommendation                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Auth          | split layout with branded trust panel on the left and focused form panel on the right                             |
| Onboarding    | progress rail on desktop, stacked progress indicator on mobile, one decision group per step                       |
| Dashboard     | hero header, 4 summary cards, 2-column analytics band, lower grid for budgets, transactions, AI, alerts, forecast |
| Transactions  | filter row on top, list pane plus detail or form pane on desktop, stacked cards on mobile                         |
| Categories    | visual card grid plus management column                                                                           |
| Budgets       | metric row, category budget card grid, side column for create form and alert patterns                             |
| Insights      | supporting chart plus transparency card on top, stacked insight cards below                                       |
| Anomalies     | alerts list and alert detail in 2 columns                                                                         |
| Forecasts     | metric row, main chart, summary card, category forecast cards, risk indicators                                    |
| Reports       | control bar, 2 analytic charts, lower band for budget performance and printable summary                           |
| Recurring     | summary column plus recurring payments list                                                                       |
| Goals         | progress column plus creation and recommendation column                                                           |
| Notifications | inbox list plus preference column                                                                                 |
| Profile       | avatar summary card plus detail grid                                                                              |
| Settings      | grouped setting cards with dedicated side area for security and destructive actions                               |
| Help          | FAQ column plus support and contextual help column                                                                |

## 5. Component System

- App shell: desktop sidebar, sticky top bar, bottom mobile nav, floating add CTA
- Summary metric card: label, value, change badge, helper text, optional icon
- Surface card: default, muted, mint, inverse variants
- Insight card: label badge, summary, supporting evidence, recommendation CTA
- Alert card: severity badge, reason, action, status control
- Budget progress bar: safe, warning, danger, and neutral progress states
- Transaction row: merchant, category chip, note, date, method, amount, quick status
- Category chip: icon or color token plus short label
- Filter controls: search, date range, category pills, payment method selector
- Form fields: rounded inputs, inline helper text, validation slots
- Modal and confirmation pattern: centered confirmation with clear consequences and reversible escape
- Empty state: icon, calm explanation, next best action
- Toast pattern: non-blocking confirmation after save, update, dismiss, and delete
- Chart cards: readable axes, compact legend, soft tooltip, low-noise gridlines

## 6. Visual Styling Rules

- Primary text and anchors: deep navy `#13263F`
- Main backgrounds: warm cream `#F8F5ED`
- Secondary surfaces: white `#FFFDF9` with subtle transparency
- Section tints: sage `#DFE9E0`, mint `#D7EAE4`
- Accent and CTA: teal `#0F7B71`
- Positive state: emerald `#157B63`
- Warning state: amber `#CE9844`
- Risk state: muted coral `#C76D58`
- Border system: cool gray with low-opacity strokes
- Radius system: `20px` to `36px`
- Shadow system: soft vertical depth, never heavy drop shadows
- Type system: Plus Jakarta Sans for UI hierarchy, Fraunces for premium display emphasis
- Chart style: soft grids, restrained legends, one strong accent line at a time

## 7. UX Behavior Notes By Module

| Module        | Behavior guidance                                                                        |
| ------------- | ---------------------------------------------------------------------------------------- |
| Auth          | short forms, supportive copy, inline recovery, trust cues near primary action            |
| Onboarding    | 5 short steps, progress visibility, optional skip, no dense forms                        |
| Dashboard     | answer current state in one glance, keep AI concise, surface only highest-signal alerts  |
| Transactions  | optimize for speed, preserve entered data on validation errors, keep edit actions nearby |
| Categories    | simple iconography, strong naming, limited color palette, avoid visual clutter           |
| Budgets       | show remaining amount and pace, warn early, make exceeded state clear but calm           |
| Insights      | lead with summary, reveal evidence second, always explain why the insight appeared       |
| Anomalies     | describe the reason in plain language, pair with direct confirm or dismiss controls      |
| Forecasts     | show confidence, provide category context, avoid deterministic language                  |
| Reports       | prioritize comparison and interpretation over decorative visuals                         |
| Recurring     | make upcoming charges time-based and obvious, group fixed obligations cleanly            |
| Goals         | highlight progress and encouragement, connect suggestions directly to goal movement      |
| Notifications | group by urgency and category, avoid noisy defaults                                      |
| Profile       | keep short and identity-focused                                                          |
| Settings      | group by mental model, protect destructive actions with confirmation                     |
| Help          | keep feature explanations contextual and easy to reach from related modules              |

## 8. Responsive Behavior

- Desktop: persistent sidebar, sticky top bar, 2-column and 3-column analytical layouts
- Tablet: collapse the sidebar width, stack some analytical bands, keep top bar actions visible
- Mobile: replace sidebar with bottom nav, move secondary actions into cards or menus, keep charts full-width
- Mobile charts: reduce label density, keep legends compact, pair every chart with a text summary
- Mobile transactions: switch from split-pane to stacked list then detail card
- Mobile forms: single-column inputs with persistent primary action button

## 9. Polished Microinteractions

- Sidebar and card hover lift of 2px to 4px with subtle shadow increase
- Loading skeletons on dashboard, tables, and auth submissions
- Progress bars animate width on load and on save
- Success toasts after save, update, dismiss, and delete
- Filter chips animate background and text color on selection
- Insight cards expand to reveal explanation or evidence
- Notification unread dot fades out when marked read
- Floating add button scales slightly on press
- Destructive confirmations use a short delay or secondary confirmation text, not sudden removal

## 10. Action Hierarchy

### Primary actions

- Add expense
- Create budget
- Save changes
- Continue onboarding
- Review insight or alert
- Export report

### Secondary actions

- Edit transaction
- View all
- Open settings group
- Mark recurring
- Refresh analysis
- Adjust assumptions

### Tertiary actions

- Dismiss alert
- Mark all read
- Skip onboarding step
- Cancel form
- Open helper text or explanation pattern

## State Design Rules

- Empty states should explain what is missing, why the area matters, and what to do next
- Loading states should use skeletons instead of spinners when layout is known
- Success states should confirm the outcome and point to the next useful action
- Error states should stay calm, preserve work, and provide a direct retry path
- Destructive actions should require confirmation and state consequences in plain language

## Implementation Notes

- Use the shared app shell and reusable surface, metric, badge, chart, and progress components before creating one-off patterns
- Keep route-level pages composition-driven so future API wiring can swap in live data without redesigning the layout
- Preserve explainability around AI outputs as a hard requirement, not a later enhancement
