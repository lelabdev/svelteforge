// === Root-level components ===
export { default as Accordion } from './Accordion.svelte';
export { default as AuthCard } from './AuthCard.svelte';
export { default as Divider } from './Divider.svelte';
export { default as NavigationLoader } from './NavigationLoader.svelte';
export { default as NotificationBadge } from './NotificationBadge.svelte';

// === Feedback ===
export { default as Alert } from './feedback/Alert.svelte';
/** @deprecated Use Alert with variant="error" instead */
export { default as ErrorAlert } from './feedback/ErrorAlert.svelte';
export { default as Loader } from './feedback/Loader.svelte';
export { default as EmptyState } from './feedback/EmptyState.svelte';
export { default as SkeletonLoader } from './feedback/SkeletonLoader.svelte';
/** @deprecated Use Alert with variant="success" instead */
export { default as SuccessAlert } from './feedback/SuccessAlert.svelte';
export { default as Toast } from './feedback/Toast.svelte';
export { addToast, removeToast } from './feedback/toast-state.svelte';

// === Data Display ===
export { default as Avatar } from './data-display/Avatar.svelte';
export { default as Badge } from './data-display/Badge.svelte';
export { default as Breadcrumb } from './data-display/Breadcrumb.svelte';
export { default as Card } from './data-display/Card.svelte';
export { default as DataTable } from './data-display/DataTable.svelte';
export { default as Progress } from './data-display/Progress.svelte';

// === Navigation ===
export { default as Carousel } from './navigation/Carousel.svelte';
export { default as Menu } from './navigation/Menu.svelte';
export { default as Stepper } from './navigation/Stepper.svelte';
export { default as Tabs } from './navigation/Tabs.svelte';

// === Overlay ===
export { default as ConfirmDialog } from './overlay/ConfirmDialog.svelte';
export { default as Modal } from './overlay/Modal.svelte';
export { default as PopOver } from './overlay/PopOver.svelte';
export { default as Sheet } from './overlay/Sheet.svelte';
export { default as Tooltip } from './overlay/Tooltip.svelte';

// === Input ===
export { default as Button } from './input/Button.svelte';
export { default as RadioGroup } from './input/RadioGroup.svelte';
export { default as SearchInput } from './input/SearchInput.svelte';
export { default as Switch } from './input/Switch.svelte';
export { default as ThemeToggle } from './input/ThemeToggle.svelte';

// === Form ===
export * from './form';
