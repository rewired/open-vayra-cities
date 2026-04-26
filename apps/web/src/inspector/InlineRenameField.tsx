import { useEffect, useState, type KeyboardEvent, type ReactElement } from 'react';

import { MaterialIcon } from '../ui/icons/MaterialIcon';

interface InlineRenameFieldProps {
  /** Current persisted entity label value. */
  readonly value: string;
  /** Accessible noun used in aria labels, for example "stop" or "line". */
  readonly entityLabel: string;
  /** Called when a valid accepted value should be committed. */
  readonly onAccept: (nextValue: string) => void;
}

/**
 * Renders a compact inline rename control with explicit edit/accept/cancel affordances.
 * Validation is local: accepted values are trimmed and cannot be empty.
 */
export function InlineRenameField({ value, entityLabel, onAccept }: InlineRenameFieldProps): ReactElement {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftValue, setDraftValue] = useState<string>(value);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value);
      setValidationMessage(null);
    }
  }, [isEditing, value]);

  const commitEdit = (): void => {
    const trimmedValue = draftValue.trim();
    if (trimmedValue.length === 0) {
      setValidationMessage('Name cannot be empty.');
      return;
    }

    onAccept(trimmedValue);
    setIsEditing(false);
    setValidationMessage(null);
  };

  const cancelEdit = (): void => {
    setIsEditing(false);
    setDraftValue(value);
    setValidationMessage(null);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitEdit();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  };

  if (!isEditing) {
    return (
      <div className="inline-rename-field">
        <span className="network-inventory__item-label" title={value}>
          {value}
        </span>
        <button
          type="button"
          className="inline-rename-field__icon-button"
          aria-label={`Rename ${entityLabel}`}
          title={`Rename ${entityLabel}`}
          onClick={(event) => {
            event.stopPropagation();
            setIsEditing(true);
            setDraftValue(value);
          }}
        >
          <MaterialIcon name="edit" />
        </button>
      </div>
    );
  }

  return (
    <div className="inline-rename-field" onClick={(event) => event.stopPropagation()}>
      <div className="inline-rename-field__editor-row">
        <input
          type="text"
          className="inline-rename-field__input"
          value={draftValue}
          aria-label={`${entityLabel} name`}
          onChange={(event) => {
            setDraftValue(event.currentTarget.value);
            if (validationMessage) {
              setValidationMessage(null);
            }
          }}
          onKeyDown={handleInputKeyDown}
          autoFocus
        />
        <button
          type="button"
          className="inline-rename-field__icon-button"
          aria-label={`Accept ${entityLabel} rename`}
          title="Accept"
          onClick={commitEdit}
        >
          <MaterialIcon name="check" />
        </button>
        <button
          type="button"
          className="inline-rename-field__icon-button"
          aria-label={`Cancel ${entityLabel} rename`}
          title="Cancel"
          onClick={cancelEdit}
        >
          <MaterialIcon name="close" />
        </button>
      </div>
      {validationMessage ? <p className="inline-rename-field__validation">{validationMessage}</p> : null}
    </div>
  );
}
