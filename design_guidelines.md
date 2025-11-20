# Design Guidelines: Order Execution Engine Dashboard

## Design Approach
**Selected Framework**: Design System Approach (Carbon Design + Trading Platform Patterns)

**Justification**: This is a utility-focused trading application prioritizing efficiency, data density, and real-time monitoring. Drawing from Carbon Design System for enterprise data applications and trading platforms like Robinhood and Coinbase for financial UX patterns.

**Core Principles**:
- Information clarity over visual flair
- Immediate status visibility
- Efficient order submission workflow
- Real-time data streaming emphasis

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, and 8
- Component padding: p-4, p-6
- Section spacing: space-y-4, space-y-6
- Card gaps: gap-4
- Button spacing: px-6 py-3

**Grid Structure**:
- Main dashboard: Two-column layout (60/40 split) on desktop
- Left: Order submission + Active orders list
- Right: Order history + DEX routing logs
- Mobile: Single column stack

**Container Strategy**:
- Max-width: max-w-7xl mx-auto
- Full-height layouts with overflow handling
- Fixed header, scrollable content areas

## Typography

**Font Family**: 
- Primary: Inter (Google Fonts) - excellent for data-heavy interfaces
- Monospace: JetBrains Mono - for transaction hashes, order IDs, numbers

**Hierarchy**:
- Page title: text-2xl font-semibold
- Section headers: text-lg font-medium
- Body text: text-base font-normal
- Data labels: text-sm font-medium uppercase tracking-wide
- Numeric data: text-base font-mono
- Timestamps: text-xs font-normal
- Status badges: text-xs font-semibold uppercase

## Component Library

### Navigation
**Top Header Bar** (h-16):
- Logo/app name (left)
- Connection status indicator (right)
- Wallet balance display (if applicable)
- Settings icon (right)

### Order Submission Panel
**Card-based form**:
- Order type selector (disabled/grayed out for unimplemented types)
- Token pair selector (dropdown or search)
- Amount input (large, prominent)
- Estimated execution price display
- Slippage tolerance setting
- Submit button (w-full, py-4, font-semibold)

### Real-Time Status Display
**WebSocket Order Cards**:
- Order ID (monospace, truncated with copy button)
- Status badge (prominent, auto-updating)
- Progress indicator: Linear progress bar showing lifecycle stages
- DEX routing decision (Raydium vs Meteora comparison)
- Timestamp updates
- Expandable section for detailed logs

**Status Badge States**:
- pending: Subtle treatment
- routing: Animated pulse
- building: Processing indicator
- submitted: Transition state
- confirmed: Success state with checkmark
- failed: Error state with retry option

### DEX Comparison Table
**Side-by-side price display**:
- Two-column comparison (Raydium | Meteora)
- Price difference percentage (highlighted if >2%)
- Liquidity indicators
- Selected venue marked clearly
- Update timestamp

### Order Lists
**Active Orders Section**:
- Table/card list with live updates
- Sortable by time, status, amount
- Quick filter by status
- Each row: ID, pair, amount, status, time
- Auto-scroll to newest on submission

**Order History Section**:
- Paginated table view
- Columns: ID, timestamp, pair, amount, DEX used, final price, tx hash (with explorer link)
- Date range filter
- Export functionality button

### Transaction Logs Panel
**Console-style display**:
- Monospace font
- Reverse chronological order
- Color-coded log levels
- Auto-scroll toggle
- Search/filter functionality
- Timestamp prefix for each entry

## Animations
**Minimal, purposeful only**:
- Status badge transitions (0.2s ease)
- Progress bar fill animation (smooth, continuous)
- New order entry fade-in (0.3s)
- Routing comparison flash on selection
- NO complex animations, NO hover effects beyond standard button states

## Images
**No Hero Images**: This is a dashboard application, not a marketing site.

**Icon Usage**: Material Icons via CDN
- Status icons (check, clock, alert, error)
- Copy icon for IDs/hashes
- External link icon for transaction explorer
- Refresh icon for manual updates
- Settings/gear icon

## Accessibility
- All form inputs with visible labels
- Status updates announced to screen readers
- Keyboard navigation for all interactive elements
- Focus indicators on all controls
- Error messages directly associated with inputs
- Consistent tab order through submission flow

## Special Considerations
**Real-Time Updates**:
- Visual pulse on status changes
- Subtle background flash on new order
- Connection lost indicator prominent
- Reconnection auto-handling

**Data Density**:
- Compact rows in tables
- Efficient use of space
- No excessive whitespace
- Information prioritized over aesthetics

**Error Handling UI**:
- Inline error messages
- Failed order cards remain visible with retry option
- Network error banner at top
- Toast notifications for critical events