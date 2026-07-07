import { useEffect, useState } from "react"
import { Box3, MathUtils, Mesh, Vector3 } from "three"
import { useSceneStore, type Vec3, type ImagePlaneNode } from "@/store/sceneStore"
import { ScrubNumberField } from "@/components/ui/scrub-number-field"
import { Button } from "@/components/ui/button"

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

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-foreground">{label}</span>
      <Button
        variant={value ? "default" : "outline"}
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={onToggle}
      >
        {value ? "On" : "Off"}
      </Button>
    </div>
  )
}

export function PropertiesPanel() {
  const selectedUuid = useSceneStore((s) => s.selectedUuid)
  const nodes = useSceneStore((s) => s.nodes)
  const getObject = useSceneStore((s) => s.getObject)
  const updateNode = useSceneStore((s) => s.updateNode)

  const [pos, setPos] = useState<Vec3>([0, 0, 0])
  const [rot, setRot] = useState<Vec3>([0, 0, 0])
  const [scale, setScale] = useState<Vec3>([1, 1, 1])

  useEffect(() => {
    if (!selectedUuid) return
    const node = nodes[selectedUuid]
    if (!node) return
    setPos(node.position)
    setRot(node.rotation.map(MathUtils.radToDeg) as Vec3)
    setScale(node.scale)
  }, [selectedUuid])

  if (!selectedUuid) return null
  const node = nodes[selectedUuid]
  const obj = getObject(selectedUuid)
  if (!node || !obj) return null

  const handlePos = (axis: 0 | 1 | 2, val: number) => {
    const keys = ["x", "y", "z"] as const
    obj.position[keys[axis]] = val
    const next = [...node.position] as Vec3
    next[axis] = val
    updateNode(selectedUuid, { position: next })
    setPos((prev) => { const n = [...prev] as Vec3; n[axis] = val; return n })
  }

  const handleRot = (axis: 0 | 1 | 2, val: number) => {
    const keys = ["x", "y", "z"] as const
    const rad = MathUtils.degToRad(val)
    obj.rotation[keys[axis]] = rad
    const next = [...node.rotation] as Vec3
    next[axis] = rad
    updateNode(selectedUuid, { rotation: next })
    setRot((prev) => { const n = [...prev] as Vec3; n[axis] = val; return n })
  }

  const handleScale = (axis: 0 | 1 | 2, val: number) => {
    const keys = ["x", "y", "z"] as const
    obj.scale[keys[axis]] = val
    const next = [...node.scale] as Vec3
    next[axis] = val
    updateNode(selectedUuid, { scale: next })
    setScale((prev) => { const n = [...prev] as Vec3; n[axis] = val; return n })
  }

  const handleCenterPivot = () => {
    obj.updateWorldMatrix(true, true)

    const box = new Box3().setFromObject(obj)
    if (box.isEmpty()) return

    const W_center = new Vector3()
    box.getCenter(W_center)

    const C_O = obj.worldToLocal(W_center.clone())

    for (const child of obj.children) {
      child.position.sub(C_O)
      child.updateMatrix()
    }

    if (obj instanceof Mesh && obj.geometry) {
      obj.geometry.translate(-C_O.x, -C_O.y, -C_O.z)
    }

    const newPos = obj.parent
      ? obj.parent.worldToLocal(W_center.clone())
      : W_center.clone()
    obj.position.copy(newPos)
    obj.updateMatrix()
    obj.updateMatrixWorld(true)

    const p: Vec3 = [obj.position.x, obj.position.y, obj.position.z]
    updateNode(selectedUuid, { position: p })
    setPos(p)
  }

  const isImagePlane = node.type === "ImagePlane"
  const ipNode = isImagePlane ? node as ImagePlaneNode : null

  const transforms = (
    <>
      <Vec3Section label="Position" values={pos} onAxisChange={handlePos} step={0.1} format={POS_FORMAT} />
      <Vec3Section label="Rotation" values={rot} onAxisChange={handleRot} step={1} format={ROT_FORMAT} />
      <Vec3Section label="Scale" values={scale} onAxisChange={handleScale} step={0.01} format={SCALE_FORMAT} />
    </>
  )

  return (
    <aside className="absolute right-4 top-4 z-10 w-56 flex flex-col rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden max-h-[calc(100%-2rem)]">
      <div className="px-3 py-2 border-b border-border shrink-0">
        <p className="text-sm font-medium text-foreground truncate">{node.name}</p>
        <p className="text-xs text-muted-foreground">{node.type}</p>
      </div>
      {ipNode ? (
        <div className="min-h-0 overflow-y-auto p-3 space-y-4">
          {transforms}
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Image</p>
            <ToggleRow
              label="Billboard"
              value={ipNode.billboard}
              onToggle={() => updateNode(selectedUuid, { billboard: !ipNode.billboard })}
            />
            <ToggleRow
              label="Size Attenuation"
              value={ipNode.sizeAttenuation}
              onToggle={() => updateNode(selectedUuid, {
                sizeAttenuation: !ipNode.sizeAttenuation,
                sizeAttenuationRef: ipNode.sizeAttenuation ? null : ipNode.sizeAttenuationRef,
              })}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-0 overflow-y-auto p-3 space-y-4">
          {transforms}
          <Button variant="outline" size="sm" className="w-full" onClick={handleCenterPivot}>
            Center Pivot
          </Button>
        </div>
      )}
    </aside>
  )
}
