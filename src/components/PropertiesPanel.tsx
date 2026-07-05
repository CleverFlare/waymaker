import { useEffect, useState } from "react"
import { MathUtils } from "three"
import { useSceneStore } from "@/store/sceneStore"
import { ScrubNumberField } from "@/components/ui/scrub-number-field"

type Vec3 = [number, number, number]

const AXES = ["X", "Y", "Z"] as const

const POS_FORMAT: Intl.NumberFormatOptions = { minimumFractionDigits: 3, maximumFractionDigits: 3 }
const ROT_FORMAT: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 }
const SCALE_FORMAT: Intl.NumberFormatOptions = { minimumFractionDigits: 3, maximumFractionDigits: 3 }

function Vec3Section({
  label,
  values,
  onAxisChange,
  step,
  format,
}: {
  label: string
  values: Vec3
  onAxisChange: (axis: 0 | 1 | 2, value: number) => void
  step: number
  format: Intl.NumberFormatOptions
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="space-y-0.5">
        {AXES.map((axis, i) => (
          <ScrubNumberField
            key={axis}
            label={axis}
            value={values[i]}
            onChange={(val) => onAxisChange(i as 0 | 1 | 2, val)}
            step={step}
            format={format}
          />
        ))}
      </div>
    </div>
  )
}

export function PropertiesPanel() {
  const selectedUuid = useSceneStore((s) => s.selectedUuid)
  const nodes = useSceneStore((s) => s.nodes)
  const getObject = useSceneStore((s) => s.getObject)

  const [pos, setPos] = useState<Vec3>([0, 0, 0])
  const [rot, setRot] = useState<Vec3>([0, 0, 0])
  const [scale, setScale] = useState<Vec3>([1, 1, 1])

  useEffect(() => {
    if (!selectedUuid) return
    const obj = getObject(selectedUuid)
    if (!obj) return
    setPos([obj.position.x, obj.position.y, obj.position.z])
    setRot([
      MathUtils.radToDeg(obj.rotation.x),
      MathUtils.radToDeg(obj.rotation.y),
      MathUtils.radToDeg(obj.rotation.z),
    ])
    setScale([obj.scale.x, obj.scale.y, obj.scale.z])
  }, [selectedUuid])

  if (!selectedUuid) return null
  const node = nodes[selectedUuid]
  const obj = getObject(selectedUuid)
  if (!node || !obj) return null

  const handlePos = (axis: 0 | 1 | 2, val: number) => {
    const keys = ["x", "y", "z"] as const
    obj.position[keys[axis]] = val
    setPos((prev) => { const next = [...prev] as Vec3; next[axis] = val; return next })
  }

  const handleRot = (axis: 0 | 1 | 2, val: number) => {
    const keys = ["x", "y", "z"] as const
    obj.rotation[keys[axis]] = MathUtils.degToRad(val)
    setRot((prev) => { const next = [...prev] as Vec3; next[axis] = val; return next })
  }

  const handleScale = (axis: 0 | 1 | 2, val: number) => {
    const keys = ["x", "y", "z"] as const
    obj.scale[keys[axis]] = val
    setScale((prev) => { const next = [...prev] as Vec3; next[axis] = val; return next })
  }

  return (
    <aside className="absolute right-4 top-4 z-10 w-56 flex flex-col rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden max-h-[calc(100%-2rem)]">
      <div className="px-3 py-2 border-b border-border shrink-0">
        <p className="text-sm font-medium text-foreground truncate">{node.name}</p>
        <p className="text-xs text-muted-foreground">{node.type}</p>
      </div>
      <div className="min-h-0 overflow-y-auto p-3 space-y-4">
        <Vec3Section label="Position" values={pos} onAxisChange={handlePos} step={0.1} format={POS_FORMAT} />
        <Vec3Section label="Rotation" values={rot} onAxisChange={handleRot} step={1} format={ROT_FORMAT} />
        <Vec3Section label="Scale" values={scale} onAxisChange={handleScale} step={0.01} format={SCALE_FORMAT} />
      </div>
    </aside>
  )
}
