import { useCallback } from 'react'
import { Reorder, useDragControls, motion } from 'framer-motion'
import { nanoid } from 'nanoid'

export interface LocationItem {
  id: string
  name: string
  isExisting?: boolean
}

interface Props {
  items: LocationItem[]
  onChange: (items: LocationItem[]) => void
}

export function LocationListEditor({ items, onChange }: Props) {
  const addItem = useCallback(() => {
    onChange([...items, { id: nanoid(), name: '', isExisting: false }])
  }, [items, onChange])

  const updateItem = useCallback(
    (id: string, name: string) => {
      onChange(items.map((it) => (it.id === id ? { ...it, name } : it)))
    },
    [items, onChange]
  )

  const deleteItem = useCallback(
    (id: string) => {
      onChange(items.filter((it) => it.id !== id))
    },
    [items, onChange]
  )

  return (
    <div>
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={onChange}
        style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {items.map((item, index) => (
          <DraggableItem
            key={item.id}
            item={item}
            index={index}
            isOnly={items.length === 1}
            onNameChange={(name) => updateItem(item.id, name)}
            onDelete={() => deleteItem(item.id)}
            autoFocus={!item.isExisting && index === items.length - 1 && item.name === ''}
          />
        ))}
      </Reorder.Group>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={addItem}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '9px',
          background: 'none',
          border: '1.5px dashed var(--border)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'border-color var(--transition), color var(--transition)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Add location
      </motion.button>
    </div>
  )
}

function DraggableItem({
  item,
  index,
  isOnly,
  onNameChange,
  onDelete,
  autoFocus,
}: {
  item: LocationItem
  index: number
  isOnly: boolean
  onNameChange: (name: string) => void
  onDelete: () => void
  autoFocus?: boolean
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      style={{ listStyle: 'none' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 10px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {/* Order badge */}
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.62rem',
            fontWeight: 700,
            color: 'var(--accent)',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          {index + 1}
        </span>

        {/* Name input */}
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          value={item.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Location name…"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: '0.88rem',
            color: 'var(--text-primary)',
            padding: 0,
          }}
        />

        {/* Existing badge */}
        {item.isExisting && (
          <span
            style={{
              fontSize: '0.62rem',
              color: 'var(--text-muted)',
              padding: '1px 7px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 99,
              flexShrink: 0,
            }}
          >
            saved
          </span>
        )}

        {/* Drag handle */}
        <motion.div
          onPointerDown={(e) => controls.start(e)}
          whileHover={{ color: 'var(--text-primary)' }}
          style={{
            cursor: 'grab',
            color: 'var(--text-muted)',
            display: 'flex',
            padding: '0 2px',
            touchAction: 'none',
            flexShrink: 0,
          }}
          title="Drag to reorder"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </motion.div>

        {/* Delete */}
        {!isOnly && (
          <button
            onClick={onDelete}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              padding: '0 2px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>
    </Reorder.Item>
  )
}
