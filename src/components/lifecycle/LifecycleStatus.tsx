import { LifecycleBlock } from './LifecycleBlock';
import { LifecycleChip } from './LifecycleChip';
import { LifecycleTiles } from './LifecycleTiles';
import { LIFECYCLE_VALUES, type LifecycleValue } from './lifecycleConstants';

type LifecycleStatusProps = {
  value: LifecycleValue | string;
  canEdit: boolean;
  disabled?: boolean;
  options?: readonly LifecycleValue[];
  onChange?: (next: LifecycleValue) => void;
};

export function LifecycleStatus({
  value,
  canEdit,
  disabled,
  options = LIFECYCLE_VALUES,
  onChange,
}: LifecycleStatusProps) {
  if (!canEdit) {
    return <LifecycleBlock control={<LifecycleChip value={String(value)} />} />;
  }

  return (
    <LifecycleBlock
      control={
        <LifecycleTiles
          value={value as LifecycleValue}
          disabled={disabled}
          options={options}
          onChange={(next) => onChange?.(next)}
        />
      }
    />
  );
}
