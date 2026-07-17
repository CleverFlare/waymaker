<script>
    import ScrubNumberField from "./components/ui/ScrubNumberField.svelte";
    let value = $state(1);
</script>
<ScrubNumberField label="something" value={value} onChange={(v) => value = v} />
